/** scan.expiries: Aarav's OBC-NCL certificate (category.valid_until) expires ~40 days out -> falls in the 60-day window. */
import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { db, eq, and, sql, profiles, facts, notifications } from "@applyonce/db";
import { redis } from "@applyonce/jobs";
import { AARAV } from "@applyonce/providers/fixtures";
import { runInline } from "../src/inline";

let profileId: string;
let factId: string;

beforeAll(async () => {
  const profile = await db.query.profiles.findFirst({ where: and(eq(profiles.ownerUserId, AARAV.id), eq(profiles.kind, "self")) });
  if (!profile) throw new Error("seed missing — run `pnpm db:seed` (or `pnpm db:reset`) at repo root first");
  profileId = profile.id;
  const factRow = await db.query.facts.findFirst({ where: and(eq(facts.profileId, profileId), eq(facts.factKey, "category.valid_until")) });
  if (!factRow?.expiresAt) throw new Error("seed missing category.valid_until for Aarav");
  factId = factRow.id;
  const daysLeft = Math.ceil((factRow.expiresAt.getTime() - Date.now()) / 86_400_000);
  expect(daysLeft).toBeGreaterThan(30);
  expect(daysLeft).toBeLessThanOrEqual(60);
  // clear any prior dedupe claim so the scan actually fires this run
  await redis().del(`applyonce:scan:expiry:${factId}:60d`);
});

afterAll(async () => {
  await redis().del(`applyonce:scan:expiry:${factId}:60d`);
  await sql.end();
});

describe("scan.expiries", () => {
  it("notifies Aarav in the 60-day window for his OBC-NCL certificate", async () => {
    const before = await db.select().from(notifications).where(eq(notifications.userId, AARAV.id));
    const result = (await runInline("scan.expiries", {})) as { scanned: number; notified: number };
    expect(result.scanned).toBeGreaterThan(0);

    const after = await db.select().from(notifications).where(eq(notifications.userId, AARAV.id));
    const created = after.filter((n) => !before.some((b) => b.id === n.id));
    const expiryNotif = created.find((n) => n.category === "expiry" && /expires/i.test(n.title));
    expect(expiryNotif).toBeTruthy();
    expect(expiryNotif?.link).toBe("/app/verify");
  });
});
