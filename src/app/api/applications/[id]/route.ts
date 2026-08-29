import { and, eq } from "drizzle-orm";
import { z } from "zod";
import { ensureActorProfile, getActor } from "@/lib/auth";
import { getApplication } from "@/lib/application-service";
import { applicationEvents, applicationFields, applications } from "@/db/schema";
import { getDatabase } from "@/db";

const confirmFieldSchema = z.object({
  requirementKey: z.string().min(1).max(120),
  valueText: z.string().min(1).max(1000),
});

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const actor = await getActor();
  if (!actor) {
    return Response.json({ error: "Authentication required" }, { status: 401 });
  }

  const { id } = await params;
  const profile = await ensureActorProfile(actor);
  const application = await getApplication(id, profile.id);

  if (!application) {
    return Response.json({ error: "Application not found" }, { status: 404 });
  }

  return Response.json({ application });
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const actor = await getActor();
  if (!actor) {
    return Response.json({ error: "Authentication required" }, { status: 401 });
  }

  const { id } = await params;
  const parsed = confirmFieldSchema.safeParse(await request.json());
  if (!parsed.success) {
    return Response.json({ error: "A field key and value are required" }, { status: 400 });
  }

  const profile = await ensureActorProfile(actor);
  const db = getDatabase();
  const [ownedApplication] = await db
    .select({ id: applications.id })
    .from(applications)
    .where(and(eq(applications.id, id), eq(applications.profileId, profile.id)))
    .limit(1);

  if (!ownedApplication) {
    return Response.json({ error: "Application not found" }, { status: 404 });
  }

  const [field] = await db
    .update(applicationFields)
    .set({
      valueText: parsed.data.valueText,
      state: "confirmed",
      sourceLabel: "You confirmed",
      confidence: 100,
      userConfirmedAt: new Date(),
      updatedAt: new Date(),
    })
    .where(
      and(
        eq(applicationFields.applicationId, id),
        eq(applicationFields.requirementKey, parsed.data.requirementKey),
      ),
    )
    .returning();

  if (!field) {
    return Response.json({ error: "Application field not found" }, { status: 404 });
  }

  const allFields = await db
    .select({ state: applicationFields.state })
    .from(applicationFields)
    .where(eq(applicationFields.applicationId, id));
  const unresolvedCount = allFields.filter(
    (applicationField) =>
      applicationField.state === "missing" || applicationField.state === "needs_confirmation",
  ).length;
  const readyFieldCount = allFields.length - unresolvedCount;
  await db
    .update(applications)
    .set({
      status: unresolvedCount > 0 ? "needs_action" : "ready",
      readyFieldCount,
      updatedAt: new Date(),
    })
    .where(eq(applications.id, id));
  await db.insert(applicationEvents).values({
    profileId: profile.id,
    applicationId: id,
    eventType: "field_confirmed",
    title: "A field was confirmed",
    description: `${field.label} is now approved for this application packet.`,
    metadata: { requirementKey: field.requirementKey },
  });

  const refreshed = await getApplication(id, profile.id);
  return Response.json({ application: refreshed });
}
