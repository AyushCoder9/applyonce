import { db, t, eq } from "@applyonce/db";
import { handler, citizen, ok, ApiError, log } from "@/lib/api";
import { dispatchWebhook } from "@/lib/webhooks";

/** POST /api/v1/consents/:id/revoke — stops future exchanges; partner is told via `consent.revoked`. Idempotent. */
export const POST = handler(async (req, { params }) => {
  const c = await db.query.consents.findFirst({ where: eq(t.consents.id, params.id!) });
  if (!c) throw new ApiError(404, "CONSENT_NOT_FOUND");
  const { session } = await citizen(req, { profileId: c.profileId });
  if (c.revokedAt) return ok({ id: c.id, revoked_at: c.revokedAt.toISOString(), already: true });
  const revokedAt = new Date();
  await db.update(t.consents).set({ revokedAt }).where(eq(t.consents.id, c.id));
  const shares = await db.select({ applicationId: t.shares.applicationId }).from(t.shares).where(eq(t.shares.consentId, c.id));
  for (const s of shares) if (s.applicationId) await db.insert(t.applicationEvents).values({ applicationId: s.applicationId, type: "note", title: "Consent revoked", body: "The partner was asked to stop using your data.", actor: "citizen", meta: { consentId: c.id } });
  await log(session, "consent.revoke", "consent", c.id, { partnerId: c.partnerId, profileId: c.profileId });
  await dispatchWebhook(c.partnerId, "consent.revoked", { consent_id: c.id, application_ids: shares.map((s) => s.applicationId).filter(Boolean), revoked_at: revokedAt.toISOString() });
  return ok({ id: c.id, revoked_at: revokedAt.toISOString(), already: false });
});
