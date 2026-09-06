/**
 * Envelope encryption: per-user DEK (32 B) wrapped by KEK (env in dev, KMS in prod).
 * Ciphertext layout: [iv(12) | tag(16) | data]. AES-256-GCM. AAD binds a context string (e.g. `fact:<profileId>:<key>`).
 */
import { createCipheriv, createDecipheriv, randomBytes, createHmac, createHash, hkdfSync, timingSafeEqual } from "node:crypto";

const IV = 12, TAG = 16;

export const newDek = () => randomBytes(32);

export function encrypt(key: Buffer, plaintext: Buffer | string, aad = ""): Buffer {
  const iv = randomBytes(IV);
  const c = createCipheriv("aes-256-gcm", key, iv);
  if (aad) c.setAAD(Buffer.from(aad));
  const data = Buffer.concat([c.update(typeof plaintext === "string" ? Buffer.from(plaintext, "utf8") : plaintext), c.final()]);
  return Buffer.concat([iv, c.getAuthTag(), data]);
}

export function decrypt(key: Buffer, blob: Buffer, aad = ""): Buffer {
  if (blob.length < IV + TAG) throw new Error("ciphertext too short");
  const d = createDecipheriv("aes-256-gcm", key, blob.subarray(0, IV));
  if (aad) d.setAAD(Buffer.from(aad));
  d.setAuthTag(blob.subarray(IV, IV + TAG));
  return Buffer.concat([d.update(blob.subarray(IV + TAG)), d.final()]);
}

export const decryptString = (key: Buffer, blob: Buffer, aad = "") => decrypt(key, blob, aad).toString("utf8");
export const encryptJson = (key: Buffer, v: unknown, aad = "") => encrypt(key, JSON.stringify(v), aad);
export const decryptJson = <T = unknown>(key: Buffer, blob: Buffer, aad = ""): T => JSON.parse(decryptString(key, blob, aad)) as T;

/** KEK from env (hex, 32 bytes). ponytail: env KEK now; swap for KMS wrap/unwrap when we have a KMS. */
export function kekFromEnv(hex = process.env.APPLYONCE_KEK_HEX): Buffer {
  if (!hex || !/^[0-9a-f]{64}$/i.test(hex)) throw new Error("APPLYONCE_KEK_HEX must be 64 hex chars");
  return Buffer.from(hex, "hex");
}
export const wrapDek = (kek: Buffer, dek: Buffer, userId: string) => encrypt(kek, dek, `dek:${userId}`);
export const unwrapDek = (kek: Buffer, wrapped: Buffer, userId: string) => decrypt(kek, wrapped, `dek:${userId}`);

/** Blind index for equality lookups on encrypted columns (phone/email). */
export function blindIndex(value: string, key = process.env.APPLYONCE_BLIND_INDEX_KEY ?? "dev-blind-index-key"): string {
  return createHmac("sha256", key).update(value.trim().toLowerCase()).digest("hex");
}
export const sha256 = (data: Buffer | string) => createHash("sha256").update(data).digest("hex");
export const hkdf = (ikm: Buffer, info: string, len = 32) => Buffer.from(hkdfSync("sha256", ikm, "applyonce", info, len));
export const safeEqual = (a: string, b: string) => a.length === b.length && timingSafeEqual(Buffer.from(a), Buffer.from(b));
export const randomToken = (bytes = 32) => randomBytes(bytes).toString("base64url");
/** stable hash over an object with sorted keys (payload/profile hashes) */
export const canonicalHash = (v: unknown) => sha256(JSON.stringify(v, Object.keys(flatten(v)).sort()));
function flatten(v: unknown, out: Record<string, true> = {}): Record<string, true> {
  if (v && typeof v === "object") for (const [k, x] of Object.entries(v)) { out[k] = true; flatten(x, out); }
  return out;
}
