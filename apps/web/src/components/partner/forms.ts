/** Form definition validation + save, shared by `POST /api/v1/partner/forms` and the console builder. */
import { z } from "zod";
import { db, t, and, eq, ne } from "@applyonce/db";
import { PURPOSES, isFactKey, scopeForPurpose, field } from "@applyonce/schema";
import { ApiError } from "@/lib/api";

export const APP_KINDS = ["exam", "admission", "scholarship", "job", "kyc", "healthcare", "scheme", "other"] as const;

export const formInput = z.object({
  name: z.string().trim().min(3).max(120),
  slug: z.string().trim().regex(/^[a-z0-9][a-z0-9-]{2,60}$/, "lowercase letters, digits and dashes").optional(),
  description: z.string().max(500).optional().nullable(),
  purpose: z.enum(PURPOSES),
  kind: z.enum(APP_KINDS).default("other"),
  requested_fields: z.array(z.object({ key: z.string(), required: z.boolean().default(true) })).min(1).max(120),
  custom_fields: z.array(z.object({ id: z.string().regex(/^[a-z0-9_]{1,40}$/), label: z.string().min(1).max(120), type: z.enum(["string", "number", "bool", "enum", "date", "file"]), required: z.boolean().optional(), options: z.array(z.string().min(1)).max(50).optional() })).max(30).default([]),
  retention_days: z.number().int().min(1).max(3650).default(365),
  redirect_url: z.url(),
  webhook_url: z.url().optional().nullable(),
  deadline_at: z.iso.datetime({ offset: true }).optional().nullable().or(z.iso.date().optional().nullable()),
  status: z.enum(["draft", "live", "archived"]).default("live"),
});
export type FormInput = z.infer<typeof formInput>;

export const slugify = (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 60);

/** Reject unknown keys and keys the purpose can’t share, listing them so the partner can fix the form. */
export function checkRequestedKeys(input: Pick<FormInput, "purpose" | "requested_fields">) {
  const keys = [...new Set(input.requested_fields.map((f) => f.key))];
  const unknown = keys.filter((k) => !isFactKey(k));
  if (unknown.length) throw new ApiError(422, "UNKNOWN_FACT_KEY", `Unknown fact keys: ${unknown.join(", ")}`, Object.fromEntries(unknown.map((k) => [k, "Unknown fact_key"])));
  const system = keys.filter((k) => field(k).system);
  const { blocked } = scopeForPurpose(keys, input.purpose);
  const bad = [...new Set([...system, ...blocked])];
  if (bad.length) throw new ApiError(422, "FIELDS_BLOCKED_FOR_PURPOSE", `These fields cannot be requested for purpose "${input.purpose}": ${bad.join(", ")}`, Object.fromEntries(bad.map((k) => [k, "Not shareable for this purpose"])));
  const seen = new Set<string>();
  return input.requested_fields.filter((f) => (seen.has(f.key) ? false : (seen.add(f.key), true)));
}

/** Create, or update with a version bump. */
export async function saveForm(partnerId: string, raw: unknown, existingId?: string) {
  const input = formInput.parse(raw);
  const requestedFields = checkRequestedKeys(input);
  let slug = input.slug ?? slugify(input.name);
  const taken = await db.query.forms.findFirst({ where: existingId ? and(eq(t.forms.slug, slug), ne(t.forms.id, existingId)) : eq(t.forms.slug, slug) });
  if (taken) { if (input.slug) throw new ApiError(409, "SLUG_TAKEN", `Slug "${slug}" is already used`, { slug: "Already used" }); slug = `${slug}-${Math.random().toString(36).slice(2, 6)}`; }
  const values = { partnerId, slug, name: input.name, description: input.description ?? null, purpose: input.purpose, kind: input.kind, requestedFields, customFields: input.custom_fields, retentionDays: input.retention_days, redirectUrl: input.redirect_url, webhookUrl: input.webhook_url ?? null, deadlineAt: input.deadline_at ? new Date(input.deadline_at) : null, status: input.status };
  if (existingId) {
    const cur = await db.query.forms.findFirst({ where: and(eq(t.forms.id, existingId), eq(t.forms.partnerId, partnerId)) });
    if (!cur) throw new ApiError(404, "FORM_NOT_FOUND");
    const [row] = await db.update(t.forms).set({ ...values, version: cur.version + 1 }).where(eq(t.forms.id, existingId)).returning();
    return row!;
  }
  const [row] = await db.insert(t.forms).values(values).returning();
  return row!;
}

export const publicForm = (f: typeof t.forms.$inferSelect) => ({ id: f.id, slug: f.slug, name: f.name, description: f.description, purpose: f.purpose, kind: f.kind, requested_fields: f.requestedFields, custom_fields: f.customFields, retention_days: f.retentionDays, redirect_url: f.redirectUrl, webhook_url: f.webhookUrl, deadline_at: f.deadlineAt?.toISOString() ?? null, status: f.status, version: f.version, created_at: f.createdAt.toISOString() });
