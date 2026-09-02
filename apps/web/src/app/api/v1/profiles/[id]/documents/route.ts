import { db, t, eq, desc, inArray } from "@praman/db";
import { handler, citizen, ok } from "@/lib/api";
/** GET → documents for the profile + which have unreviewed extractions. */
export const GET = handler(async (req, { params }) => {
  const a = await citizen(req, { profileId: params.id });
  const docs = await db.select().from(t.documents).where(eq(t.documents.profileId, a.profile.id)).orderBy(desc(t.documents.createdAt));
  const pending = docs.length ? await db.select({ documentId: t.documentExtractions.documentId, n: t.documentExtractions.id, reviewedAt: t.documentExtractions.reviewedAt }).from(t.documentExtractions).where(inArray(t.documentExtractions.documentId, docs.map((d) => d.id))) : [];
  const toReview = new Set(pending.filter((p) => !p.reviewedAt).map((p) => p.documentId));
  return ok({ documents: docs.map((d) => ({ ...d, needsReview: toReview.has(d.id) })) });
});
