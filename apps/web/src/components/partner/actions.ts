"use server";
/** Partner console mutations. Console-only operations have no path in docs/05 §3, so they are server actions rather than new API routes. */
import { randomUUID } from "node:crypto";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { db, t, and, eq, audit, systemDek } from "@praman/db";
import { sha256, randomToken, encrypt, decryptString } from "@praman/crypto";
import { APPLICATION_STATUSES, isFactKey, type PramanPayload } from "@praman/schema";
import { ApiError } from "@/lib/api";
import { SESSION_TTL_MS } from "@/lib/share";
import { decodeJws } from "@/lib/signing";
import { queueWebhook, flushDeliveries, pushApplicationStatus, createVerificationRequest, partnerApplication } from "@/lib/webhooks";
import { requirePartnerMember, canManage } from "./session";
import { saveForm } from "./forms";
import { requireUser } from "@/lib/session";

type R<T = undefined> = { ok: true; data: T } | { ok: false; error: string; fields?: Record<string, string> };
const wrap = async <T>(fn: () => Promise<T>): Promise<R<T>> => {
  try { return { ok: true, data: await fn() }; }
  catch (e) {
    if (e instanceof ApiError) return { ok: false, error: e.message, fields: e.fields };
    if (e instanceof z.ZodError) return { ok: false, error: "Check the highlighted fields", fields: Object.fromEntries(e.issues.map((i) => [i.path.join("."), i.message])) };
    if ((e as { digest?: string }).digest?.startsWith("NEXT_REDIRECT")) throw e;
    console.error(e); return { ok: false, error: String((e as Error).message) };
  }
};
const manager = async () => { const m = await requirePartnerMember(); if (!canManage(m.role)) throw new ApiError(403, "FORBIDDEN", "Owners and admins only"); return m; };

// ---------- onboarding ----------
const orgInput = z.object({ name: z.string().trim().min(3).max(120), kind: z.enum(["exam_board", "university", "school", "employer", "bank", "hospital", "government", "other"]), regType: z.enum(["CIN", "UDISE", "AISHE", "GSTIN", "OTHER"]), regNo: z.string().trim().min(3).max(40), website: z.url(), dpoEmail: z.email() });
export async function registerOrganisation(raw: unknown): Promise<R<{ id: string }>> {
  return wrap(async () => {
    const session = await requireUser("/partner/onboarding");
    const i = orgInput.parse(raw);
    const slug = `${i.name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 40)}-${randomToken(3)}`.toLowerCase().replace(/[^a-z0-9-]/g, "");
    const [p] = await db.insert(t.partners).values({ slug, name: i.name, legalName: i.name, kind: i.kind, regType: i.regType, regNo: i.regNo, website: i.website, dpoEmail: i.dpoEmail, status: "pending" }).returning();
    await db.insert(t.partnerMembers).values({ partnerId: p!.id, userId: session.user.id, role: "owner" });
    await audit({ actorUserId: session.user.id, actorPartnerId: p!.id, action: "partner.register", targetType: "partner", targetId: p!.id, meta: { kind: i.kind, regType: i.regType } });
    return { id: p!.id };
  });
}

// ---------- forms ----------
export async function saveFormAction(raw: unknown, existingId?: string): Promise<R<{ id: string; slug: string; version: number }>> {
  return wrap(async () => {
    const { partner, session } = await manager();
    const f = await saveForm(partner.id, raw, existingId);
    await audit({ actorUserId: session.user.id, actorPartnerId: partner.id, action: existingId ? "form.update" : "form.create", targetType: "form", targetId: f.id, meta: { version: f.version } });
    revalidatePath("/partner/forms"); revalidatePath(`/partner/forms/${f.id}`); revalidatePath("/app/apply");
    return { id: f.id, slug: f.slug, version: f.version };
  });
}
export async function setFormStatus(id: string, status: "draft" | "live" | "archived"): Promise<R> {
  return wrap(async () => {
    const { partner } = await manager();
    await db.update(t.forms).set({ status }).where(and(eq(t.forms.id, id), eq(t.forms.partnerId, partner.id)));
    revalidatePath(`/partner/forms/${id}`); revalidatePath("/partner/forms"); revalidatePath("/app/apply");
    return undefined;
  });
}
/** Console "Test" button: a real share session against this form, returning to the console. */
export async function createTestSession(formId: string): Promise<R<{ share_url: string }>> {
  return wrap(async () => {
    const { partner } = await requirePartnerMember();
    const form = await db.query.forms.findFirst({ where: and(eq(t.forms.id, formId), eq(t.forms.partnerId, partner.id)) });
    if (!form) throw new ApiError(404, "FORM_NOT_FOUND");
    const token = randomToken(32);
    await db.insert(t.shareSessions).values({ partnerId: partner.id, formId: form.id, token, returnUrl: `${process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3300"}/partner/forms/${form.id}?test=returned`, state: `console-test:${Date.now()}`, env: "sandbox", expiresAt: new Date(Date.now() + SESSION_TTL_MS) });
    return { share_url: `${process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3300"}/share/${token}` };
  });
}

// ---------- API keys ----------
export async function createApiKey(raw: { env: "sandbox" | "live"; label?: string }): Promise<R<{ key: string; prefix: string; id: string }>> {
  return wrap(async () => {
    const { partner, session } = await manager();
    const env = z.enum(["sandbox", "live"]).parse(raw.env);
    if (env === "live" && partner.status !== "verified") throw new ApiError(403, "PARTNER_NOT_VERIFIED", "Live keys unlock once Praman verifies your organisation");
    const key = `pk_${env}_${randomToken(24).replace(/[^a-zA-Z0-9]/g, "").slice(0, 28)}`;
    const [row] = await db.insert(t.partnerApiKeys).values({ partnerId: partner.id, env, keyHash: sha256(key), prefix: key.slice(0, 14), label: raw.label?.slice(0, 60) || null }).returning({ id: t.partnerApiKeys.id });
    await audit({ actorUserId: session.user.id, actorPartnerId: partner.id, action: "apikey.create", targetType: "partner_api_key", targetId: row!.id, meta: { env } });
    revalidatePath("/partner/developers");
    return { key, prefix: key.slice(0, 14), id: row!.id };
  });
}
export async function revokeApiKey(id: string): Promise<R> {
  return wrap(async () => {
    const { partner, session } = await manager();
    await db.update(t.partnerApiKeys).set({ revokedAt: new Date() }).where(and(eq(t.partnerApiKeys.id, id), eq(t.partnerApiKeys.partnerId, partner.id)));
    await audit({ actorUserId: session.user.id, actorPartnerId: partner.id, action: "apikey.revoke", targetType: "partner_api_key", targetId: id });
    revalidatePath("/partner/developers"); return undefined;
  });
}

// ---------- webhooks ----------
const EVENTS = ["share.completed", "consent.revoked", "verification.updated", "application.withdrawn"] as const;
export async function createWebhook(raw: { url: string; events?: string[] }): Promise<R<{ id: string; secret: string }>> {
  return wrap(async () => {
    const { partner, session } = await manager();
    const i = z.object({ url: z.url(), events: z.array(z.enum(EVENTS)).min(1).default([...EVENTS]) }).parse(raw);
    const secret = `whsec_${randomToken(24).replace(/[^a-zA-Z0-9]/g, "").slice(0, 32)}`;
    const [row] = await db.insert(t.partnerWebhooks).values({ partnerId: partner.id, url: i.url, events: i.events, secretEnc: encrypt(systemDek(), secret, `webhook:${partner.id}`) }).returning({ id: t.partnerWebhooks.id });
    await audit({ actorUserId: session.user.id, actorPartnerId: partner.id, action: "webhook.create", targetType: "partner_webhook", targetId: row!.id, meta: { url: i.url } });
    revalidatePath("/partner/developers");
    return { id: row!.id, secret };
  });
}
export async function updateWebhook(id: string, raw: { active?: boolean; events?: string[]; url?: string }): Promise<R> {
  return wrap(async () => {
    const { partner } = await manager();
    const i = z.object({ active: z.boolean().optional(), events: z.array(z.enum(EVENTS)).min(1).optional(), url: z.url().optional() }).parse(raw);
    await db.update(t.partnerWebhooks).set(i).where(and(eq(t.partnerWebhooks.id, id), eq(t.partnerWebhooks.partnerId, partner.id)));
    revalidatePath("/partner/developers"); return undefined;
  });
}
export async function deleteWebhook(id: string): Promise<R> {
  return wrap(async () => {
    const { partner, session } = await manager();
    await db.delete(t.partnerWebhooks).where(and(eq(t.partnerWebhooks.id, id), eq(t.partnerWebhooks.partnerId, partner.id)));
    await audit({ actorUserId: session.user.id, actorPartnerId: partner.id, action: "webhook.delete", targetType: "partner_webhook", targetId: id });
    revalidatePath("/partner/developers"); return undefined;
  });
}
export async function testWebhook(id?: string): Promise<R<{ deliveries: number }>> {
  return wrap(async () => {
    const { partner } = await requirePartnerMember();
    const ids = await queueWebhook(partner.id, "test.ping", { partner_id: partner.id, message: "Hello from the Praman console" }, undefined, { webhookId: id });
    if (!ids.length) throw new ApiError(404, "NO_WEBHOOKS", "Add an endpoint first");
    await flushDeliveries(ids);
    revalidatePath("/partner/developers");
    return { deliveries: ids.length };
  });
}

// ---------- team ----------
export async function addMember(raw: { phone: string; role: "admin" | "developer" | "reviewer" }): Promise<R<{ name: string }>> {
  return wrap(async () => {
    const { partner, session } = await manager();
    const i = z.object({ phone: z.string().regex(/^[6-9]\d{9}$/, "10-digit mobile"), role: z.enum(["admin", "developer", "reviewer"]) }).parse(raw);
    const u = await db.query.user.findFirst({ where: eq(t.user.phoneNumber, `+91${i.phone}`) });
    if (!u) throw new ApiError(404, "USER_NOT_FOUND", "Ask them to sign up at Praman with this number first", { phone: "No Praman account" });
    await db.insert(t.partnerMembers).values({ partnerId: partner.id, userId: u.id, role: i.role }).onConflictDoUpdate({ target: [t.partnerMembers.partnerId, t.partnerMembers.userId], set: { role: i.role } });
    await audit({ actorUserId: session.user.id, actorPartnerId: partner.id, action: "member.add", targetType: "user", targetId: u.id, meta: { role: i.role } });
    revalidatePath("/partner/team");
    return { name: u.name };
  });
}
export async function removeMember(userId: string): Promise<R> {
  return wrap(async () => {
    const { partner, session } = await manager();
    if (userId === session.user.id) throw new ApiError(409, "CANNOT_REMOVE_SELF", "Transfer ownership before leaving");
    await db.delete(t.partnerMembers).where(and(eq(t.partnerMembers.partnerId, partner.id), eq(t.partnerMembers.userId, userId)));
    await audit({ actorUserId: session.user.id, actorPartnerId: partner.id, action: "member.remove", targetType: "user", targetId: userId });
    revalidatePath("/partner/team"); return undefined;
  });
}

// ---------- settings ----------
export async function updateSettings(raw: unknown): Promise<R> {
  return wrap(async () => {
    const { partner, session } = await manager();
    const i = z.object({ name: z.string().trim().min(3).max(120), website: z.url().optional().or(z.literal("")), dpoEmail: z.email(), retentionDays: z.coerce.number().int().min(1).max(3650), logoUrl: z.url().optional().or(z.literal("")) }).parse(raw);
    await db.update(t.partners).set({ name: i.name, website: i.website || null, dpoEmail: i.dpoEmail, retentionDays: i.retentionDays, logoUrl: i.logoUrl || null }).where(eq(t.partners.id, partner.id));
    await audit({ actorUserId: session.user.id, actorPartnerId: partner.id, action: "partner.update", targetType: "partner", targetId: partner.id });
    revalidatePath("/partner"); revalidatePath("/partner/settings"); return undefined;
  });
}

// ---------- applicants ----------
export async function pushStatusAction(applicationId: string, raw: { status: string; note?: string; externalRef?: string }): Promise<R<{ status: string }>> {
  return wrap(async () => {
    const { partner, session, role } = await requirePartnerMember();
    if (role === "developer") throw new ApiError(403, "FORBIDDEN", "Reviewers, admins and owners can push statuses");
    const i = z.object({ status: z.enum(APPLICATION_STATUSES), note: z.string().max(1000).optional(), externalRef: z.string().max(120).optional() }).parse(raw);
    const r = await pushApplicationStatus(partner.id, applicationId, { status: i.status, note: i.note || null, externalRef: i.externalRef || null }, `${partner.id}:console:${randomUUID()}`, session.user.id);
    revalidatePath("/partner/applicants"); revalidatePath(`/app/applications/${applicationId}`);
    return { status: r.status };
  });
}
export async function requestVerificationAction(applicationId: string, factKeys: string[], reason?: string): Promise<R<{ id: string }>> {
  return wrap(async () => {
    const { partner, session } = await requirePartnerMember();
    const keys = factKeys.filter(isFactKey);
    if (!keys.length) throw new ApiError(422, "VALIDATION", "Pick at least one field");
    const r = await createVerificationRequest(partner.id, { applicationId, factKeys: keys, reason: reason || null }, session.user.id);
    revalidatePath("/partner/applicants");
    return { id: r.id };
  });
}
/** Decrypted payload for the applicant drawer — partner members only, application must be theirs. */
export async function getApplicantPayload(applicationId: string): Promise<R<{ payload: PramanPayload; exchanged_at: string | null; consent_status: "active" | "revoked" | "expired" }>> {
  return wrap(async () => {
    const { partner, session } = await requirePartnerMember();
    await partnerApplication(partner.id, applicationId);
    const share = await db.query.shares.findFirst({ where: eq(t.shares.applicationId, applicationId) });
    if (!share) throw new ApiError(404, "NO_SHARE", "This application has no Praman payload");
    const consent = (await db.query.consents.findFirst({ where: eq(t.consents.id, share.consentId) }))!;
    const payload = decodeJws<PramanPayload>(decryptString(systemDek(), share.payloadEnc, `share:${share.id}`));
    await audit({ actorUserId: session.user.id, actorPartnerId: partner.id, action: "share.view", targetType: "share", targetId: share.id });
    return { payload, exchanged_at: share.exchangedAt?.toISOString() ?? null, consent_status: consent.revokedAt ? "revoked" : consent.expiresAt.getTime() < Date.now() ? "expired" : "active" };
  });
}
