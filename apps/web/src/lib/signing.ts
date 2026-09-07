/** ES256 signing key for partner payloads. Lives in `system_keys` (private JWK encrypted with the system DEK); generated on first use. */
import type { JWK } from "jose";
import { db, t, and, eq, systemDek } from "@applyonce/db";
import { generateSigningKey, signEvidence, signPayload, encryptJson, decryptJson, type SigningKey } from "@applyonce/crypto";
import type { ApplyOncePayload } from "@applyonce/schema";

const g = globalThis as unknown as { __applyonceSigningKey?: SigningKey };
const aad = (kid: string) => `syskey:${kid}`;

export async function getSigningKey(): Promise<SigningKey> {
  if (g.__applyonceSigningKey) return g.__applyonceSigningKey;
  const dek = systemDek();
  let row = await db.query.systemKeys.findFirst({ where: and(eq(t.systemKeys.kind, "jws_es256"), eq(t.systemKeys.active, true)) });
  if (!row) {
    const k = await generateSigningKey();
    await db.insert(t.systemKeys).values({ kid: k.kid, kind: "jws_es256", privateJwkEnc: encryptJson(dek, k.privateJwk, aad(k.kid)), publicJwk: k.publicJwk, active: true }).onConflictDoNothing();
    row = await db.query.systemKeys.findFirst({ where: and(eq(t.systemKeys.kind, "jws_es256"), eq(t.systemKeys.active, true)) });
  }
  const key: SigningKey = { kid: row!.kid, privateJwk: decryptJson<JWK>(dek, row!.privateJwkEnc, aad(row!.kid)), publicJwk: row!.publicJwk as JWK };
  g.__applyonceSigningKey = key;
  return key;
}

/** JWS (JWT compact) over the payload; exchange TTL 10 min. `iat`/`exp` are set by the signer. */
export const signSharePayload = async (payload: ApplyOncePayload, ttlSeconds = 600) => signPayload(await getSigningKey(), payload as unknown as Record<string, unknown>, ttlSeconds);

/** Durable proof only; this signature is never accepted as an access token. */
export const signReceiptPayload = async (payload: Record<string, unknown>) => signEvidence(await getSigningKey(), payload);

/** Every active public key (rotation-safe). */
export async function publicJwks(): Promise<{ keys: JWK[] }> {
  const rows = await db.select({ publicJwk: t.systemKeys.publicJwk }).from(t.systemKeys).where(and(eq(t.systemKeys.kind, "jws_es256"), eq(t.systemKeys.active, true)));
  if (!rows.length) return { keys: [(await getSigningKey()).publicJwk] };
  return { keys: rows.map((r) => r.publicJwk as JWK) };
}

/** Decode a JWS payload without verifying (we signed it; used for console views). */
export const decodeJws = <T = ApplyOncePayload>(jws: string): T => JSON.parse(Buffer.from(jws.split(".")[1]!, "base64url").toString("utf8")) as T;
