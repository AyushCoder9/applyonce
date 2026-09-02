/**
 * Minimal ES256 compact-JWS verification using Web Crypto (`crypto.subtle`), with no
 * `jose` dependency. `jose` (packages/sdk's dep) does not resolve from this package's
 * node_modules — see apps/demo-exam-portal/README.md "Why hand-rolled JWS verify".
 *
 * WebCrypto's ECDSA verify expects the raw r||s signature (not DER) — which is exactly
 * what a compact JWS carries, so no re-encoding is needed.
 */

export interface Jwk {
  kty: string;
  crv?: string;
  x?: string;
  y?: string;
  kid?: string;
  alg?: string;
  use?: string;
  [k: string]: unknown;
}

export interface Jwks {
  keys: Jwk[];
}

function base64urlToBytes(b64url: string): Uint8Array {
  const b64 = b64url.replace(/-/g, "+").replace(/_/g, "/").padEnd(Math.ceil(b64url.length / 4) * 4, "=");
  const bin = atob(b64);
  const bytes = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
  return bytes;
}

function base64urlToJson<T>(b64url: string): T {
  return JSON.parse(new TextDecoder().decode(base64urlToBytes(b64url))) as T;
}

export interface JwsHeader {
  alg: string;
  kid?: string;
  typ?: string;
}

export class JwsVerifyError extends Error {}

/**
 * Verify a compact ES256 JWS against a JWKS, checking `exp`/`nbf` and optional
 * `issuer`/`audience`. Returns the decoded, verified payload.
 */
export async function verifyEs256Jws<T extends object>(
  jws: string,
  jwks: Jwks,
  opts: { issuer?: string; audience?: string } = {}
): Promise<T> {
  const parts = jws.split(".");
  if (parts.length !== 3) throw new JwsVerifyError("Malformed JWS: expected 3 segments");
  const [headerB64, payloadB64, sigB64] = parts as [string, string, string];

  const header = base64urlToJson<JwsHeader>(headerB64);
  if (header.alg !== "ES256") throw new JwsVerifyError(`Unsupported alg: ${header.alg}`);

  const jwk = header.kid ? jwks.keys.find((k) => k.kid === header.kid) : jwks.keys[0];
  if (!jwk) throw new JwsVerifyError(`No matching JWKS key for kid=${header.kid ?? "(none)"}`);
  if (jwk.kty !== "EC" || jwk.crv !== "P-256") throw new JwsVerifyError("JWKS key is not an EC P-256 key");

  const publicKey = await crypto.subtle.importKey("jwk", jwk as JsonWebKey, { name: "ECDSA", namedCurve: "P-256" }, false, ["verify"]);

  const data = new TextEncoder().encode(`${headerB64}.${payloadB64}`);
  const signature = base64urlToBytes(sigB64);
  // Uint8Array's `buffer` is typed ArrayBufferLike (ArrayBuffer | SharedArrayBuffer); it's always
  // a plain ArrayBuffer at runtime here, but crypto.subtle's BufferSource type wants that spelled out.
  const valid = await crypto.subtle.verify({ name: "ECDSA", hash: "SHA-256" }, publicKey, signature as BufferSource, data as BufferSource);
  if (!valid) throw new JwsVerifyError("Signature verification failed");

  const payload = base64urlToJson<T & { iss?: string; aud?: string; exp?: number; nbf?: number }>(payloadB64);
  const now = Math.floor(Date.now() / 1000);
  if (typeof payload.exp === "number" && now > payload.exp) throw new JwsVerifyError("Token expired");
  if (typeof payload.nbf === "number" && now < payload.nbf) throw new JwsVerifyError("Token not yet valid");
  if (opts.issuer && payload.iss !== opts.issuer) throw new JwsVerifyError(`Unexpected issuer: ${payload.iss}`);
  if (opts.audience && payload.aud !== opts.audience) throw new JwsVerifyError(`Unexpected audience: ${payload.aud}`);

  return payload as T;
}
