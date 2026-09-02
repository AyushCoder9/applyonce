/**
 * @praman/sdk — Node helper for "Apply with Praman" partners.
 * Server-side only: holds your API key, exchanges share tokens, verifies payload signatures and webhooks.
 */
import { createHmac, timingSafeEqual } from "node:crypto";
import { jwtVerify, createRemoteJWKSet, customFetch, type JWTVerifyGetKey } from "jose";
import type { PramanPayload, ApplicationStatus } from "@praman/schema";
export type { PramanPayload, SharedFact, ApplicationStatus, WebhookEvent, FormDef, CustomField } from "@praman/schema";

export interface PramanOptions {
  /** `pk_sandbox_…` or `pk_live_…` — never ship to a browser */
  apiKey: string;
  /** Praman origin, e.g. `https://praman.in` (default) or `http://localhost:3300` */
  baseUrl?: string;
  /** Webhook signing secret shown once when the endpoint was created; needed for `verifyWebhook` */
  webhookSecret?: string;
  /** Override fetch (tests, proxies) */
  fetch?: typeof fetch;
}
export interface ShareSession { session_id: string; share_url: string; expires_at: string; env: "sandbox" | "live" }
export interface Exchange { payload: PramanPayload; jws: string; consent_id: string; application_id: string }
export interface WebhookEnvelope { event: string; created_at?: string; [k: string]: unknown }

export class PramanError extends Error {
  constructor(public status: number, public code: string, message?: string, public fields?: Record<string, string>) { super(message ?? code); this.name = "PramanError"; }
}

/** HMAC scheme (kept in sync with `@praman/crypto` `signWebhook`): `X-Praman-Timestamp: <unix s>`, `X-Praman-Signature: v1=hex(hmac_sha256(secret, `${ts}.${body}`))`. */
export function verifyWebhookSignature(secret: string, rawBody: string, signature: string | null | undefined, timestamp: string | null | undefined, toleranceSec = 300): boolean {
  const ts = Number(timestamp);
  if (!signature || !Number.isFinite(ts) || Math.abs(Date.now() / 1000 - ts) > toleranceSec) return false;
  const expected = `v1=${createHmac("sha256", secret).update(`${ts}.${rawBody}`).digest("hex")}`;
  return expected.length === signature.length && timingSafeEqual(Buffer.from(expected), Buffer.from(signature));
}

const header = (h: Headers | Record<string, string | string[] | undefined>, name: string): string | null => {
  if (typeof (h as Headers).get === "function") return (h as Headers).get(name);
  const v = (h as Record<string, string | string[] | undefined>)[name] ?? (h as Record<string, string | string[] | undefined>)[name.toLowerCase()];
  return Array.isArray(v) ? v[0] ?? null : v ?? null;
};

export function createPraman(opts: PramanOptions) {
  const base = (opts.baseUrl ?? "https://praman.in").replace(/\/$/, "");
  const f: typeof fetch = opts.fetch ?? ((...a) => globalThis.fetch(...a));
  const jwksUrl = new URL(`${base}/api/v1/jwks`);
  const keys: JWTVerifyGetKey = createRemoteJWKSet(jwksUrl, { [customFetch]: (url, o) => f(url, o) as Promise<Response> });

  async function call<T>(path: string, body?: unknown, init: { method?: string; idempotencyKey?: string } = {}): Promise<T> {
    const r = await f(`${base}/api/v1${path}`, {
      method: init.method ?? (body === undefined ? "GET" : "POST"),
      headers: { authorization: `Bearer ${opts.apiKey}`, "content-type": "application/json", accept: "application/json", ...(init.idempotencyKey ? { "idempotency-key": init.idempotencyKey } : {}) },
      body: body === undefined ? undefined : JSON.stringify(body),
    });
    const j = (await r.json().catch(() => ({}))) as { ok?: boolean; data?: T; error?: { code?: string; message?: string; fields?: Record<string, string> } };
    if (!r.ok || !j.ok) throw new PramanError(r.status, j.error?.code ?? `HTTP_${r.status}`, j.error?.message, j.error?.fields);
    return j.data as T;
  }

  return {
    /** Step 1 — on your server, before rendering the button. Open `share_url` (redirect or popup). */
    createShareSession(p: { formId?: string; formSlug?: string; returnUrl: string; state?: string; idempotencyKey?: string }) {
      return call<ShareSession>("/partner/share-sessions", { form_id: p.formId, form_slug: p.formSlug, return_url: p.returnUrl, state: p.state }, { idempotencyKey: p.idempotencyKey });
    },
    /** Step 2 — on your return page: exchange `?share_token=` (single use, 10 min) and verify the ES256 signature against Praman’s JWKS. */
    async exchange(shareToken: string, sessionId?: string): Promise<Exchange> {
      const sid = sessionId ?? shareToken.split(".")[0] ?? "_";
      const r = await call<{ payload_jws: string; consent_id: string; application_id: string }>(`/partner/share-sessions/${sid}/exchange`, { share_token: shareToken });
      const { payload } = await jwtVerify(r.payload_jws, keys, { issuer: "praman" });
      const p = payload as unknown as PramanPayload;
      if (p.consent_id !== r.consent_id) throw new PramanError(409, "PAYLOAD_MISMATCH", "consent_id in payload does not match the exchange response");
      return { payload: p, jws: r.payload_jws, consent_id: r.consent_id, application_id: r.application_id };
    },
    /** Verify a signed payload you stored earlier (e.g. re-checking before enrolment). */
    async verifyPayload(jws: string): Promise<PramanPayload> {
      const { payload } = await jwtVerify(jws, keys, { issuer: "praman" });
      return payload as unknown as PramanPayload;
    },
    /** Webhook receiver: pass the RAW request body string and the headers. Returns the parsed envelope or throws. */
    verifyWebhook(rawBody: string, headers: Headers | Record<string, string | string[] | undefined>, secret = opts.webhookSecret): WebhookEnvelope {
      if (!secret) throw new PramanError(500, "WEBHOOK_SECRET_MISSING", "Pass webhookSecret to createPraman()");
      if (!verifyWebhookSignature(secret, rawBody, header(headers, "x-praman-signature"), header(headers, "x-praman-timestamp"))) throw new PramanError(401, "WEBHOOK_SIGNATURE_INVALID");
      return JSON.parse(rawBody) as WebhookEnvelope;
    },
    /** Tell the citizen where their application stands; shows up in their Praman tracker + notification. */
    pushStatus(applicationId: string, p: { status: ApplicationStatus; note?: string; externalRef?: string }, idempotencyKey?: string) {
      return call<{ applicationId: string; status: ApplicationStatus; duplicate: boolean }>(`/partner/applications/${applicationId}/status`, { status: p.status, note: p.note, external_ref: p.externalRef }, { idempotencyKey: idempotencyKey ?? `${applicationId}:${p.status}:${p.externalRef ?? ""}` });
    },
    /** Ask the citizen to re-verify specific fields (e.g. a category certificate that looks expired). */
    requestVerification(p: { applicationId: string; factKeys: string[]; reason?: string }) {
      return call<{ id: string; status: string }>("/partner/verification-requests", { application_id: p.applicationId, fact_keys: p.factKeys, reason: p.reason });
    },
    listForms() { return call<unknown[]>("/partner/forms"); },
    createForm(def: Record<string, unknown>) { return call<unknown>("/partner/forms", def); },
    testWebhook(webhookId?: string) { return call<{ delivery_ids: string[] }>("/partner/webhooks/test", { webhook_id: webhookId }); },
  };
}
export type Praman = ReturnType<typeof createPraman>;
