/** ES256 signing key for partner payloads. Lives in `system_keys` (private JWK encrypted with the system DEK); generated on first use. */
import type { JWK } from "jose";
import { db, t, and, eq, systemDek } from "@praman/db";
import { generateSigningKey, signPayload, encryptJson, decryptJson, type SigningKey } from "@praman/crypto";
import type { PramanPayload } from "@praman/schema";

const g = globalThis as unknown as { __pramanSigningKey?: SigningKey };
const aad = (kid: string) => `syskey:${kid}`;

export async function getSigningKey(): Promise<SigningKey> {
  if (g.__pramanSigningKey) return g.__pramanSigningKey;
  const dek = systemDek();
  let row = await db.query.systemKeys.findFirst({ where: and(eq(t.systemKeys.kind, "jws_es256"), eq(t.systemKeys.active, true)) });
  if (!row) {
    const k = await generateSigningKey();
    await db.insert(t.systemKeys).values({ kid: k.kid, kind: "jws_es256", privateJwkEnc: encryptJson(dek, k.privateJwk, aad(k.kid)), publicJwk: k.publicJwk, active: true }).onConflictDoNothing();
    row = await db.query.systemKeys.findFirst({ where: and(eq(t.systemKeys.kind, "jws_es256"), eq(t.systemKeys.active, true)) });
  }
  const key: SigningKey = { kid: row!.kid, privateJwk: decryptJson<JWK>(dek, row!.privateJwkEnc, aad(row!.kid)), publicJwk: row!.publicJwk as JWK };
  g.__pramanSigningKey = key;
  return key;
}

/** JWS (JWT compact) over the payload; exchange TTL 10 min. `iat`/`exp` are set by the signer. */
export const signSharePayload = async (payload: PramanPayload, ttlSeconds = 600) => signPayload(await getSigningKey(), payload as unknown as Record<string, unknown>, ttlSeconds);

/** Every active public key (rotation-safe). */
export async function publicJwks(): Promise<{ keys: JWK[] }> {
  const rows = await db.select({ publicJwk: t.systemKeys.publicJwk }).from(t.systemKeys).where(and(eq(t.systemKeys.kind, "jws_es256"), eq(t.systemKeys.active, true)));
  if (!rows.length) return { keys: [(await getSigningKey()).publicJwk] };
  return { keys: rows.map((r) => r.publicJwk as JWK) };
}

/** Decode a JWS payload without verifying (we signed it; used for console views). */
export const decodeJws = <T = PramanPayload>(jws: string): T => JSON.parse(Buffer.from(jws.split(".")[1]!, "base64url").toString("utf8")) as T;
