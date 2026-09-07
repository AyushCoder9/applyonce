import { db, eq, t } from "@applyonce/db";
import { handler, citizen, ApiError } from "@/lib/api";
import { decodeJws, signReceiptPayload } from "@/lib/signing";
import { requireProfileAccess } from "@/lib/session";

type ConsentEvidenceReceipt = {
  iss: "applyonce";
  receipt_type: "applyonce-consent-evidence/v1";
  consent_id: string;
  application_id: string | null;
  recipient: { id: string; name: string };
  form: { id: string; name: string; version: number } | null;
  purpose: string;
  field_keys: string[];
  granted_at: string;
  expires_at: string;
  revoked_at: string | null;
  confirmation_method: string;
  partner_payload_sha256: string | null;
  partner_collected_at: string | null;
};

/**
 * Download durable cryptographic evidence of a consent. It intentionally
 * contains field names and hashes only—never the citizen's shared values.
 */
export const GET = handler(async (req, { params }) => {
  const { session } = await citizen(req);
  const consent = await db.query.consents.findFirst({ where: eq(t.consents.id, params.id!) });
  if (!consent) throw new ApiError(404, "CONSENT_NOT_FOUND");
  await requireProfileAccess(session, consent.profileId);

  const [partner, form, share] = await Promise.all([
    db.query.partners.findFirst({ where: eq(t.partners.id, consent.partnerId) }),
    consent.formId ? db.query.forms.findFirst({ where: eq(t.forms.id, consent.formId) }) : Promise.resolve(null),
    db.query.shares.findFirst({ where: eq(t.shares.consentId, consent.id) }),
  ]);
  if (!partner) throw new ApiError(409, "CONSENT_RECIPIENT_MISSING", "The recipient record is unavailable.");

  const claims: ConsentEvidenceReceipt = {
    iss: "applyonce",
    receipt_type: "applyonce-consent-evidence/v1",
    consent_id: consent.id,
    application_id: share?.applicationId ?? null,
    recipient: { id: partner.id, name: partner.name },
    form: form ? { id: form.id, name: form.name, version: form.version } : null,
    purpose: consent.purpose,
    field_keys: [...(share?.sharedKeys ?? consent.scope)].sort(),
    granted_at: consent.grantedAt.toISOString(),
    expires_at: consent.expiresAt.toISOString(),
    revoked_at: consent.revokedAt?.toISOString() ?? null,
    confirmation_method: consent.stepUpMethod,
    partner_payload_sha256: share?.payloadHash ?? null,
    partner_collected_at: share?.exchangedAt?.toISOString() ?? null,
  };
  const signature = await signReceiptPayload(claims);
  const receipt = decodeJws<ConsentEvidenceReceipt & { iat: number }>(signature);
  const jwksUrl = new URL("/api/v1/jwks", req.url).toString();

  return new Response(JSON.stringify({ receipt, signature, verification: { algorithm: "ES256", issuer: "applyonce", jwks_url: jwksUrl } }, null, 2), {
    headers: {
      "Cache-Control": "private, no-store",
      "Content-Disposition": `attachment; filename="applyonce-consent-${consent.id}.json"`,
      "Content-Type": "application/json; charset=utf-8",
      "X-Content-Type-Options": "nosniff",
    },
  });
});
