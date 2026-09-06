import { z } from "zod";
import { db, t, eq, and, desc, getDek, putFact, deleteFact } from "@applyonce/db";
import { isFactKey, field, zodFor } from "@applyonce/schema";
import { handler, citizen, body, ok, ApiError, log } from "@/lib/api";
import { scopeAllows } from "@/lib/session";
import { loadFacts, sectionOf } from "../../../_lib";

const guard = (key: string, scope: string[]) => {
  if (!isFactKey(key)) throw new ApiError(404, "UNKNOWN_KEY", `Unknown fact ${key}`);
  const def = field(key);
  if (!scopeAllows(scope, sectionOf(key))) throw new ApiError(403, "SCOPE_FORBIDDEN", "You can’t edit this section for this profile");
  if (def.system || def.derived) throw new ApiError(400, "READ_ONLY", "This value is managed automatically");
  return def;
};

/** PUT {value, repeatIndex?} → self-declared write via putFact. 409 on mismatch with a verified value. */
export const PUT = handler(async (req, { params }) => {
  const a = await citizen(req, { profileId: params.id });
  const key = decodeURIComponent(params.key!);
  const def = guard(key, a.scope);
  const b = await body(req, z.object({ value: z.unknown(), repeatIndex: z.number().int().min(0).max(50).optional() }));
  const parsed = zodFor(def).safeParse(b.value);
  if (!parsed.success) throw new ApiError(422, "VALIDATION", "Check the highlighted field", { [key]: parsed.error.issues[0]?.message ?? "Invalid value" });
  if (!def.sources.includes("self_declared")) throw new ApiError(400, "VERIFIED_ONLY", "This field can only come from a verified source");
  const dek = await getDek(a.ownerUserId);
  let r;
  try { r = await putFact(dek, { profileId: a.profile.id, key, value: parsed.data as never, repeatIndex: b.repeatIndex ?? 0, source: "self_declared", updatedBy: a.user.id, reason: "edited in vault" }); }
  catch (e) { throw new ApiError(400, "PUT_FAILED", String((e as Error).message)); }
  await log(a.session, "fact.put", "fact", r.id ?? null, { key, repeatIndex: b.repeatIndex ?? 0, status: r.status, profileId: a.profile.id });
  if (r.status === "mismatch") {
    const mm = await db.query.mismatches.findFirst({ where: and(eq(t.mismatches.profileId, a.profile.id), eq(t.mismatches.factKey, key)), orderBy: desc(t.mismatches.createdAt) });
    return Response.json({ ok: false, error: { code: "MISMATCH", message: "This value is verified by an issuer and differs from what you entered. Resolve the mismatch to continue.", mismatch: mm } }, { status: 409 });
  }
  const [fact] = (await loadFacts(a, { keys: [key] })).filter((f) => f.repeatIndex === (b.repeatIndex ?? 0));
  return ok({ status: r.status, fact });
});

/** DELETE ?repeatIndex= → removes a self-declared / extracted fact (verified values stay). */
export const DELETE = handler(async (req, { params }) => {
  const a = await citizen(req, { profileId: params.id });
  const key = decodeURIComponent(params.key!);
  guard(key, a.scope);
  const ri = Number(new URL(req.url).searchParams.get("repeatIndex") ?? 0);
  const row = await db.query.facts.findFirst({ where: and(eq(t.facts.profileId, a.profile.id), eq(t.facts.factKey, key), eq(t.facts.repeatIndex, ri)) });
  if (!row) throw new ApiError(404, "NOT_FOUND");
  if (row.source === "issuer_verified" || row.source === "provider_verified") throw new ApiError(400, "VERIFIED_READONLY", "Verified values can’t be deleted. Re-verify to update.");
  await deleteFact(a.profile.id, key, ri);
  await log(a.session, "fact.delete", "fact", row.id, { key, repeatIndex: ri, profileId: a.profile.id });
  return ok({ deleted: true });
});
