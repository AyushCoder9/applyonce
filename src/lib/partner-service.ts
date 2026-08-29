import { and, desc, eq, isNull, sql } from "drizzle-orm";
import { createCipheriv, createHash, createHmac, createDecipheriv, randomBytes } from "node:crypto";
import { getDatabase } from "@/db";
import {
  applicationEvents,
  organizationMembers,
  organizations,
  partnerConsents,
  partnerApiKeys,
  partnerForms,
  partnerSubmissions,
  partnerWebhooks,
  partnerWebhookDeliveries,
} from "@/db/schema";
import { createReceiptCode } from "@/lib/intelligence";
import { getActor, type Actor } from "@/lib/auth";
import { queueInAppNotification } from "@/lib/notifications";

export type PartnerFormField = {
  key: string;
  label: string;
  type: string;
  required: boolean;
  profileKey?: string;
  helpText?: string;
};

export type PartnerFormSchema = {
  fields: PartnerFormField[];
  documents: Array<{ key: string; label: string; required: boolean }>;
};

function slugify(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 70);
}

export function hashSecret(secret: string) {
  return createHash("sha256").update(secret).digest("hex");
}

export function createPartnerSecret(prefix: string) {
  return `${prefix}_${randomBytes(18).toString("base64url")}`;
}

export function hasPartnerRole(role: string, allowed: readonly string[]) {
  return allowed.includes(role);
}

export type PartnerRequestContext = {
  organization: typeof organizations.$inferSelect;
  membership: { role: string; clerkUserId?: string };
  apiKey: boolean;
};

export async function getPartnerRequestContext(request: Request, requiredScope?: string): Promise<PartnerRequestContext | null> {
  const authorization = request.headers.get("authorization");
  if (authorization) {
    const token = authorization.startsWith("Bearer ") ? authorization.slice(7).trim() : "";
    if (!token || token.length > 240) return null;
    const [row] = await getDatabase()
      .select({ key: partnerApiKeys, organization: organizations })
      .from(partnerApiKeys)
      .innerJoin(organizations, eq(partnerApiKeys.organizationId, organizations.id))
      .where(and(eq(partnerApiKeys.keyHash, hashSecret(token)), isNull(partnerApiKeys.revokedAt)))
      .limit(1);
    if (!row) return null;
    if (row.key.expiresAt && row.key.expiresAt.getTime() <= Date.now()) return null;
    if (requiredScope && !row.key.scopes.includes("*") && !row.key.scopes.includes(requiredScope)) return null;
    await getDatabase().update(partnerApiKeys).set({ lastUsedAt: new Date() }).where(eq(partnerApiKeys.id, row.key.id));
    return { organization: row.organization, membership: { role: "developer", clerkUserId: row.key.createdByClerkUserId }, apiKey: true };
  }

  const actor = await getActor();
  if (!actor) return null;
  const context = await ensurePartnerOrganization(actor);
  return { organization: context.organization, membership: context.membership, apiKey: false };
}

export async function createPartnerApiKey(input: {
  organizationId: string;
  createdByClerkUserId: string;
  name: string;
  scopes: string[];
}) {
  const secret = createPartnerSecret("ao_live");
  const [key] = await getDatabase().insert(partnerApiKeys).values({
    organizationId: input.organizationId,
    name: input.name,
    keyPrefix: secret.slice(0, 16),
    keyHash: hashSecret(secret),
    scopes: input.scopes,
    createdByClerkUserId: input.createdByClerkUserId,
  }).returning();
  return key ? { key, secret } : null;
}

export async function listPartnerApiKeys(organizationId: string) {
  return getDatabase().select({ id: partnerApiKeys.id, name: partnerApiKeys.name, keyPrefix: partnerApiKeys.keyPrefix, scopes: partnerApiKeys.scopes, lastUsedAt: partnerApiKeys.lastUsedAt, expiresAt: partnerApiKeys.expiresAt, revokedAt: partnerApiKeys.revokedAt, createdAt: partnerApiKeys.createdAt }).from(partnerApiKeys).where(eq(partnerApiKeys.organizationId, organizationId)).orderBy(desc(partnerApiKeys.createdAt));
}

export async function revokePartnerApiKey(id: string, organizationId: string) {
  const [key] = await getDatabase().update(partnerApiKeys).set({ revokedAt: new Date() }).where(and(eq(partnerApiKeys.id, id), eq(partnerApiKeys.organizationId, organizationId), isNull(partnerApiKeys.revokedAt))).returning({ id: partnerApiKeys.id });
  return key ?? null;
}

function createPartnerConsentHash(input: {
  formId: string;
  submissionId: string;
  profileId?: string;
  purpose: string;
  scope: string[];
  version: string;
}) {
  return createHash("sha256").update(JSON.stringify(input)).digest("hex");
}

function webhookKey() {
  const source = process.env.WEBHOOK_ENCRYPTION_KEY ?? process.env.CLERK_SECRET_KEY;
  if (!source) throw new Error("WEBHOOK_ENCRYPTION_KEY is required to protect webhook secrets");
  return createHash("sha256").update(source).digest();
}

function encryptWebhookSecret(secret: string) {
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", webhookKey(), iv);
  const encrypted = Buffer.concat([cipher.update(secret, "utf8"), cipher.final()]);
  return `${iv.toString("base64url")}.${cipher.getAuthTag().toString("base64url")}.${encrypted.toString("base64url")}`;
}

function decryptWebhookSecret(ciphertext: string) {
  const [ivEncoded, tagEncoded, dataEncoded] = ciphertext.split(".");
  if (!ivEncoded || !tagEncoded || !dataEncoded) throw new Error("Invalid webhook secret");
  const decipher = createDecipheriv("aes-256-gcm", webhookKey(), Buffer.from(ivEncoded, "base64url"));
  decipher.setAuthTag(Buffer.from(tagEncoded, "base64url"));
  return Buffer.concat([decipher.update(Buffer.from(dataEncoded, "base64url")), decipher.final()]).toString("utf8");
}

function webhookPayload(input: { eventType: string; deliveryId: string; payload: Record<string, unknown> }) {
  return JSON.stringify({
    id: input.deliveryId,
    type: input.eventType,
    createdAt: new Date().toISOString(),
    data: input.payload,
  });
}

function isWebhookEventSubscribed(events: string[], eventType: string) {
  return events.includes("*") || events.includes(eventType);
}

function assertWebhookUrl(value: string) {
  const parsed = new URL(value);
  const hostname = parsed.hostname.toLowerCase();
  const blockedHostnames = new Set(["localhost", "127.0.0.1", "0.0.0.0", "::1"]);
  const blockedPrivateRange = /^(10\.|192\.168\.|172\.(1[6-9]|2\d|3[0-1])\.|169\.254\.)/;
  if (parsed.protocol !== "https:" && process.env.NODE_ENV !== "development") {
    throw new Error("Webhook endpoints must use HTTPS");
  }
  if (blockedHostnames.has(hostname) || hostname.endsWith(".local") || blockedPrivateRange.test(hostname)) {
    throw new Error("Webhook endpoints cannot point to a private network");
  }
  return parsed.toString();
}

async function enqueuePartnerWebhookDeliveries(input: {
  organizationId: string;
  eventType: string;
  payload: Record<string, unknown>;
}) {
  const db = getDatabase();
  const endpoints = await db
    .select()
    .from(partnerWebhooks)
    .where(and(eq(partnerWebhooks.organizationId, input.organizationId), eq(partnerWebhooks.active, true)));
  for (const endpoint of endpoints) {
    if (!isWebhookEventSubscribed(endpoint.events, input.eventType)) continue;
    await db.insert(partnerWebhookDeliveries).values({
      webhookId: endpoint.id,
      eventType: input.eventType,
      payload: input.payload,
    });
  }
}

export async function processPartnerWebhookDeliveries(organizationId: string, limit = 20) {
  const db = getDatabase();
  const rows = await db
    .select({ delivery: partnerWebhookDeliveries, webhook: partnerWebhooks })
    .from(partnerWebhookDeliveries)
    .innerJoin(partnerWebhooks, eq(partnerWebhookDeliveries.webhookId, partnerWebhooks.id))
    .where(and(eq(partnerWebhooks.organizationId, organizationId), eq(partnerWebhooks.active, true)))
    .orderBy(partnerWebhookDeliveries.createdAt)
    .limit(limit);
  const pending = rows.filter(({ delivery }) => delivery.status !== "delivered" && delivery.attempts < 5);
  let delivered = 0;
  let failed = 0;
  for (const { delivery, webhook } of pending) {
    const attempts = delivery.attempts + 1;
    await db.update(partnerWebhookDeliveries).set({ attempts }).where(eq(partnerWebhookDeliveries.id, delivery.id));
    try {
      if (!webhook.secretCiphertext) throw new Error("Webhook signing secret is unavailable");
      const body = webhookPayload({ eventType: delivery.eventType, deliveryId: delivery.id, payload: delivery.payload });
      const timestamp = Math.floor(Date.now() / 1000).toString();
      const signature = createHmac("sha256", decryptWebhookSecret(webhook.secretCiphertext)).update(`${timestamp}.${body}`).digest("hex");
      const response = await fetch(webhook.url, {
        method: "POST",
        headers: {
          "content-type": "application/json",
          "x-applyonce-event": delivery.eventType,
          "x-applyonce-delivery": delivery.id,
          "x-applyonce-timestamp": timestamp,
          "x-applyonce-signature": `t=${timestamp},v1=${signature}`,
        },
        body,
        signal: AbortSignal.timeout(8000),
      });
      if (!response.ok) throw new Error(`Endpoint returned ${response.status}`);
      await db.update(partnerWebhookDeliveries).set({ status: "delivered", statusCode: response.status, deliveredAt: new Date(), lastError: null }).where(eq(partnerWebhookDeliveries.id, delivery.id));
      await db.update(partnerWebhooks).set({ lastDeliveryAt: new Date(), lastError: null, updatedAt: new Date() }).where(eq(partnerWebhooks.id, webhook.id));
      delivered += 1;
    } catch (error) {
      const message = error instanceof Error ? error.message.slice(0, 500) : "Webhook delivery failed";
      await db.update(partnerWebhookDeliveries).set({ status: "failed", lastError: message }).where(eq(partnerWebhookDeliveries.id, delivery.id));
      await db.update(partnerWebhooks).set({ lastError: message, updatedAt: new Date() }).where(eq(partnerWebhooks.id, webhook.id));
      failed += 1;
    }
  }
  return { queued: rows.length, attempted: pending.length, delivered, failed };
}

export async function ensurePartnerOrganization(actor: Actor) {
  const db = getDatabase();
  const [existing] = await db
    .select({ organization: organizations, membership: organizationMembers })
    .from(organizationMembers)
    .innerJoin(organizations, eq(organizationMembers.organizationId, organizations.id))
    .where(eq(organizationMembers.clerkUserId, actor.clerkUserId))
    .limit(1);

  if (existing) {
    return { organization: existing.organization, membership: existing.membership };
  }

  const baseSlug = slugify(actor.fullName || "partner-workspace") || "partner-workspace";
  const slug = `${baseSlug}-${actor.clerkUserId.slice(-8).toLowerCase()}`;
  const created = await db.transaction(async (tx) => {
    const [organization] = await tx
      .insert(organizations)
      .values({
        name: `${actor.fullName || "Partner"} workspace`,
        slug,
        ownerClerkUserId: actor.clerkUserId,
      })
      .returning();

    if (!organization) throw new Error("Unable to create partner workspace");

    const [membership] = await tx
      .insert(organizationMembers)
      .values({
        organizationId: organization.id,
        clerkUserId: actor.clerkUserId,
        email: actor.email,
        role: "owner",
      })
      .returning();

    if (!membership) throw new Error("Unable to create partner membership");
    return { organization, membership };
  });

  return created;
}

export async function listPartnerForms(organizationId: string) {
  return getDatabase()
    .select()
    .from(partnerForms)
    .where(eq(partnerForms.organizationId, organizationId))
    .orderBy(desc(partnerForms.updatedAt));
}

export async function getPartnerForm(formId: string, organizationId: string) {
  const [form] = await getDatabase()
    .select()
    .from(partnerForms)
    .where(and(eq(partnerForms.id, formId), eq(partnerForms.organizationId, organizationId)))
    .limit(1);
  return form ?? null;
}

export async function getPublishedPartnerForm(slug: string) {
  const [form] = await getDatabase()
    .select({ form: partnerForms, organization: organizations })
    .from(partnerForms)
    .innerJoin(organizations, eq(partnerForms.organizationId, organizations.id))
    .where(and(eq(partnerForms.slug, slug), eq(partnerForms.status, "published")))
    .limit(1);
  return form ?? null;
}

export async function createPartnerForm(input: {
  organizationId: string;
  createdByClerkUserId: string;
  name: string;
  description: string;
  category: string;
  purpose: string;
  formSchema?: PartnerFormSchema;
}) {
  const baseSlug = slugify(input.name) || "application-form";
  const slug = `${baseSlug}-${randomBytes(3).toString("hex")}`;
  const [form] = await getDatabase()
    .insert(partnerForms)
    .values({
      organizationId: input.organizationId,
      createdByClerkUserId: input.createdByClerkUserId,
      slug,
      name: input.name,
      description: input.description,
      category: input.category,
      purpose: input.purpose,
      formSchema: input.formSchema ?? { fields: [], documents: [] },
    })
    .returning();
  return form ?? null;
}

export async function updatePartnerForm(input: {
  id: string;
  organizationId: string;
  name?: string;
  description?: string;
  category?: string;
  purpose?: string;
  formSchema?: PartnerFormSchema;
  branding?: { accentColor?: string; logoUrl?: string; organizationName?: string };
}) {
  const [form] = await getDatabase()
    .update(partnerForms)
    .set({
      ...(input.name ? { name: input.name } : {}),
      ...(input.description ? { description: input.description } : {}),
      ...(input.category ? { category: input.category } : {}),
      ...(input.purpose ? { purpose: input.purpose } : {}),
      ...(input.formSchema ? { formSchema: input.formSchema } : {}),
      ...(input.branding ? { branding: input.branding } : {}),
      version: sql`${partnerForms.version} + 1`,
      updatedAt: new Date(),
    })
    .where(and(eq(partnerForms.id, input.id), eq(partnerForms.organizationId, input.organizationId)))
    .returning();
  return form ?? null;
}

export async function publishPartnerForm(formId: string, organizationId: string) {
  const [form] = await getDatabase()
    .update(partnerForms)
    .set({ status: "published", publishedAt: new Date(), updatedAt: new Date() })
    .where(and(eq(partnerForms.id, formId), eq(partnerForms.organizationId, organizationId)))
    .returning();
  return form ?? null;
}

export async function listPartnerSubmissions(organizationId: string) {
  return getDatabase()
    .select({ submission: partnerSubmissions, form: partnerForms })
    .from(partnerSubmissions)
    .innerJoin(partnerForms, eq(partnerSubmissions.formId, partnerForms.id))
    .where(eq(partnerForms.organizationId, organizationId))
    .orderBy(desc(partnerSubmissions.updatedAt));
}

export async function updatePartnerSubmissionStatus(input: {
  id: string;
  organizationId: string;
  status: "received" | "under_review" | "needs_documents" | "accepted" | "rejected" | "completed";
}) {
  const db = getDatabase();
  const [ownedSubmission] = await db
    .select({ submission: partnerSubmissions, form: partnerForms })
    .from(partnerSubmissions)
    .innerJoin(partnerForms, eq(partnerSubmissions.formId, partnerForms.id))
    .where(and(eq(partnerSubmissions.id, input.id), eq(partnerForms.organizationId, input.organizationId)))
    .limit(1);
  if (!ownedSubmission) return null;

  const [submission] = await db
    .update(partnerSubmissions)
    .set({ status: input.status, updatedAt: new Date() })
    .where(eq(partnerSubmissions.id, input.id))
    .returning();
  if (!submission) return null;

  if (submission.profileId) {
    const title = input.status === "needs_documents"
      ? "A partner requested another document"
      : `Application status: ${input.status.replaceAll("_", " ")}`;
    const description = input.status === "needs_documents"
      ? `${ownedSubmission.form.name} needs one more document before the review can continue.`
      : `${ownedSubmission.form.name} moved to ${input.status.replaceAll("_", " ")}.`;
    await db.insert(applicationEvents).values({
      profileId: submission.profileId,
      eventType: "partner_application_status_changed",
      title,
      description,
      metadata: {
        submissionId: submission.id,
        formId: submission.formId,
        receiptCode: submission.receiptCode,
        status: input.status,
      },
    });
    await queueInAppNotification({
      profileId: submission.profileId,
      type: "partner_application_status_changed",
      subject: title,
      body: description,
    });
  }

  await enqueuePartnerWebhookDeliveries({
    organizationId: input.organizationId,
    eventType: "application.status_changed",
    payload: { submissionId: submission.id, formId: submission.formId, receiptCode: submission.receiptCode, status: input.status },
  });

  return submission;
}

export async function createPublicSubmission(input: {
  formId: string;
  profileId?: string;
  applicantName: string;
  applicantEmail: string;
  data: Record<string, string>;
  documentIds: string[];
  idempotencyKey?: string;
  purpose: string;
  scope: string[];
  consentMethod: "otp" | "passkey" | "biometric" | "manual";
  status?: "received" | "needs_documents";
  formName: string;
  organizationName: string;
  organizationId: string;
}) {
  const db = getDatabase();
  if (input.idempotencyKey) {
    const [existing] = await db
      .select()
      .from(partnerSubmissions)
      .where(and(eq(partnerSubmissions.formId, input.formId), eq(partnerSubmissions.idempotencyKey, input.idempotencyKey)))
      .limit(1);
    if (existing) return existing;
  }
  const receiptCode = createReceiptCode("AP");
  const version = "2026-08-30";
  const result = await db.transaction(async (tx) => {
    const insertQuery = tx
      .insert(partnerSubmissions)
      .values({
        formId: input.formId,
        profileId: input.profileId,
        applicantName: input.applicantName,
        applicantEmail: input.applicantEmail,
        data: input.data,
        documentIds: input.documentIds,
        status: input.status ?? "received",
        receiptCode,
        idempotencyKey: input.idempotencyKey,
      });
    const [createdSubmission] = input.idempotencyKey
      ? await insertQuery.onConflictDoNothing({ target: [partnerSubmissions.formId, partnerSubmissions.idempotencyKey] }).returning()
      : await insertQuery.returning();

    if (!createdSubmission && input.idempotencyKey) {
      const [existing] = await tx
        .select()
        .from(partnerSubmissions)
        .where(and(eq(partnerSubmissions.formId, input.formId), eq(partnerSubmissions.idempotencyKey, input.idempotencyKey)))
        .limit(1);
      return existing ? { submission: existing, created: false } : null;
    }
    if (!createdSubmission) return null;

    const consentHash = createPartnerConsentHash({
      formId: input.formId,
      submissionId: createdSubmission.id,
      profileId: input.profileId,
      purpose: input.purpose,
      scope: input.scope,
      version,
    });
    const [consent] = await tx
      .insert(partnerConsents)
      .values({
        formId: input.formId,
        submissionId: createdSubmission.id,
        profileId: input.profileId,
        applicantName: input.applicantName,
        applicantEmail: input.applicantEmail,
        purpose: input.purpose,
        scope: input.scope,
        method: input.consentMethod,
        version,
        consentHash,
      })
      .returning();

    const [linkedSubmission] = await tx
      .update(partnerSubmissions)
      .set({ partnerConsentId: consent?.id, updatedAt: new Date() })
      .where(eq(partnerSubmissions.id, createdSubmission.id))
      .returning();

    return { submission: linkedSubmission ?? createdSubmission, created: true };
  });

  if (!result) return null;
  const submission = result.submission;
  if (!result.created) return submission;

  if (submission.profileId) {
    const description = `${input.formName} was submitted to ${input.organizationName}. Your consent receipt is recorded.`;
    await db.insert(applicationEvents).values({
      profileId: submission.profileId,
      eventType: "partner_application_submitted",
      title: `${input.formName} submitted`,
      description,
      metadata: {
        submissionId: submission.id,
        formId: submission.formId,
        receiptCode: submission.receiptCode,
        organizationName: input.organizationName,
        status: submission.status,
      },
    });
    await queueInAppNotification({
      profileId: submission.profileId,
      type: "partner_application_submitted",
      subject: `${input.formName} submitted`,
      body: description,
    });
  }

  await enqueuePartnerWebhookDeliveries({
    organizationId: input.organizationId,
    eventType: "application.submitted",
    payload: { submissionId: submission.id, formId: submission.formId, receiptCode: submission.receiptCode, status: submission.status },
  });

  return submission;
}

export async function createWebhook(input: {
  organizationId: string;
  url: string;
  events: string[];
}) {
  const safeUrl = assertWebhookUrl(input.url);
  const secret = createPartnerSecret("ao_whsec");
  const [webhook] = await getDatabase()
    .insert(partnerWebhooks)
    .values({ organizationId: input.organizationId, url: safeUrl, events: input.events, secretHash: hashSecret(secret), secretCiphertext: encryptWebhookSecret(secret) })
    .returning();
  return webhook ? { webhook, secret } : null;
}
