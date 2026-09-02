import { NextResponse } from "next/server";
import { FIELDS } from "@/lib/fields";
import { generateApplicationNumber, generateIdempotencyKey } from "@/lib/id";
import { loadPramanConfig, pushStatus } from "@/lib/praman";
import { applicationExists, saveApplication, type ApplicationRecord, type DocumentRef } from "@/lib/store";
import { normalizeDateInput, validateValue } from "@/lib/validation";

/**
 * Submit button on `/apply/return`. Builds the BTA-local application record from the
 * (possibly citizen-edited) Praman-sourced values, then immediately pushes
 * `under_review` back to Praman with `externalRef` = our own BTA26 reference, per
 * docs/05-API-AND-FLOWS.md F2 step 6 ("citizen sees application in tracker").
 */
export async function POST(request: Request) {
  const form = await request.formData();
  const pramanApplicationId = String(form.get("praman_application_id") ?? "");
  const pramanConsentId = String(form.get("praman_consent_id") ?? "");
  const pramanFormId = String(form.get("praman_form_id") ?? "");
  let documents: DocumentRef[] = [];
  try {
    documents = JSON.parse(String(form.get("praman_documents") ?? "[]"));
  } catch {
    documents = [];
  }

  const fields: Record<string, unknown> = {};
  const errors: Record<string, string> = {};
  for (const spec of FIELDS) {
    if (spec.kind === "file") {
      fields[spec.id] = String(form.get(spec.id) ?? "");
      continue;
    }
    const raw = form.get(spec.id);
    if (spec.isDate && typeof raw === "string" && raw) {
      const iso = normalizeDateInput(raw);
      if (!iso) { errors[spec.id] = "Enter a valid date."; continue; }
      fields[spec.id] = iso;
      continue;
    }
    const value = spec.kind === "checkbox" ? raw === "on" || raw === "true" || raw === "Yes" : typeof raw === "string" ? raw : "";
    const res = validateValue(spec, value as never);
    if (!res.ok) { errors[spec.id] = res.error ?? "Invalid value"; continue; }
    fields[spec.id] = res.value;
  }

  if (Object.keys(errors).length > 0) {
    return NextResponse.json({ ok: false, error: { code: "validation_failed", fields: errors } }, { status: 400 });
  }

  const ref = generateApplicationNumber(applicationExists);
  const now = new Date().toISOString();
  const record: ApplicationRecord = {
    ref,
    source: "praman",
    status: "submitted",
    createdAt: now,
    submittedAt: now,
    applicantName: String(fields["candidate_name"] ?? "Candidate"),
    fields,
    documents,
    pramanApplicationId,
    pramanConsentId,
    pramanFormId,
    history: [{ status: "submitted", note: "Application received via Apply with Praman", at: now, actor: "citizen" }],
  };
  saveApplication(record);

  const cfg = loadPramanConfig();
  const idempotencyKey = generateIdempotencyKey();
  try {
    await pushStatus(cfg, pramanApplicationId, { status: "under_review", note: "Received by BTA", externalRef: ref }, idempotencyKey);
    const afterPush = new Date().toISOString();
    record.history.push({ status: "under_review", note: "Received by BTA", at: afterPush, actor: "bta" });
    record.status = "under_review";
    saveApplication(record);
  } catch (err) {
    // Application is still recorded locally even if the push to Praman failed.
    record.history.push({ status: record.status, note: `Could not notify Praman tracker: ${(err as Error).message}`, at: new Date().toISOString(), actor: "system" });
    saveApplication(record);
  }

  return NextResponse.redirect(new URL(`/status/${ref}`, request.url), { status: 303 });
}
