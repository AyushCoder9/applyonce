import { db, t, eq, desc } from "@praman/db";
import { handler, citizen, ok, ApiError } from "@/lib/api";
import { loadFacts } from "../../profiles/_lib";
/** GET → document + extractions + linked facts (facts whose evidence is this document). */
export const GET = handler(async (req, { params }) => {
  const doc = await db.query.documents.findFirst({ where: eq(t.documents.id, params.id!) });
  if (!doc) throw new ApiError(404, "NOT_FOUND");
  const a = await citizen(req, { profileId: doc.profileId });
  const extractions = await db.select().from(t.documentExtractions).where(eq(t.documentExtractions.documentId, doc.id)).orderBy(desc(t.documentExtractions.createdAt));
  const linkedFacts = (await loadFacts(a)).filter((f) => f.evidenceDocumentId === doc.id);
  return ok({ document: doc, extractions, linkedFacts });
});
