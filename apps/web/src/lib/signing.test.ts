/** Needs the local docker Postgres (DATABASE_URL) — same as packages/db tests. */
import { describe, it, expect, afterAll } from "vitest";
import { jwtVerify, createLocalJWKSet } from "jose";
import { db, t, eq, sql } from "@applyonce/db";
import type { ApplyOncePayload } from "@applyonce/schema";
import { getSigningKey, signSharePayload, publicJwks, decodeJws } from "./signing";

process.env.APPLYONCE_KEK_HEX ??= "0".repeat(64);
afterAll(async () => { await sql.end(); });

const payload: ApplyOncePayload = { iss: "applyonce", sub: "s", aud: "p", iat: 0, exp: 0, jti: "share_1", consent_id: "c_1", application_id: "a_1", form_id: "f", form_version: 1, purpose: "exam_application", profile: { kind: "self", display_name: "Test" }, facts: [{ key: "identity.full_name", value: "Test", source: "issuer_verified", verifiedBy: "uidai" }], custom: {}, profile_hash: "h" };

describe("signing", () => {
  it("creates one persistent ES256 key in system_keys (private JWK encrypted) and signs payloads verifiable via the JWKS", async () => {
    const k1 = await getSigningKey();
    const k2 = await getSigningKey();
    expect(k2.kid).toBe(k1.kid);
    const row = await db.query.systemKeys.findFirst({ where: eq(t.systemKeys.kid, k1.kid) });
    expect(row?.kind).toBe("jws_es256");
    expect(row?.privateJwkEnc.toString("utf8")).not.toContain('"d"');       // encrypted at rest
    expect((row?.publicJwk as { d?: string }).d).toBeUndefined();           // public half has no private scalar
    const jws = await signSharePayload(payload);
    const jwks = await publicJwks();
    const { payload: out, protectedHeader } = await jwtVerify(jws, createLocalJWKSet(jwks), { issuer: "applyonce", audience: "p" });
    expect(protectedHeader.kid).toBe(k1.kid);
    expect(out.consent_id).toBe("c_1");
    expect((out.exp as number) - (out.iat as number)).toBe(600);
    expect(decodeJws(jws).jti).toBe("share_1");
  });
});
