import { z } from "zod";
import { db, t, eq } from "@praman/db";
import { handler, citizen, body, ok, ApiError } from "@/lib/api";

/** POST /api/v1/applications/:id/events {title, body?} — a citizen note on the timeline. */
export const POST = handler(async (req, { params }) => {
  const b = await body(req, z.object({ title: z.string().trim().min(1).max(160), body: z.string().max(1000).optional() }));
  const a = await db.query.applications.findFirst({ where: eq(t.applications.id, params.id!) });
  if (!a) throw new ApiError(404, "APPLICATION_NOT_FOUND");
  await citizen(req, { profileId: a.profileId });
  const [e] = await db.insert(t.applicationEvents).values({ applicationId: a.id, type: "note", title: b.title, body: b.body ?? null, actor: "citizen" }).returning();
  await db.update(t.applications).set({ updatedAt: new Date() }).where(eq(t.applications.id, a.id));
  return ok({ id: e!.id, type: e!.type, title: e!.title, body: e!.body, actor: e!.actor, created_at: e!.createdAt.toISOString() }, { status: 201 });
});
