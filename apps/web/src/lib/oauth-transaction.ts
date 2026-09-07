import { decryptJson, encryptJson, hkdf } from "@applyonce/crypto";
import type { ProviderAuthTransaction } from "@applyonce/providers";

type StoredOAuthTransaction = {
  provider: "digilocker";
  userId: string;
  profileId: string;
  next: string;
  issuedAt: number;
  transaction: ProviderAuthTransaction;
};

const aad = "applyonce:oauth-transaction:v1";
const key = () => hkdf(Buffer.from(process.env.BETTER_AUTH_SECRET ?? "dev-secret-change-me-dev-secret-change-me", "utf8"), aad);

export function sealOAuthTransaction(value: Omit<StoredOAuthTransaction, "issuedAt">) {
  return Buffer.from(encryptJson(key(), { ...value, issuedAt: Date.now() }, aad)).toString("base64url");
}
export function openOAuthTransaction(sealed: string, maxAgeMs = 10 * 60_000): StoredOAuthTransaction {
  const value = decryptJson<StoredOAuthTransaction>(key(), Buffer.from(sealed, "base64url"), aad);
  if (value.provider !== "digilocker" || !value.userId || !value.profileId || !value.transaction?.state || !value.transaction.redirectUri) throw new Error("Invalid OAuth transaction");
  if (!Number.isFinite(value.issuedAt) || value.issuedAt > Date.now() + 30_000 || Date.now() - value.issuedAt > maxAgeMs) throw new Error("OAuth transaction expired");
  if (!value.next.startsWith("/") || value.next.startsWith("//") || value.next.includes("\\")) throw new Error("Invalid OAuth return path");
  return value;
}
