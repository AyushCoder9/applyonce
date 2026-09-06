import { sampleUrl } from "@/lib/document-preview";
import { documentAllowed } from "@praman/schema";
import { db, t, eq } from "@praman/db";
import { handler, citizen, ok, ApiError, log } from "@/lib/api";
import { isMockKey, presignGet } from "@/lib/storage";
/** GET (step-up) → {url} presigned GET valid 5 min; mock-provider docs return {mock:true}. */
export const GET = handler(async (req, { params }) => {
  const doc = await db.query.documents.findFirst({ where: eq(t.documents.id, params.id!) });
  if (!doc) throw new ApiError(404, "NOT_FOUND");
  const a = await citizen(req, { profileId: doc.profileId, stepUp: true });
  if (!documentAllowed(a.scope, doc.docType)) throw new ApiError(403, "DOCUMENT_SCOPE_FORBIDDEN");
  await log(a.session, "document.download", "document", doc.id, { profileId: doc.profileId });
  if (isMockKey(doc.storageKey)) return ok({ url: sampleUrl(doc.id,a.session.session.id), mock: true, expiresIn: 300 });
  const filename = ((doc.meta as { filename?: string })?.filename) ?? `${doc.title}.${doc.mime === "text/plain" ? "txt" : doc.mime === "application/pdf" ? "pdf" : "jpg"}`;
  return ok({ url: await presignGet(doc.storageKey!, filename, 300), mock: false, expiresIn: 300 });
});
