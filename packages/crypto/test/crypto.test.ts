import { describe, it, expect } from "vitest";
import { newDek, encrypt, decrypt, encryptJson, decryptJson, wrapDek, unwrapDek, blindIndex, generateSigningKey, signEvidence, signPayload, verifyPayload, signWebhook, verifyWebhook, canonicalHash } from "../src";

describe("envelope", () => {
  const kek = Buffer.alloc(32, 7), dek = newDek();
  it("round-trips with AAD", () => {
    const ct = encrypt(dek, "ABCDE1234F", "fact:p1:identity.pan");
    expect(decrypt(dek, ct, "fact:p1:identity.pan").toString()).toBe("ABCDE1234F");
    expect(() => decrypt(dek, ct, "fact:p2:identity.pan")).toThrow();
    expect(() => decrypt(newDek(), ct, "fact:p1:identity.pan")).toThrow();
  });
  it("json + dek wrap", () => {
    expect(decryptJson(dek, encryptJson(dek, { a: 1 }))).toEqual({ a: 1 });
    expect(unwrapDek(kek, wrapDek(kek, dek, "u1"), "u1").equals(dek)).toBe(true);
    expect(() => unwrapDek(kek, wrapDek(kek, dek, "u1"), "u2")).toThrow();
  });
  it("blind index is stable + normalised", () => {
    expect(blindIndex(" A@B.com ", "k")).toBe(blindIndex("a@b.com", "k"));
    expect(blindIndex("a", "k")).not.toBe(blindIndex("a", "k2"));
  });
  it("canonical hash ignores key order", () => {
    expect(canonicalHash({ a: 1, b: { c: 2, d: 3 } })).toBe(canonicalHash({ b: { d: 3, c: 2 }, a: 1 }));
  });
});

describe("jws", () => {
  it("signs and verifies with JWKS; rejects wrong audience", async () => {
    const key = await generateSigningKey();
    const jws = await signPayload(key, { iss: "applyonce", aud: "partner-1", consent_id: "c1" });
    const p = await verifyPayload<{ consent_id: string }>(jws, { keys: [key.publicJwk] }, { audience: "partner-1" });
    expect(p.consent_id).toBe("c1");
    await expect(verifyPayload(jws, { keys: [key.publicJwk] }, { audience: "partner-2" })).rejects.toThrow();
    const other = await generateSigningKey();
    await expect(verifyPayload(jws, { keys: [other.publicJwk] })).rejects.toThrow();
  });
  it("signs durable evidence without turning it into an expiring access token", async () => {
    const key = await generateSigningKey("receipt-key");
    const jws = await signEvidence(key, { iss: "applyonce", receipt_type: "applyonce-consent-evidence/v1", consent_id: "c1" });
    const p = await verifyPayload<{ consent_id: string; receipt_type: string; exp?: number }>(jws, { keys: [key.publicJwk] });
    expect(p.consent_id).toBe("c1");
    expect(p.receipt_type).toBe("applyonce-consent-evidence/v1");
    expect(p.exp).toBeUndefined();
  });
  it("webhook hmac", () => {
    const { ts, sig } = signWebhook("s", '{"x":1}');
    expect(verifyWebhook("s", '{"x":1}', sig, String(ts))).toBe(true);
    expect(verifyWebhook("s", '{"x":2}', sig, String(ts))).toBe(false);
    expect(verifyWebhook("s", '{"x":1}', sig, String(ts - 1000))).toBe(false);
  });
});
