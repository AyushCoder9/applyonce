import { createHash, randomUUID } from "node:crypto";
import { NextResponse } from "next/server";
import { FIELDS } from "@/lib/fields";
import { generateApplicationNumber } from "@/lib/id";
import { applicationExists, saveApplication, type ApplicationRecord, type DocumentRef } from "@/lib/store";
import { validateFileMeta, validateValue } from "@/lib/validation";

/**
 * The "pain" flow: a real multipart form POST (native, no fetch/JS) from ManualWizard's
 * final Submit button. Re-validates server-side (defense in depth — the client already
 * validated per-step), hashes uploaded files, and stores a plain BTA-only application
 * record (no ApplyOnce involvement at all for this path).
 */
export async function POST(request: Request) {
  const form = await request.formData();
  const fields: Record<string, unknown> = {};
  const documents: DocumentRef[] = [];
  const errors: Record<string, string> = {};

  for (const spec of FIELDS) {
    if (spec.kind === "file") {
      const file = form.get(spec.id);
      if (file instanceof File && file.size > 0) {
        const res = validateFileMeta(spec, { type: file.type, size: file.size });
        if (!res.ok) { errors[spec.id] = res.error ?? "Invalid file"; continue; }
        const bytes = Buffer.from(await file.arrayBuffer());
        const sha256 = createHash("sha256").update(bytes).digest("hex");
        documents.push({ title: spec.label, sha256, mime: file.type, sizeKb: Math.round(file.size / 1024) });
        fields[spec.id] = file.name;
      } else if (spec.required) {
        errors[spec.id] = "Please choose a file to upload.";
      }
      continue;
    }

    const raw = form.get(spec.id);
    const value = spec.kind === "checkbox" ? raw === "on" || raw === "true" : typeof raw === "string" ? raw : "";
    const res = validateValue(spec, value as never);
    if (!res.ok) { errors[spec.id] = res.error ?? "Invalid value"; continue; }
    fields[spec.id] = res.value;
  }

  if (Object.keys(errors).length > 0) {
    const url = new URL("/apply/manual", request.url);
    url.searchParams.set("error", `${Object.keys(errors).length} field(s) failed validation. Please go back and check your entries.`);
    return NextResponse.redirect(url, { status: 303 });
  }

  const ref = generateApplicationNumber(applicationExists);
  const now = new Date().toISOString();
  const record: ApplicationRecord = {
    ref,
    source: "manual",
    accessToken: randomUUID(),
    status: "submitted",
    createdAt: now,
    submittedAt: now,
    applicantName: String(fields["candidate_name"] ?? "Candidate"),
    fields,
    documents,
    history: [{ status: "submitted", note: "Application submitted manually on BTA portal", at: now, actor: "citizen" }],
  };
  saveApplication(record);

  const res = NextResponse.redirect(new URL(`/status/${ref}`, request.url), { status: 303 });
  res.cookies.set("bta_access", record.accessToken!, { httpOnly: true, sameSite: "lax", secure:new URL(request.url).protocol === "https:",path: "/", maxAge:86400 });
  return res;
}
