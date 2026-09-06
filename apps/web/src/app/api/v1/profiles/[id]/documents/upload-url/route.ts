import { z } from "zod";
import { db, t, eq } from "@praman/db";
import { handler, citizen, body, ok, log, ApiError } from "@/lib/api";
import { DOCUMENT_MIMES, MAX_DOCUMENT_BYTES, documentAllowed } from "@praman/schema";
import { docKey, presignPut } from "@/lib/storage";

export const DOC_TYPES = ["aadhaar", "pan", "marksheet_10", "marksheet_12", "degree", "category_cert", "income_cert", "domicile_cert", "photo", "signature", "passport", "dl", "bank_passbook", "other"] as const;
/** POST {filename, mime, size, docType} → {documentId, url} (presigned PUT, 10 min). Row starts as status=pending. */
export const POST = handler(async (req, { params }) => {
  const a = await citizen(req, { profileId: params.id });
  const b = await body(req, z.object({ filename: z.string().min(1).max(200), mime: z.enum(DOCUMENT_MIMES), size: z.number().int().positive().max(MAX_DOCUMENT_BYTES, "Max 15 MB"), docType: z.enum(DOC_TYPES) }));
  if (!documentAllowed(a.scope, b.docType)) throw new ApiError(403, "DOCUMENT_SCOPE_FORBIDDEN", "This document is outside your delegated access.");
  const [doc] = await db.insert(t.documents).values({ profileId: a.profile.id, docType: b.docType, title: b.filename.replace(/\.[a-z0-9]+$/i, ""), mime: b.mime, size: b.size, origin: "upload", status: "pending", meta: { filename: b.filename } }).returning();
  const key = docKey(a.profile.id, doc!.id, b.filename);
  await db.update(t.documents).set({ storageKey: key }).where(eq(t.documents.id, doc!.id));
  await log(a.session, "document.upload_url", "document", doc!.id, { docType: b.docType, size: b.size, profileId: a.profile.id });
  return ok({ documentId: doc!.id, url: await presignPut(key, b.mime), key });
});
