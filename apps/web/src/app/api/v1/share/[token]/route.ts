import { documentAllowed } from "@praman/schema";
import { getDek, getFacts, db, t, and, eq } from "@praman/db";
import { handler, citizen, ok, ApiError } from "@/lib/api";
import { loadShareSession, buildDiff, diffSummary } from "@/lib/share";

/** GET /api/v1/share/:token?profile= — partner, form, and the requested-vs-have diff for the selected profile (sensitive values masked). */
export const GET = handler(async (req, { params }) => {
  const { profile, ownerUserId, all, scope } = await citizen(req);
  const s = await loadShareSession(params.token!);
  if (!s) throw new ApiError(404, "SHARE_NOT_FOUND");
  if (s.problem) throw new ApiError(410, `SHARE_${s.problem.toUpperCase()}`);
  const facts = await getFacts(await getDek(ownerUserId), profile.id, { keys: s.form.requestedFields.map((r) => r.key) });
  const rows = buildDiff(facts, s.form, { maskSensitive: true, scope });
  return ok({
    session: { id: s.session.id, expires_at: s.session.expiresAt.toISOString(), env: s.session.env },
    partner: { id: s.partner.id, name: s.partner.name, kind: s.partner.kind, status: s.partner.status, logo_url: s.partner.logoUrl, website: s.partner.website },
    form: { id: s.form.id, name: s.form.name, purpose: s.form.purpose, retention_days: s.form.retentionDays, custom_fields: s.form.customFields, requested_fields: s.form.requestedFields },
    profile: { id: profile.id, display_name: profile.displayName, kind: profile.kind, role: profile.role },
    profiles: all.map((p) => ({ id: p.id, display_name: p.displayName, kind: p.kind, role: p.role })),
    documents: (await db.select({ id: t.documents.id, title: t.documents.title, docType: t.documents.docType }).from(t.documents).where(and(eq(t.documents.profileId, profile.id), eq(t.documents.status, "ready")))).filter(d=>documentAllowed(scope,d.docType)),
    rows, summary: diffSummary(rows),
  });
});

/** Record denial so the original link cannot be reused after the citizen declines. */
export const DELETE = handler(async (req, { params }) => {
  await citizen(req);
  const s = await loadShareSession(params.token!);
  if (!s || s.problem) throw new ApiError(410, "SHARE_UNAVAILABLE");
  await db.update(t.shareSessions).set({ status: "cancelled" }).where(and(eq(t.shareSessions.id, s.session.id), eq(t.shareSessions.status, "open")));
  return ok({ cancelled: true });
});
