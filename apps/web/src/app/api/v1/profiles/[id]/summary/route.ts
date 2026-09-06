import { db, t, eq, and, isNull, completion } from "@applyonce/db";
import { SECTION_META, fieldsInSection } from "@applyonce/schema";
import { handler, citizen, ok } from "@/lib/api";
import { scopeAllows } from "@/lib/session";
import { loadFacts } from "../../_lib";

export const GET = handler(async (req, { params }) => {
  const a = await citizen(req, { profileId: params.id });
  const facts = await loadFacts(a);
  const sections = SECTION_META.filter((s) => scopeAllows(a.scope, s.id)).map((s) => ({ id: s.id, label: s.label, ...completion(facts, fieldsInSection(s.id).map((d) => d.key)) }));
  const core = sections.filter((s) => ["identity", "contact", "address", "family", "category", "education"].includes(s.id));
  const overall = { total: core.reduce((n, s) => n + s.total, 0), filled: core.reduce((n, s) => n + s.filled, 0), verified: core.reduce((n, s) => n + s.verified, 0) };
  const [mm] = await db.select({ n: t.mismatches.id }).from(t.mismatches).where(and(eq(t.mismatches.profileId, a.profile.id), isNull(t.mismatches.resolvedAt)));
  return ok({ profile: { id: a.profile.id, displayName: a.profile.displayName, kind: a.profile.kind }, scope: a.scope, overall: { ...overall, pct: overall.total ? Math.round((overall.filled / overall.total) * 100) : 0 }, sections, openMismatches: mm ? 1 : 0, factCount: facts.length });
});
