/** Partner-facing side effects shared by the Bearer API and the console: webhook fan-out, status push, verification requests. */
import { db, t, and, eq, audit, type Db, type Tx } from "@praman/db";
import { enqueue } from "@praman/jobs";
import type { WebhookEvent, ApplicationStatus } from "@praman/schema";
import { ApiError } from "./api";

/** Create one `webhook_deliveries` row per active endpoint subscribed to `event`. Returns ids; call `flushDeliveries` after the tx commits. */
export async function queueWebhook(partnerId: string, event: WebhookEvent | "test.ping", payload: Record<string, unknown>, tx: Db | Tx = db, opts: { webhookId?: string } = {}) {
  const hooks = (await tx.select().from(t.partnerWebhooks).where(and(eq(t.partnerWebhooks.partnerId, partnerId), eq(t.partnerWebhooks.active, true))))
    .filter((h) => (opts.webhookId ? h.id === opts.webhookId : h.events.includes(event)));
  if (!hooks.length) return [] as string[];
  const rows = await tx.insert(t.webhookDeliveries).values(hooks.map((h) => ({ webhookId: h.id, event, payload: { event, created_at: new Date().toISOString(), ...payload } }))).returning({ id: t.webhookDeliveries.id });
  return rows.map((r) => r.id);
}
/** Enqueue outside the transaction; a Redis outage must not roll back a consent. Worker retries pending rows anyway. */
export async function flushDeliveries(ids: string[]) {
  await Promise.all(ids.map((deliveryId) => enqueue("webhook.deliver", { deliveryId }).catch((e) => console.error("enqueue webhook.deliver failed", e))));
}
export const dispatchWebhook = async (partnerId: string, event: WebhookEvent, payload: Record<string, unknown>) => flushDeliveries(await queueWebhook(partnerId, event, payload));

/** Application must belong to a share of this partner (or be attributed to it). */
export async function partnerApplication(partnerId: string, applicationId: string) {
  const app = await db.query.applications.findFirst({ where: eq(t.applications.id, applicationId) });
  if (!app || app.partnerId !== partnerId) throw new ApiError(404, "APPLICATION_NOT_FOUND");
  return app;
}

export async function pushApplicationStatus(partnerId: string, applicationId: string, p: { status: ApplicationStatus; note?: string | null; externalRef?: string | null }, idempotencyKey: string, actorUserId?: string | null) {
  const app = await partnerApplication(partnerId, applicationId);
  const dup = await db.query.partnerStatusPushes.findFirst({ where: eq(t.partnerStatusPushes.idempotencyKey, idempotencyKey) });
  if (dup) return { applicationId, status: dup.status, duplicate: true };
  const partner = (await db.query.partners.findFirst({ where: eq(t.partners.id, partnerId) }))!;
  const profile = (await db.query.profiles.findFirst({ where: eq(t.profiles.id, app.profileId) }))!;
  const title = `${partner.name}: ${STATUS_LABEL[p.status] ?? p.status}`;
  await db.transaction(async (tx) => {
    await tx.insert(t.partnerStatusPushes).values({ partnerId, applicationId, status: p.status, note: p.note ?? null, idempotencyKey });
    await tx.update(t.applications).set({ status: p.status, ...(p.externalRef ? { externalRef: p.externalRef } : {}), updatedAt: new Date() }).where(eq(t.applications.id, applicationId));
    await tx.insert(t.applicationEvents).values({ applicationId, type: "status", title: STATUS_LABEL[p.status] ?? p.status, body: p.note ?? (p.externalRef ? `Reference ${p.externalRef}` : null), actor: "partner", meta: { status: p.status, externalRef: p.externalRef ?? null } });
    await audit({ actorPartnerId: partnerId, actorUserId: actorUserId ?? null, action: "application.status", targetType: "application", targetId: applicationId, meta: { status: p.status } }, tx);
  });
  await enqueue("notify", { userId: profile.ownerUserId, category: "application", title, body: p.note ?? undefined, link: `/app/applications/${applicationId}` }).catch((e) => console.error("enqueue notify failed", e));
  return { applicationId, status: p.status, duplicate: false };
}

export async function createVerificationRequest(partnerId: string, p: { applicationId: string; factKeys: string[]; reason?: string | null }, actorUserId?: string | null) {
  const app = await partnerApplication(partnerId, p.applicationId);
  const partner = (await db.query.partners.findFirst({ where: eq(t.partners.id, partnerId) }))!;
  const profile = (await db.query.profiles.findFirst({ where: eq(t.profiles.id, app.profileId) }))!;
  const [row] = await db.insert(t.verificationRequests).values({ partnerId, applicationId: p.applicationId, factKeys: p.factKeys, reason: p.reason ?? null }).returning();
  await db.insert(t.applicationEvents).values({ applicationId: p.applicationId, type: "note", title: `${partner.name} asked you to re-verify ${p.factKeys.length} field${p.factKeys.length === 1 ? "" : "s"}`, body: p.reason ?? null, actor: "partner", meta: { factKeys: p.factKeys, verificationRequestId: row!.id } });
  await audit({ actorPartnerId: partnerId, actorUserId: actorUserId ?? null, action: "verification.request", targetType: "application", targetId: p.applicationId, meta: { factKeys: p.factKeys } });
  await enqueue("notify", { userId: profile.ownerUserId, category: "verification", title: `${partner.name} needs ${p.factKeys.length} field${p.factKeys.length === 1 ? "" : "s"} re-verified`, body: p.reason ?? undefined, link: `/app/applications/${p.applicationId}` }).catch((e) => console.error("enqueue notify failed", e));
  return row!;
}

export const STATUS_LABEL: Record<ApplicationStatus, string> = { draft: "Draft", submitted: "Submitted", under_review: "Under review", shortlisted: "Shortlisted", accepted: "Accepted", rejected: "Not selected", withdrawn: "Withdrawn", enrolled: "Enrolled" };
