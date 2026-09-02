import { db, t, eq, and, desc, getDek, mask } from "@praman/db";
import { field, isFactKey, type FactValue } from "@praman/schema";
import { decryptJson } from "@praman/crypto";
import { handler, citizen, ok, ApiError } from "@/lib/api";
import { isSteppedUp, scopeAllows } from "@/lib/session";
import { sectionOf } from "../../../../_lib";

/** GET ?repeatIndex= → change history (decrypted with the owner's DEK; sensitive values masked unless stepped-up). */
export const GET = handler(async (req, { params }) => {
  const a = await citizen(req, { profileId: params.id });
  const key = decodeURIComponent(params.key!);
  if (!isFactKey(key) || !scopeAllows(a.scope, sectionOf(key))) throw new ApiError(404, "UNKNOWN_KEY");
  const ri = Number(new URL(req.url).searchParams.get("repeatIndex") ?? 0);
  const row = await db.query.facts.findFirst({ where: and(eq(t.facts.profileId, a.profile.id), eq(t.facts.factKey, key), eq(t.facts.repeatIndex, ri)) });
  if (!row) return ok({ history: [] });
  const dek = await getDek(a.ownerUserId);
  const show = (v: FactValue) => (field(key).sensitive && !isSteppedUp(a.session) ? mask(key, v) : v);
  const rows = await db.select().from(t.factHistory).where(eq(t.factHistory.factId, row.id)).orderBy(desc(t.factHistory.changedAt)).limit(50);
  const history = rows.map((h) => ({ id: h.id, changedAt: h.changedAt.toISOString(), oldSource: h.oldSource, changedBy: h.changedBy, reason: h.reason,
    oldValue: h.oldValueEnc ? show(decryptJson<FactValue>(dek, h.oldValueEnc)) : null, newValue: h.newValueEnc ? show(decryptJson<FactValue>(dek, h.newValueEnc)) : null }));
  return ok({ history, current: { source: row.source, verifiedBy: row.verifiedBy, verifiedAt: row.verifiedAt, updatedAt: row.updatedAt } });
});
