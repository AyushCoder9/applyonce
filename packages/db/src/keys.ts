import { eq } from "drizzle-orm";
import { hkdfSync } from "node:crypto";
import { kekFromEnv, newDek, wrapDek, unwrapDek } from "@applyonce/crypto";
import { db, type Db, type Tx } from "./client";
import { userKeys } from "./schema";

const cache = new Map<string, Buffer>(); // Process-local production cache; development resets must always reread wrapped keys.

/** Get (or create) the user's DEK. */
export async function getDek(userId: string, tx: Db | Tx = db): Promise<Buffer> {
  const cacheEnabled = process.env.NODE_ENV === "production";
  const hit = cacheEnabled ? cache.get(userId) : undefined;
  if (hit) return hit;
  const kek = kekFromEnv();
  const row = await tx.query.userKeys.findFirst({ where: eq(userKeys.userId, userId) });
  let dek: Buffer;
  if (row) dek = unwrapDek(kek, row.dekWrapped, userId);
  else {
    dek = newDek();
    await tx.insert(userKeys).values({ userId, dekWrapped: wrapDek(kek, dek, userId) }).onConflictDoNothing();
    const again = await tx.query.userKeys.findFirst({ where: eq(userKeys.userId, userId) });
    dek = unwrapDek(kek, again!.dekWrapped, userId);
  }
  if (cacheEnabled) cache.set(userId, dek);
  return dek;
}

/** System key for encrypting payload JWS at rest (derived from KEK; ponytail: single system key, rotate via KMS later). */
export const systemDek = () => {
  const kek = kekFromEnv();
  return Buffer.from(hkdfSync("sha256", kek, "applyonce", "system-payload-key", 32));
};
