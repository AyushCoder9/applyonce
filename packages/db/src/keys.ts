import { eq } from "drizzle-orm";
import { hkdfSync } from "node:crypto";
import { kekFromEnv, newDek, wrapDek, unwrapDek } from "@praman/crypto";
import { db, type Db, type Tx } from "./client";
import { userKeys } from "./schema";

const cache = new Map<string, Buffer>(); // ponytail: process-local DEK cache; fine for one web + one worker

/** Get (or create) the user's DEK. */
export async function getDek(userId: string, tx: Db | Tx = db): Promise<Buffer> {
  const hit = cache.get(userId);
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
  cache.set(userId, dek);
  return dek;
}

/** System key for encrypting payload JWS at rest (derived from KEK; ponytail: single system key, rotate via KMS later). */
export const systemDek = () => {
  const kek = kekFromEnv();
  return Buffer.from(hkdfSync("sha256", kek, "praman", "system-payload-key", 32));
};
