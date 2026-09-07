import { cookies } from "next/headers";
import { randomUUID } from "node:crypto";
import { getDraft, completeDraft, getApplication } from "@/lib/store";
import { mapPayloadToRows } from "@/lib/payload-map";
import { NextResponse } from "next/server";
import { FIELDS } from "@/lib/fields";
import { generateApplicationNumber, generateIdempotencyKey } from "@/lib/id";
import { loadApplyOnceConfig, pushStatus } from "@/lib/applyonce";
import { applicationExists, saveApplication, type ApplicationRecord, type DocumentRef } from "@/lib/store";
import { normalizeDateInput, validateValue } from "@/lib/validation";

/**
 * Submit button on `/apply/return`. Builds the BTA-local application record from the
 * (possibly citizen-edited) ApplyOnce-sourced values, then immediately pushes
 * `under_review` back to ApplyOnce with `externalRef` = our own BTA26 reference, per
 * docs/05-API-AND-FLOWS.md F2 step 6 ("citizen sees application in tracker").
 */
export async function POST(request: Request) {
  const form = await request.formData();
  const draftToken = String(form.get("draft_token") ?? "");
  const jar = await cookies();
  const draft = jar.get("bta_draft")?.value === draftToken ? await getDraft(draftToken) : undefined;
  if (!draft) return NextResponse.json({ok:false,error:{code:"INVALID_REVIEW_SESSION",message:"Start again from the portal."}},{status:403});
  if (draft.submittedRef) {
    const existing = await getApplication(draft.submittedRef);
    if (!existing?.accessToken) return NextResponse.json({ok:false,error:{code:"APPLICATION_NOT_FOUND"}},{status:410});
    const response = NextResponse.redirect(new URL(`/status/${draft.submittedRef}`,request.url),{status:303});
    response.cookies.set("bta_access",existing.accessToken,{httpOnly:true,sameSite:"lax",secure:new URL(request.url).protocol === "https:",path:"/",maxAge:86400});
    return response;
  }
  const applyonceApplicationId = draft.payload.application_id;
  const applyonceConsentId = draft.payload.consent_id;
  const applyonceFormId = draft.payload.form_id;
  const mapped = mapPayloadToRows(draft.payload);
  const documents: DocumentRef[] = mapped.documents;

  const fields: Record<string, unknown> = {};
  const errors: Record<string, string> = {};
  for (const spec of FIELDS) {
    if (spec.kind === "file") {
      fields[spec.id] = mapped.rows.find(row=>row.spec.id === spec.id)?.raw ?? "";
      if(spec.required && !fields[spec.id]) errors[spec.id] = "Required document was not shared. Start again and attach it.";
      continue;
    }
    const raw = form.get(spec.id);
    if (spec.isDate && typeof raw === "string" && raw) {
      const iso = normalizeDateInput(raw);
      if (!iso) { errors[spec.id] = "Enter a valid date."; continue; }
      const result = validateValue(spec, iso);
      if (!result.ok) { errors[spec.id] = result.error ?? "Invalid date"; continue; }
      fields[spec.id] = result.value;
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

  const ref = await generateApplicationNumber(applicationExists);
  const now = new Date().toISOString();
  const record: ApplicationRecord = {
    ref,
    source: "applyonce",
    accessToken: randomUUID(),
    status: "submitted",
    createdAt: now,
    submittedAt: now,
    applicantName: String(fields["candidate_name"] ?? "Candidate"),
    fields,
    documents,
    applyonceApplicationId,
    applyonceConsentId,
    applyonceFormId,
    history: [{ status: "submitted", note: "Application received via Apply with ApplyOnce", at: now, actor: "citizen" }],
  };
  await saveApplication(record);
  await completeDraft(draftToken,ref);

  const cfg = loadApplyOnceConfig();
  const idempotencyKey = generateIdempotencyKey();
  try {
    await pushStatus(cfg, applyonceApplicationId, { status: "under_review", note: "Received by BTA", externalRef: ref }, idempotencyKey);
    const afterPush = new Date().toISOString();
    record.history.push({ status: "under_review", note: "Received by BTA", at: afterPush, actor: "bta" });
    record.status = "under_review";
    await saveApplication(record);
  } catch (err) {
    // Application is still recorded locally even if the push to ApplyOnce failed.
    record.history.push({ status: record.status, note: `Could not notify ApplyOnce tracker: ${(err as Error).message}`, at: new Date().toISOString(), actor: "system" });
    await saveApplication(record);
  }

  const response=NextResponse.redirect(new URL(`/status/${ref}`,request.url),{status:303});
  response.cookies.set("bta_access",record.accessToken!,{httpOnly:true,sameSite:"lax",secure:new URL(request.url).protocol === "https:",path:"/",maxAge:86400});
  return response;
}
