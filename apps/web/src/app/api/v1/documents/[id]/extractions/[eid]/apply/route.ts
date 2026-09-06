import { documentAllowed } from "@applyonce/schema";
import { z } from "zod";
import { db, t, eq, and, getDek, putFact } from "@applyonce/db";
import { coerce, isFactKey } from "@applyonce/schema";
import { handler, citizen, body, ok, ApiError, log } from "@/lib/api";
import { scopeAllows } from "@/lib/session";
/** POST {accept: string[]} → writes accepted proposed facts as document_extracted; marks the extraction reviewed. */
export const POST = handler(async (req, { params }) => {
  const doc = await db.query.documents.findFirst({ where: eq(t.documents.id, params.id!) });
  if (!doc) throw new ApiError(404, "NOT_FOUND");
  const a = await citizen(req, { profileId: doc.profileId });
  if (!documentAllowed(a.scope, doc.docType)) throw new ApiError(403, "DOCUMENT_SCOPE_FORBIDDEN");
  const ex = await db.query.documentExtractions.findFirst({ where: and(eq(t.documentExtractions.id, params.eid!), eq(t.documentExtractions.documentId, doc.id)) });
  if (!ex) throw new ApiError(404, "NOT_FOUND");
  const { accept } = await body(req, z.object({ accept: z.array(z.string()).max(100) }));
  const dek = await getDek(a.ownerUserId);
  const results: Record<string, string> = {};
  for (const p of ex.proposedFacts) {
    if (!accept.includes(p.key)) { results[p.key] = "rejected"; continue; }
    if (!isFactKey(p.key) || !scopeAllows(a.scope, p.key.split(".")[0]!)) { results[p.key] = "skipped"; continue; }
    const value = coerce(p.key, String(p.value ?? ""));
    if (value == null) { results[p.key] = "invalid"; continue; }
    try { results[p.key] = (await putFact(dek, { profileId: doc.profileId, key: p.key, value: value as never, source: "document_extracted", verifiedBy: "ocr", confidence: p.confidence, evidenceDocumentId: doc.id, updatedBy: a.user.id, reason: "accepted from extraction" })).status; }
    catch (e) { results[p.key] = `error: ${(e as Error).message}`; }
  }
  await db.update(t.documentExtractions).set({ reviewedAt: new Date(), reviewedBy: a.user.id }).where(eq(t.documentExtractions.id, ex.id));
  await log(a.session, "extraction.apply", "document_extraction", ex.id, { documentId: doc.id, accepted: accept, results });
  return ok({ results, applied: Object.values(results).filter((r) => r === "created" || r === "updated").length, mismatches: Object.values(results).filter((r) => r === "mismatch").length });
});
