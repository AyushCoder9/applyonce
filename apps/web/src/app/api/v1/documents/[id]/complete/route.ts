import { z } from "zod";
import { db, t, eq } from "@praman/db";
import { enqueue } from "@praman/jobs";
import { handler, citizen, ok, ApiError, log } from "@/lib/api";
/** POST {size?, sha256?} after the PUT succeeded → stays pending; enqueues document.process (AV + OCR). */
export const POST = handler(async (req, { params }) => {
  const doc = await db.query.documents.findFirst({ where: eq(t.documents.id, params.id!) });
  if (!doc) throw new ApiError(404, "NOT_FOUND");
  const a = await citizen(req, { profileId: doc.profileId });
  const b = z.object({ size: z.number().int().nonnegative().optional(), sha256: z.string().regex(/^[a-f0-9]{64}$/).optional() }).parse(await req.json().catch(() => ({})));
  await db.update(t.documents).set({ ...(b.size != null ? { size: b.size } : {}), ...(b.sha256 ? { sha256: b.sha256 } : {}), status: "pending" }).where(eq(t.documents.id, doc.id));
  await enqueue("document.process", { documentId: doc.id, userId: a.ownerUserId, profileId: doc.profileId });
  await log(a.session, "document.complete", "document", doc.id, { sha256: b.sha256 ?? null, profileId: doc.profileId });
  return ok({ documentId: doc.id, status: "pending" });
});
