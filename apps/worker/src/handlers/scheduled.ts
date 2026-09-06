/** scheduled queue: nightly scans registered via upsertJobScheduler at boot. */
import { db, eq, and, isNull, isNotNull, lte, gte, getDek, getFacts, facts, profiles, documents, mismatches, relations, applications } from "@applyonce/db";
import { field, isFactKey } from "@applyonce/schema";
import { redis, enqueue, queue } from "@applyonce/jobs";

const DAY_MS = 86_400_000;
const dedupe = async (key: string, ttlSeconds: number) => (await redis().set(key, "1", "EX", ttlSeconds, "NX")) === "OK";

/** F6: facts.expires_at in 60/30/7-day windows or already expired -> one notify per fact per window (redis dedupe). */
export async function scanExpiries() {
  const now = Date.now();
  const horizon = new Date(now + 60 * DAY_MS);
  const rows = await db.select().from(facts).where(and(isNotNull(facts.expiresAt), lte(facts.expiresAt, horizon)));
  let notified = 0;
  for (const row of rows) {
    const daysLeft = Math.ceil((row.expiresAt!.getTime() - now) / DAY_MS);
    const win = daysLeft <= 0 ? "expired" : daysLeft <= 7 ? "7d" : daysLeft <= 30 ? "30d" : "60d";
    if (!(await dedupe(`applyonce:scan:expiry:${row.id}:${win}`, 90 * 86400))) continue;
    const profile = await db.query.profiles.findFirst({ where: eq(profiles.id, row.profileId) });
    if (!profile) continue;
    const label = isFactKey(row.factKey) ? field(row.factKey).label.en : row.factKey;
    const title = win === "expired" ? `${label} has expired` : `${label} expires in ${daysLeft} day${daysLeft === 1 ? "" : "s"}`;
    await enqueue("notify", { userId: profile.ownerUserId, category: "expiry", title, body: "Re-fetch from DigiLocker to keep it current.", link: "/app/verify" });
    notified++;
  }
  return { scanned: rows.length, notified };
}

/** F6: name mismatch across sources — identity.full_name (self/issuer) vs PAN doc / marksheet name in documents.meta. */
const normalizeName = (s: string) => s.toLowerCase().replace(/[^a-z\s]/g, "").replace(/\s+/g, " ").trim().replace(/[aeiou]/g, "");

export async function scanMismatches() {
  const allProfiles = await db.select().from(profiles);
  let created = 0;
  for (const profile of allProfiles) {
    const dek = await getDek(profile.ownerUserId);
    const [nameFact] = await getFacts(dek, profile.id, { keys: ["identity.full_name"] });
    if (!nameFact || typeof nameFact.value !== "string") continue;
    const primary = normalizeName(nameFact.value);
    const docs = await db.select().from(documents).where(eq(documents.profileId, profile.id));
    for (const doc of docs) {
      if (!["pan", "marksheet_10", "marksheet_12"].includes(doc.docType)) continue;
      const otherName = (doc.meta as Record<string, unknown> | null)?.name as string | undefined;
      if (!otherName || normalizeName(otherName) === primary) continue;
      const existingOpen = await db.query.mismatches.findFirst({ where: and(eq(mismatches.profileId, profile.id), eq(mismatches.factKey, "identity.full_name"), isNull(mismatches.resolvedAt)) });
      if (existingOpen) continue;
      await db.insert(mismatches).values({ profileId: profile.id, factKey: "identity.full_name", sourceA: nameFact.source, valueA: nameFact.value, sourceB: doc.docType, valueB: otherName, severity: "high" });
      created++;
    }
  }
  return { created };
}

/** F5: minor ward whose dob_year implies >= 18 -> notify guardian to hand over. */
export async function scanHandover18() {
  const currentYear = new Date().getFullYear();
  const rels = await db.select().from(relations).where(eq(relations.basis, "minor"));
  let notified = 0;
  for (const rel of rels) {
    const ward = await db.query.profiles.findFirst({ where: eq(profiles.id, rel.wardProfileId) });
    if (!ward?.dobYear || currentYear - ward.dobYear < 18) continue;
    if (!(await dedupe(`applyonce:scan:handover18:${rel.id}`, 365 * 86400))) continue;
    const guardian = await db.query.profiles.findFirst({ where: eq(profiles.id, rel.guardianProfileId) });
    if (!guardian) continue;
    const firstName = ward.displayName.split(" ")[0];
    await enqueue("notify", { userId: guardian.ownerUserId, category: "system", title: `${firstName} turned 18 — hand over their profile`, link: "/app/family" });
    notified++;
  }
  return { notified };
}

/** applications.deadline_at in 7/3/1-day windows -> notify. */
export async function scanDeadlines() {
  const now = Date.now();
  const horizon = new Date(now + 7 * DAY_MS);
  const apps = await db.select().from(applications).where(and(isNotNull(applications.deadlineAt), gte(applications.deadlineAt, new Date(now)), lte(applications.deadlineAt, horizon)));
  let notified = 0;
  for (const app of apps) {
    const daysLeft = Math.ceil((app.deadlineAt!.getTime() - now) / DAY_MS);
    const win = daysLeft <= 1 ? "1d" : daysLeft <= 3 ? "3d" : "7d";
    if (!(await dedupe(`applyonce:scan:deadline:${app.id}:${win}`, 30 * 86400))) continue;
    const profile = await db.query.profiles.findFirst({ where: eq(profiles.id, app.profileId) });
    if (!profile) continue;
    await enqueue("notify", { userId: profile.ownerUserId, category: "application", title: `${app.title}: deadline in ${daysLeft} day${daysLeft === 1 ? "" : "s"}`, link: `/app/applications/${app.id}` });
    notified++;
  }
  return { notified };
}

/** Register the four nightly scans as BullMQ Job Schedulers (idempotent — call at boot every time). */
export async function registerSchedulers() {
  const q = queue("scheduled");
  await q.upsertJobScheduler("scan-expiries", { pattern: "0 0 6 * * *", tz: "Asia/Kolkata" }, { name: "scan.expiries", data: {} });
  await q.upsertJobScheduler("scan-mismatches", { pattern: "0 10 6 * * *", tz: "Asia/Kolkata" }, { name: "scan.mismatches", data: {} });
  await q.upsertJobScheduler("scan-handover18", { pattern: "0 20 6 * * *", tz: "Asia/Kolkata" }, { name: "scan.handover18", data: {} });
  await q.upsertJobScheduler("scan-deadlines", { pattern: "0 30 6 * * *", tz: "Asia/Kolkata" }, { name: "scan.deadlines", data: {} });
}
