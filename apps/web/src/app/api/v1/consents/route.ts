import { db, t, eq, inArray, desc } from "@praman/db";
import { handler, citizen, ok } from "@/lib/api";

/** GET /api/v1/consents — consent ledger across every profile the user can act on. */
export const GET = handler(async (req) => {
  const { all } = await citizen(req);
  const ids = all.map((p) => p.id);
  const rows = await db.select({ c: t.consents, partner: { id: t.partners.id, name: t.partners.name, kind: t.partners.kind, logoUrl: t.partners.logoUrl }, form: { id: t.forms.id, name: t.forms.name, slug: t.forms.slug }, applicationId: t.shares.applicationId, exchangedAt: t.shares.exchangedAt })
    .from(t.consents).innerJoin(t.partners, eq(t.consents.partnerId, t.partners.id)).leftJoin(t.forms, eq(t.consents.formId, t.forms.id)).leftJoin(t.shares, eq(t.shares.consentId, t.consents.id))
    .where(inArray(t.consents.profileId, ids)).orderBy(desc(t.consents.grantedAt));
  return ok(rows.map((r) => ({
    id: r.c.id, profile_id: r.c.profileId, profile_name: all.find((p) => p.id === r.c.profileId)?.displayName ?? "", partner: r.partner, form: r.form, purpose: r.c.purpose, scope: r.c.scope, scope_count: r.c.scope.length,
    granted_at: r.c.grantedAt.toISOString(), expires_at: r.c.expiresAt.toISOString(), revoked_at: r.c.revokedAt?.toISOString() ?? null, application_id: r.applicationId, exchanged_at: r.exchangedAt?.toISOString() ?? null,
    status: r.c.revokedAt ? "revoked" : r.c.expiresAt.getTime() < Date.now() ? "expired" : "active",
  })));
});
