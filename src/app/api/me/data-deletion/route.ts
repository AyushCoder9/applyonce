import { and, desc, eq } from "drizzle-orm";
import { z } from "zod";
import { getDatabase } from "@/db";
import { applicationEvents, dataDeletionRequests } from "@/db/schema";
import { ensureActorProfile, getActor } from "@/lib/auth";

const requestSchema = z.object({ reason: z.string().max(500).optional() });

export async function POST(request: Request) {
  const actor = await getActor();
  if (!actor) return Response.json({ error: "Authentication required" }, { status: 401 });
  const parsed = requestSchema.safeParse(await request.json().catch(() => ({})));
  if (!parsed.success) return Response.json({ error: "The deletion request could not be read." }, { status: 400 });

  const profile = await ensureActorProfile(actor);
  const db = getDatabase();
  const [existing] = await db
    .select()
    .from(dataDeletionRequests)
    .where(and(eq(dataDeletionRequests.profileId, profile.id), eq(dataDeletionRequests.status, "requested")))
    .orderBy(desc(dataDeletionRequests.createdAt))
    .limit(1);
  if (existing) return Response.json({ request: existing, alreadyRequested: true });

  const [created] = await db.insert(dataDeletionRequests).values({ profileId: profile.id, reason: parsed.data.reason }).returning();
  if (!created) return Response.json({ error: "The deletion request could not be created." }, { status: 500 });
  await db.insert(applicationEvents).values({
    profileId: profile.id,
    eventType: "data_deletion_requested",
    title: "Data deletion request received",
    description: "Your request is queued for a safety review before any irreversible deletion occurs.",
    metadata: { requestId: created.id },
  });
  return Response.json({ request: created, message: "Your request is queued for review." }, { status: 201 });
}
