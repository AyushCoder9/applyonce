import { describe, it, expect } from "vitest";
import { createHmac } from "node:crypto";
import { SignJWT, generateKeyPair, exportJWK } from "jose";
import { createApplyOnce, verifyWebhookSignature, ApplyOnceError } from "../src/index";

const sign = (secret: string, body: string, ts = Math.floor(Date.now() / 1000)) => ({ ts: String(ts), sig: `v1=${createHmac("sha256", secret).update(`${ts}.${body}`).digest("hex")}` });

describe("verifyWebhook", () => {
  const secret = "whsec_test";
  const body = JSON.stringify({ event: "share.completed", application_id: "app_1" });
  it("accepts a fresh, correctly signed body", () => {
    const { ts, sig } = sign(secret, body);
    expect(verifyWebhookSignature(secret, body, sig, ts)).toBe(true);
    const p = createApplyOnce({ apiKey: "pk_sandbox_x", webhookSecret: secret });
    expect(p.verifyWebhook(body, { "x-applyonce-signature": sig, "x-applyonce-timestamp": ts }).event).toBe("share.completed");
    expect(p.verifyWebhook(body, new Headers({ "X-ApplyOnce-Signature": sig, "X-ApplyOnce-Timestamp": ts })).application_id).toBe("app_1");
  });
  it("rejects tampering, wrong secret and stale timestamps", () => {
    const { ts, sig } = sign(secret, body);
    expect(verifyWebhookSignature(secret, body + " ", sig, ts)).toBe(false);
    expect(verifyWebhookSignature("other", body, sig, ts)).toBe(false);
    const old = sign(secret, body, Math.floor(Date.now() / 1000) - 3600);
    expect(verifyWebhookSignature(secret, body, old.sig, old.ts)).toBe(false);
    const p = createApplyOnce({ apiKey: "pk_sandbox_x", webhookSecret: secret });
    expect(() => p.verifyWebhook(body, { "x-applyonce-signature": "v1=00", "x-applyonce-timestamp": ts })).toThrow(ApplyOnceError);
  });
});

describe("exchange + payload verification", () => {
  it("exchanges a share token and verifies the JWS against the JWKS (via injected fetch)", async () => {
    const { privateKey, publicKey } = await generateKeyPair("ES256", { extractable: true });
    const kid = "test-kid";
    const jwk = { ...(await exportJWK(publicKey)), kid, alg: "ES256", use: "sig" };
    const payload = { iss: "applyonce", sub: "s", aud: "partner_1", jti: "share_1", consent_id: "c_1", application_id: "a_1", form_id: "f", form_version: 1, purpose: "exam_application", profile: { kind: "self", display_name: "Aarav" }, facts: [{ key: "identity.full_name", value: "Aarav Sharma", source: "issuer_verified", verifiedBy: "uidai" }], custom: {}, profile_hash: "h" };
    const jws = await new SignJWT(payload).setProtectedHeader({ alg: "ES256", kid, typ: "JWT" }).setIssuedAt().setExpirationTime("10m").sign(privateKey);
    const calls: string[] = [];
    const fetchImpl: typeof fetch = async (input, init) => {
      const url = String(input); calls.push(`${init?.method ?? "GET"} ${url}`);
      if (url.endsWith("/api/v1/jwks")) return new Response(JSON.stringify({ keys: [jwk] }), { headers: { "content-type": "application/json" } });
      if (url.endsWith("/exchange")) {
        expect(url).toContain("/partner/share-sessions/sess_1/exchange");
        expect(new Headers(init?.headers).get("authorization")).toBe("Bearer pk_sandbox_x");
        return new Response(JSON.stringify({ ok: true, data: { payload_jws: jws, consent_id: "c_1", application_id: "a_1" } }), { headers: { "content-type": "application/json" } });
      }
      return new Response(JSON.stringify({ ok: false, error: { code: "NOT_FOUND" } }), { status: 404 });
    };
    const p = createApplyOnce({ apiKey: "pk_sandbox_x", baseUrl: "http://applyonce.test", fetch: fetchImpl });
    const r = await p.exchange("sess_1.randomtokenvalue0123456789");
    expect(r.consent_id).toBe("c_1");
    expect(r.payload.facts[0]?.value).toBe("Aarav Sharma");
    expect(calls.some((c) => c.includes("/api/v1/jwks"))).toBe(true);
    // a JWS from a different key must fail
    const { privateKey: other } = await generateKeyPair("ES256");
    const forged = await new SignJWT(payload).setProtectedHeader({ alg: "ES256", kid, typ: "JWT" }).setIssuedAt().setExpirationTime("10m").sign(other);
    await expect(p.verifyPayload(forged)).rejects.toThrow();
  });
  it("surfaces API errors as ApplyOnceError with code", async () => {
    const p = createApplyOnce({ apiKey: "pk_sandbox_x", baseUrl: "http://applyonce.test", fetch: async () => new Response(JSON.stringify({ ok: false, error: { code: "SHARE_TOKEN_USED", message: "used" } }), { status: 409 }) });
    await expect(p.exchange("sess.tok")).rejects.toMatchObject({ status: 409, code: "SHARE_TOKEN_USED" });
  });
});
