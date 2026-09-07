/** ES256 JWS for partner payloads + JWKS publishing + webhook HMAC. */
import { SignJWT, jwtVerify, generateKeyPair, exportJWK, importJWK, createLocalJWKSet, type JWK, type JWTPayload } from "jose";
import { createHmac } from "node:crypto";
import { safeEqual } from "./envelope";

export interface SigningKey { kid: string; privateJwk: JWK; publicJwk: JWK }

export async function generateSigningKey(kid = `applyonce-${Date.now().toString(36)}`): Promise<SigningKey> {
  const { privateKey, publicKey } = await generateKeyPair("ES256", { extractable: true });
  const privateJwk = { ...(await exportJWK(privateKey)), kid, alg: "ES256", use: "sig" };
  const publicJwk = { ...(await exportJWK(publicKey)), kid, alg: "ES256", use: "sig" };
  return { kid, privateJwk, publicJwk };
}

export async function signPayload(key: SigningKey, payload: JWTPayload, ttlSeconds = 600): Promise<string> {
  const pk = await importJWK(key.privateJwk, "ES256");
  return new SignJWT(payload).setProtectedHeader({ alg: "ES256", kid: key.kid, typ: "JWT" }).setIssuedAt().setExpirationTime(`${ttlSeconds}s`).sign(pk);
}

/**
 * Sign durable evidence without an expiry claim. This is for receipts that must
 * remain verifiable after an operational session expires; it must never be used
 * as an authorization token.
 */
export async function signEvidence(key: SigningKey, payload: JWTPayload): Promise<string> {
  const pk = await importJWK(key.privateJwk, "ES256");
  return new SignJWT(payload).setProtectedHeader({ alg: "ES256", kid: key.kid, typ: "JWT" }).setIssuedAt().sign(pk);
}

export async function verifyPayload<T extends JWTPayload>(jws: string, jwks: { keys: JWK[] }, opts: { audience?: string; issuer?: string } = {}): Promise<T> {
  const set = createLocalJWKSet(jwks);
  const { payload } = await jwtVerify(jws, set, { issuer: opts.issuer ?? "applyonce", audience: opts.audience });
  return payload as T;
}

export const signWebhook = (secret: string, body: string, ts = Math.floor(Date.now() / 1000)) =>
  ({ ts, sig: `v1=${createHmac("sha256", secret).update(`${ts}.${body}`).digest("hex")}` });

export function verifyWebhook(secret: string, body: string, header: string, tsHeader: string, toleranceSec = 300): boolean {
  const ts = Number(tsHeader);
  if (!Number.isFinite(ts) || Math.abs(Date.now() / 1000 - ts) > toleranceSec) return false;
  return safeEqual(signWebhook(secret, body, ts).sig, header);
}
