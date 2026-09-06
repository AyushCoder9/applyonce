import { db, t, eq, and, isNull, desc } from "@applyonce/db";
import { handler, citizen, ok } from "@/lib/api";
import { scopeAllows } from "@/lib/session";
import { sectionOf } from "../../_lib";
/** GET ?all=1 → mismatches (unresolved by default). */
export const GET = handler(async (req, { params }) => {
  const a = await citizen(req, { profileId: params.id });
  const all = new URL(req.url).searchParams.get("all") === "1";
  const rows = await db.select().from(t.mismatches).where(all ? eq(t.mismatches.profileId, a.profile.id) : and(eq(t.mismatches.profileId, a.profile.id), isNull(t.mismatches.resolvedAt))).orderBy(desc(t.mismatches.createdAt));
  return ok({ mismatches: rows.filter((m) => scopeAllows(a.scope, sectionOf(m.factKey))) });
});
