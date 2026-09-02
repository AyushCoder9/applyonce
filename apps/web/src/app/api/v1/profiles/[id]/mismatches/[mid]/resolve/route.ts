import { z } from "zod";
import { db, t, eq, and } from "@praman/db";
import { handler, citizen, body, ok, ApiError, log } from "@/lib/api";
/** POST {keep:'a'|'b'} — a = keep the verified value; b = keep mine, flagged for re-verification. */
export const POST = handler(async (req, { params }) => {
  const a = await citizen(req, { profileId: params.id });
  const { keep, note } = await body(req, z.object({ keep: z.enum(["a", "b"]), note: z.string().max(300).optional() }));
  const m = await db.query.mismatches.findFirst({ where: and(eq(t.mismatches.id, params.mid!), eq(t.mismatches.profileId, a.profile.id)) });
  if (!m) throw new ApiError(404, "NOT_FOUND");
  if (m.resolvedAt) throw new ApiError(409, "ALREADY_RESOLVED");
  const resolution = keep === "a" ? "kept_verified" : `needs_reverification${note ? `: ${note}` : ""}`;
  await db.update(t.mismatches).set({ resolvedAt: new Date(), resolution }).where(eq(t.mismatches.id, m.id));
  if (keep === "b") await db.insert(t.notifications).values({ userId: a.user.id, category: "verification", title: `Re-verify ${m.factKey.split(".").pop()}`, body: "You chose your own value over the issuer’s. Upload a fresh certificate or re-sync DigiLocker so partners see a verified value.", link: "/app/verify" });
  await log(a.session, "mismatch.resolve", "mismatch", m.id, { keep, factKey: m.factKey, profileId: a.profile.id });
  return ok({ id: m.id, resolution });
});
