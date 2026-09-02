import { z } from "zod";
import { db, t, eq, asc } from "@praman/db";
import { handler, citizen, body, ok, ApiError, log } from "@/lib/api";
import { dispatchWebhook } from "@/lib/webhooks";
import { serializeApp } from "@/components/applications/model";

async function load(id: string) {
  const a = await db.query.applications.findFirst({ where: eq(t.applications.id, id) });
  if (!a) throw new ApiError(404, "APPLICATION_NOT_FOUND");
  return a;
}

/** GET /api/v1/applications/:id — application + timeline + documents + consent reference. */
export const GET = handler(async (req, { params }) => {
  const a = await load(params.id!);
  await citizen(req, { profileId: a.profileId });
  const events = await db.select().from(t.applicationEvents).where(eq(t.applicationEvents.applicationId, a.id)).orderBy(asc(t.applicationEvents.createdAt));
  const docs = await db.select({ id: t.documents.id, title: t.documents.title, docType: t.documents.docType, label: t.applicationDocuments.label }).from(t.applicationDocuments).innerJoin(t.documents, eq(t.applicationDocuments.documentId, t.documents.id)).where(eq(t.applicationDocuments.applicationId, a.id));
  const share = await db.query.shares.findFirst({ where: eq(t.shares.applicationId, a.id) });
  return ok({ ...serializeApp(a), events: events.map((e) => ({ id: e.id, type: e.type, title: e.title, body: e.body, actor: e.actor, meta: e.meta, created_at: e.createdAt.toISOString() })), documents: docs, consent_id: share?.consentId ?? null });
});

/** PATCH /api/v1/applications/:id {status:'withdrawn'} | {external_ref} | {portal_url} | {deadline_at} */
export const PATCH = handler(async (req, { params }) => {
  const b = await body(req, z.object({ status: z.literal("withdrawn").optional(), external_ref: z.string().max(120).optional().nullable(), portal_url: z.url().optional().nullable(), deadline_at: z.iso.date().or(z.iso.datetime({ offset: true })).optional().nullable() }));
  const a = await load(params.id!);
  const { session } = await citizen(req, { profileId: a.profileId });
  const set: Partial<typeof t.applications.$inferInsert> = { updatedAt: new Date() };
  if (b.external_ref !== undefined) set.externalRef = b.external_ref;
  if (b.portal_url !== undefined) set.portalUrl = b.portal_url;
  if (b.deadline_at !== undefined) set.deadlineAt = b.deadline_at ? new Date(b.deadline_at) : null;
  const withdrawing = b.status === "withdrawn" && a.status !== "withdrawn";
  if (withdrawing) {
    if (["accepted", "enrolled", "rejected"].includes(a.status)) throw new ApiError(409, "CANNOT_WITHDRAW", "This application is already decided");
    set.status = "withdrawn";
  }
  const [u] = await db.update(t.applications).set(set).where(eq(t.applications.id, a.id)).returning();
  if (withdrawing) {
    await db.insert(t.applicationEvents).values({ applicationId: a.id, type: "status", title: "Withdrawn by you", actor: "citizen" });
    await log(session, "application.withdraw", "application", a.id);
    if (a.partnerId) await dispatchWebhook(a.partnerId, "application.withdrawn", { application_id: a.id, external_ref: a.externalRef, withdrawn_at: new Date().toISOString() });
  } else await log(session, "application.update", "application", a.id, { keys: Object.keys(b) });
  return ok(serializeApp(u!));
});
