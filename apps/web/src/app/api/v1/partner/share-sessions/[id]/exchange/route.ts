import { z } from "zod";
import { db, t, and, eq, isNull, audit, systemDek } from "@praman/db";
import { decryptString } from "@praman/crypto";
import { handler, partner, body, ok, ApiError } from "@/lib/api";
import { hashToken, shareTokenSessionId } from "@/lib/share";

const isUuid = (s: string) => /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(s);

/** POST /api/v1/partner/share-sessions/:id/exchange {share_token} → {payload_jws, consent_id, application_id}. Single use; replay → 409. */
export const POST = handler(async (req, { params }) => {
  const { partner: p } = await partner(req);
  const { share_token } = await body(req, z.object({ share_token: z.string().min(20) }));
  const id = params.id === "_" ? shareTokenSessionId(share_token) : params.id!;
  if (!isUuid(id)) throw new ApiError(404, "SESSION_NOT_FOUND");
  const sess = await db.query.shareSessions.findFirst({ where: eq(t.shareSessions.id, id) });
  if (!sess || sess.partnerId !== p.id) throw new ApiError(404, "SESSION_NOT_FOUND");
  const share = await db.query.shares.findFirst({ where: eq(t.shares.shareTokenHash, hashToken(share_token)) });
  if (!share || share.shareSessionId !== sess.id) throw new ApiError(404, "SHARE_TOKEN_INVALID", "No share matches this token for this session");
  if (share.exchangedAt) throw new ApiError(409, "SHARE_TOKEN_USED", "This share token was already exchanged");
  if (share.expiresAt.getTime() < Date.now()) throw new ApiError(410, "SHARE_TOKEN_EXPIRED", "Share tokens expire 10 minutes after consent");
  const consent = await db.query.consents.findFirst({ where: eq(t.consents.id, share.consentId) });
  if (!consent || consent.revokedAt) throw new ApiError(409, "CONSENT_REVOKED", "The citizen revoked this consent");
  // race-safe single use
  const claimed = await db.update(t.shares).set({ exchangedAt: new Date() }).where(and(eq(t.shares.id, share.id), isNull(t.shares.exchangedAt))).returning({ id: t.shares.id });
  if (!claimed.length) throw new ApiError(409, "SHARE_TOKEN_USED", "This share token was already exchanged");
  await db.update(t.shareSessions).set({ status: "exchanged" }).where(eq(t.shareSessions.id, sess.id));
  const payload_jws = decryptString(systemDek(), share.payloadEnc, `share:${share.id}`);
  await audit({ actorPartnerId: p.id, action: "share.exchange", targetType: "share", targetId: share.id, meta: { consentId: consent.id, applicationId: share.applicationId } });
  return ok({ payload_jws, consent_id: consent.id, application_id: share.applicationId });
});
