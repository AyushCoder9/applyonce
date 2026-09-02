import { z } from "zod";
import { db, t, eq, desc } from "@praman/db";
import { APPLICATION_STATUSES } from "@praman/schema";
import { handler, citizen, body, ok, log } from "@/lib/api";
import { APP_KINDS } from "@/components/partner/forms";
import { serializeApp } from "@/components/applications/model";

/** GET /api/v1/applications?profile= — tracker for the active profile. */
export const GET = handler(async (req) => {
  const { profile } = await citizen(req);
  const rows = await db.select().from(t.applications).where(eq(t.applications.profileId, profile.id)).orderBy(desc(t.applications.updatedAt));
  return ok(rows.map(serializeApp));
});

const create = z.object({
  title: z.string().trim().min(2).max(160), org_name: z.string().trim().min(2).max(160), kind: z.enum(APP_KINDS).default("other"),
  status: z.enum(APPLICATION_STATUSES).default("draft"), source: z.enum(["manual", "extension"]).default("manual"),
  external_ref: z.string().max(120).optional().nullable(), portal_url: z.url().optional().nullable(), deadline_at: z.iso.date().or(z.iso.datetime({ offset: true })).optional().nullable(), note: z.string().max(500).optional(),
});

/** POST /api/v1/applications — track an application made outside Praman (manual or extension). */
export const POST = handler(async (req) => {
  const b = await body(req, create);
  const { session, profile } = await citizen(req);
  const [a] = await db.insert(t.applications).values({ profileId: profile.id, title: b.title, orgName: b.org_name, kind: b.kind, status: b.status, source: b.source, externalRef: b.external_ref ?? null, portalUrl: b.portal_url ?? null, deadlineAt: b.deadline_at ? new Date(b.deadline_at) : null, submittedAt: b.status === "draft" ? null : new Date() }).returning();
  await db.insert(t.applicationEvents).values({ applicationId: a!.id, type: "created", title: b.source === "extension" ? "Filled with the Praman extension" : "Added to tracker", body: b.note ?? (b.external_ref ? `Reference ${b.external_ref}` : null), actor: "citizen" });
  await log(session, "application.create", "application", a!.id, { source: b.source });
  return ok(serializeApp(a!), { status: 201 });
});
