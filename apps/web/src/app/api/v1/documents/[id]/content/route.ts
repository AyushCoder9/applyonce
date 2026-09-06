import { db, t, eq } from "@applyonce/db";
import { documentAllowed, MAX_DOCUMENT_BYTES } from "@applyonce/schema";
import { ApiError, citizen, handler, log, ok } from "@/lib/api";
import { getBytes, putBytes, storageDriver } from "@/lib/storage";

async function ownedDocument(req: Request, id: string, stepUp = false) {
  const doc = await db.query.documents.findFirst({ where: eq(t.documents.id, id) });
  if (!doc) throw new ApiError(404, "NOT_FOUND");
  const access = await citizen(req, { profileId: doc.profileId, stepUp });
  if (!documentAllowed(access.scope, doc.docType)) throw new ApiError(403, "DOCUMENT_SCOPE_FORBIDDEN");
  if (!doc.storageKey || doc.storageKey.startsWith("mock/")) throw new ApiError(404, "DOCUMENT_CONTENT_NOT_FOUND");
  return { doc, access };
}

/** Same-origin private upload endpoint used by Vercel Blob deployments. */
export const PUT = handler(async (req, { params }) => {
  if (storageDriver() !== "blob") throw new ApiError(404, "NOT_FOUND");
  const { doc, access } = await ownedDocument(req, params.id!);
  if (doc.origin !== "upload" || doc.status !== "pending") throw new ApiError(409, "DOCUMENT_NOT_UPLOADABLE");
  const contentLength = Number(req.headers.get("content-length") ?? 0);
  if (!Number.isFinite(contentLength) || contentLength <= 0 || contentLength > MAX_DOCUMENT_BYTES) throw new ApiError(413, "DOCUMENT_SIZE_INVALID", "Document must be between 1 byte and 15 MB.");
  const contentType = req.headers.get("content-type")?.split(";")[0]?.trim();
  if (contentType !== doc.mime) throw new ApiError(415, "DOCUMENT_MIME_MISMATCH", "Uploaded content type does not match the selected file.");
  const bytes = new Uint8Array(await req.arrayBuffer());
  if (bytes.length !== contentLength || bytes.length > MAX_DOCUMENT_BYTES) throw new ApiError(413, "DOCUMENT_SIZE_INVALID");
  await putBytes(doc.storageKey!, bytes, doc.mime);
  await log(access.session, "document.content_uploaded", "document", doc.id, { profileId: doc.profileId, size: bytes.length });
  return ok({ documentId: doc.id, uploaded: true });
});

/** Authenticated delivery route for private Vercel Blob documents. */
export const GET = handler(async (req, { params }) => {
  if (storageDriver() !== "blob") throw new ApiError(404, "NOT_FOUND");
  const { doc, access } = await ownedDocument(req, params.id!, true);
  const bytes = await getBytes(doc.storageKey!);
  if (!bytes.length) throw new ApiError(404, "DOCUMENT_CONTENT_NOT_FOUND");
  await log(access.session, "document.content_downloaded", "document", doc.id, { profileId: doc.profileId });
  return new Response(Uint8Array.from(bytes).buffer, {
    headers: {
      "content-type": doc.mime,
      "content-disposition": `inline; filename="${String((doc.meta as { filename?: string } | null)?.filename ?? doc.title).replace(/"/g, "")}"`,
      "cache-control": "private, no-store",
      "x-content-type-options": "nosniff",
    },
  });
});
