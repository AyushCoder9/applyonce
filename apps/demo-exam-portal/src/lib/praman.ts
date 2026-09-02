/**
 * Thin partner-side Praman client, hand-written against docs/05-API-AND-FLOWS.md §1/§3
 * because `@praman/sdk` (packages/sdk/src/index.ts) is still `export {}` at the time
 * this was written (WP2 in progress). Swap for `createPraman` from `@praman/sdk` once
 * it ships — the shape here was deliberately kept close to that SDK's planned API
 * (`createShareSession`, `exchange`, `verifyWebhook`, `pushStatus`).
 *
 * DEMO_OFFLINE=1 (see .env / README) makes every method below return locally-built,
 * unsigned data instead of calling the live Praman API, so `/apply/return` and
 * `/status/[ref]` can be demoed with WP2 not running yet. If a live call fails with a
 * connection error we also fall back to offline data (never on an auth/4xx error —
 * that's a real bug, not "API not up yet").
 */
import { createHmac, timingSafeEqual } from "node:crypto";
import type { PramanPayload } from "@praman/schema";
import { buildOfflinePayload } from "./fixtures";
import { verifyEs256Jws, type Jwks } from "./jws-verify";

export interface PramanConfig {
  apiUrl: string;
  apiKey: string;
  formSlug: string;
  webhookSecret: string;
  /** self URL of this demo portal, used to build the offline-mode return link */
  selfUrl: string;
  offline: boolean;
}

export function loadPramanConfig(): PramanConfig {
  return {
    apiUrl: process.env.PRAMAN_API_URL ?? "http://localhost:3300",
    apiKey: process.env.BTA_PRAMAN_API_KEY ?? "pk_sandbox_bta_demo_key_0001",
    formSlug: process.env.BTA_PRAMAN_FORM_ID ?? "bta-jee-2026",
    webhookSecret: process.env.BTA_WEBHOOK_SECRET ?? "whsec_bta_demo_0001",
    selfUrl: process.env.NEXT_PUBLIC_DEMO_PORTAL_URL ?? "http://localhost:3301",
    offline: process.env.DEMO_OFFLINE === "1",
  };
}

function randomId(prefix: string): string {
  return `${prefix}_${Math.random().toString(36).slice(2, 10)}${Date.now().toString(36)}`;
}

function isConnectionError(err: unknown): boolean {
  const code = (err as { cause?: { code?: string } } | undefined)?.cause?.code ?? (err as { code?: string } | undefined)?.code;
  return code === "ECONNREFUSED" || code === "ENOTFOUND" || code === "ETIMEDOUT" || code === "UND_ERR_CONNECT_TIMEOUT";
}

async function partnerFetch<T>(cfg: PramanConfig, path: string, init: RequestInit & { idempotencyKey?: string } = {}): Promise<T> {
  const headers: Record<string, string> = {
    Authorization: `Bearer ${cfg.apiKey}`,
    "Content-Type": "application/json",
    ...(init.idempotencyKey ? { "Idempotency-Key": init.idempotencyKey } : {}),
    ...(init.headers as Record<string, string> | undefined),
  };
  const res = await fetch(`${cfg.apiUrl}${path}`, { ...init, headers });
  const text = await res.text();
  let json: unknown = {};
  try {
    json = text ? JSON.parse(text) : {};
  } catch {
    // non-JSON response (e.g. an HTML error page) — surface the raw text
  }
  if (!res.ok) {
    const j = json as { error?: { message?: string; code?: string } };
    throw new Error(`Praman API ${path} -> ${res.status}: ${j.error?.message ?? j.error?.code ?? text.slice(0, 200)}`);
  }
  const envelope = json as { ok?: boolean; data?: T };
  return (envelope.data ?? (json as T)) as T;
}

// ---------------- share sessions ----------------

export interface ShareSessionResult {
  share_url: string;
  session_id: string;
}

export async function createShareSession(cfg: PramanConfig, opts: { returnUrl: string; state: string }): Promise<ShareSessionResult> {
  if (!cfg.offline) {
    try {
      return await partnerFetch<ShareSessionResult>(cfg, "/api/v1/partner/share-sessions", {
        method: "POST",
        idempotencyKey: randomId("idem"),
        body: JSON.stringify({ form_slug: cfg.formSlug, return_url: opts.returnUrl, state: opts.state }),
      });
    } catch (err) {
      if (!isConnectionError(err)) throw err;
      // fall through to offline stand-in — Praman API isn't up yet
    }
  }
  const sessionId = randomId("sess_offline");
  const url = new URL("/apply/return", cfg.selfUrl);
  url.searchParams.set("share_token", `offline:${sessionId}`);
  url.searchParams.set("state", opts.state);
  return { share_url: url.toString(), session_id: sessionId };
}

// ---------------- exchange ----------------

export interface ExchangeResult {
  payload: PramanPayload;
  /** false when the JWS could not be cryptographically verified (offline demo mode) */
  verified: boolean;
  offline: boolean;
}

let jwksCache: { at: number; jwks: Jwks } | null = null;
async function fetchJwks(cfg: PramanConfig): Promise<Jwks> {
  if (jwksCache && Date.now() - jwksCache.at < 60_000) return jwksCache.jwks;
  const res = await fetch(`${cfg.apiUrl}/api/v1/jwks`);
  if (!res.ok) throw new Error(`GET /api/v1/jwks -> ${res.status}`);
  const json = (await res.json()) as { keys?: Jwks["keys"]; data?: Jwks };
  const jwks: Jwks = { keys: json.keys ?? json.data?.keys ?? [] };
  jwksCache = { at: Date.now(), jwks };
  return jwks;
}

export async function exchangeShareToken(cfg: PramanConfig, sessionId: string, shareToken: string): Promise<ExchangeResult> {
  const isOfflineToken = cfg.offline || shareToken.startsWith("offline:") || sessionId.startsWith("sess_offline");
  if (!isOfflineToken) {
    try {
      const { payload_jws } = await partnerFetch<{ payload_jws: string; consent_id: string; application_id: string }>(
        cfg,
        `/api/v1/partner/share-sessions/${sessionId}/exchange`,
        { method: "POST", idempotencyKey: randomId("idem"), body: JSON.stringify({ share_token: shareToken }) }
      );
      const jwks = await fetchJwks(cfg);
      const payload = await verifyEs256Jws<PramanPayload>(payload_jws, jwks, { issuer: "praman" });
      return { payload, verified: true, offline: false };
    } catch (err) {
      if (!isConnectionError(err)) throw err;
      // fall through to offline fixture — Praman API isn't up yet
    }
  }
  const payload = buildOfflinePayload({ formId: cfg.formSlug, applicationId: randomId("app_offline"), consentId: randomId("cons_offline"), audience: "bta" });
  return { payload, verified: false, offline: true };
}

// ---------------- webhook verification (HMAC-SHA256, packages/crypto/src/jws.ts scheme) ----------------

export function verifyWebhookSignature(cfg: PramanConfig, rawBody: string, signatureHeader: string | null, timestampHeader: string | null, toleranceSec = 300): boolean {
  if (!signatureHeader || !timestampHeader) return false;
  const ts = Number(timestampHeader);
  if (!Number.isFinite(ts) || Math.abs(Date.now() / 1000 - ts) > toleranceSec) return false;
  const expected = `v1=${createHmac("sha256", cfg.webhookSecret).update(`${ts}.${rawBody}`).digest("hex")}`;
  const a = Buffer.from(expected);
  const b = Buffer.from(signatureHeader);
  if (a.length !== b.length) return false;
  return timingSafeEqual(a, b);
}

// ---------------- status push ----------------

export interface PushStatusInput {
  status: string;
  note?: string;
  externalRef?: string;
}

export async function pushStatus(cfg: PramanConfig, applicationId: string, input: PushStatusInput, idempotencyKey = randomId("idem")): Promise<{ ok: boolean; offline: boolean }> {
  if (cfg.offline || applicationId.startsWith("app_offline")) {
    console.log(`[praman:offline] would push status for ${applicationId}:`, input);
    return { ok: true, offline: true };
  }
  try {
    await partnerFetch(cfg, `/api/v1/partner/applications/${applicationId}/status`, {
      method: "POST",
      idempotencyKey,
      body: JSON.stringify({ status: input.status, note: input.note, external_ref: input.externalRef }),
    });
    return { ok: true, offline: false };
  } catch (err) {
    if (isConnectionError(err)) {
      console.warn(`[praman] status API unreachable, treating as offline: ${(err as Error).message}`);
      return { ok: true, offline: true };
    }
    throw err;
  }
}
