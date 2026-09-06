import { randomUUID } from "node:crypto";
import { NextResponse } from "next/server";
import { loadApplyOnceConfig, verifyWebhookSignature } from "@/lib/applyonce";
import { appendWebhookEvent, markConsentRevoked } from "@/lib/store";

/**
 * ApplyOnce webhook receiver. HMAC scheme from packages/crypto/src/jws.ts:
 * `X-ApplyOnce-Signature: v1=hex(hmac_sha256(secret, "${ts}.${rawBody}"))`, `X-ApplyOnce-Timestamp: ts`.
 * Rejects on signature mismatch or a timestamp older than 5 minutes (replay protection).
 */
export async function POST(request: Request) {
  const rawBody = await request.text();
  const signature = request.headers.get("x-applyonce-signature");
  const timestamp = request.headers.get("x-applyonce-timestamp");
  const cfg = loadApplyOnceConfig();

  const verified = verifyWebhookSignature(cfg, rawBody, signature, timestamp);
  if (!verified) {
    appendWebhookEvent({ id: randomUUID(), type: "unknown", receivedAt: new Date().toISOString(), verified: false, payload: null, note: "Rejected: invalid signature or stale timestamp" });
    return NextResponse.json({ ok: false, error: { code: "invalid_signature", message: "HMAC verification failed" } }, { status: 401 });
  }

  const body = safeParse(rawBody) as { type?: string; event?: string; data?: Record<string, unknown> } | null;
  const type = body?.type ?? body?.event ?? "unknown";
  const data = body?.data ?? (body as Record<string, unknown> | null) ?? {};

  appendWebhookEvent({ id: randomUUID(), type, receivedAt: new Date().toISOString(), verified: true, payload: body });

  if (type === "consent.revoked") {
    const consentId = firstString(data, ["consent_id", "consentId"]);
    const applicationId = firstString(data, ["application_id", "applicationId"]);
    markConsentRevoked((a) => (consentId != null && a.applyonceConsentId === consentId) || (applicationId != null && a.applyonceApplicationId === applicationId));
  }

  return NextResponse.json({ ok: true });
}

function safeParse(raw: string): unknown {
  try {
    return raw ? JSON.parse(raw) : {};
  } catch {
    return { raw };
  }
}

function firstString(obj: Record<string, unknown>, keys: string[]): string | null {
  for (const k of keys) if (typeof obj[k] === "string") return obj[k] as string;
  return null;
}
