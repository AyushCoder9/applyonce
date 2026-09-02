/** data queue: data.export (JSON+gz to S3, signed URL) and data.erase (30-day grace, legal-hold check, hard delete). */
import { gzipSync } from "node:zlib";
import { db, eq, and, gte, inArray, getDek, getFacts, audit, user, profiles, documents, consents, applications, auditLog, dataRequests } from "@praman/db";
import { enqueue, type JobMap } from "@praman/jobs";
import { putObject, presignGet } from "../s3";

export async function dataExport(data: JobMap["data.export"]) {
  const { requestId, userId } = data;
  const dek = await getDek(userId);
  const userProfiles = await db.select().from(profiles).where(eq(profiles.ownerUserId, userId));
  const profileIds = userProfiles.map((p) => p.id);

  const profilesOut = [];
  for (const p of userProfiles) {
    const facts = await getFacts(dek, p.id);
    const docs = await db.select().from(documents).where(eq(documents.profileId, p.id));
    profilesOut.push({ profile: p, facts, documents: docs.map(({ storageKey, ...rest }) => rest) }); // ponytail: don't leak raw storage keys in the export
  }
  const consentRows = await db.select().from(consents).where(eq(consents.grantedByUserId, userId));
  const applicationRows = profileIds.length ? await db.select().from(applications).where(inArray(applications.profileId, profileIds)) : [];
  const auditRows = await db.select().from(auditLog).where(eq(auditLog.actorUserId, userId));

  const payload = { exportedAt: new Date().toISOString(), userId, profiles: profilesOut, consents: consentRows, applications: applicationRows, audit: auditRows };
  const gz = gzipSync(Buffer.from(JSON.stringify(payload, null, 2)));
  const key = `exports/${userId}/${requestId}.json.gz`;
  await putObject(key, gz, "application/gzip");

  await db.update(dataRequests).set({ status: "fulfilled", resultStorageKey: key, fulfilledAt: new Date() }).where(eq(dataRequests.id, requestId));
  const url = await presignGet(key, 86400);
  await enqueue("notify", { userId, category: "system", title: "Your data export is ready", body: "Link valid for 24 hours.", link: url });
  return { key };
}

const GRACE_MS = 30 * 86_400_000;
const HOLD_LOOKBACK_MS = 90 * 86_400_000;
const HOLD_STATUSES = ["submitted", "under_review", "shortlisted"] as const;

export async function dataErase(data: JobMap["data.erase"]) {
  const { requestId, userId } = data;
  const request = await db.query.dataRequests.findFirst({ where: eq(dataRequests.id, requestId) });
  if (!request) throw new Error(`data_request ${requestId} not found`);

  const dueAt = request.requestedAt.getTime() + GRACE_MS;
  if (Date.now() < dueAt) {
    await enqueue("data.erase", { requestId, userId }, { delay: dueAt - Date.now() });
    return { rescheduled: true };
  }

  const userProfiles = await db.select().from(profiles).where(eq(profiles.ownerUserId, userId));
  const profileIds = userProfiles.map((p) => p.id);
  const holds = profileIds.length
    ? await db.select().from(applications).where(and(inArray(applications.profileId, profileIds), inArray(applications.status, HOLD_STATUSES), gte(applications.updatedAt, new Date(Date.now() - HOLD_LOOKBACK_MS))))
    : [];
  if (holds.length) {
    await db.update(dataRequests).set({ status: "on_hold", notes: `Legal hold: ${holds.length} active application(s) in the last 90 days.` }).where(eq(dataRequests.id, requestId));
    return { held: true, count: holds.length };
  }

  await audit({ actorUserId: userId, action: "erase", targetType: "user", targetId: userId, meta: { requestId } });
  await db.delete(user).where(eq(user.id, userId)); // cascades: profiles, facts, documents, provider_links, consents, applications, data_requests, ...
  return { erased: true };
}
