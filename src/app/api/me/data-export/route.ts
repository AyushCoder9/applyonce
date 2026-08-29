import { desc, eq } from "drizzle-orm";
import { getDatabase } from "@/db";
import { consents, dataExportRequests, partnerConsents, applicationEvents } from "@/db/schema";
import { ensureActorProfile, getActor } from "@/lib/auth";
import { getProfileSnapshot } from "@/lib/application-service";

export async function POST() {
  const actor = await getActor();
  if (!actor) return Response.json({ error: "Authentication required" }, { status: 401 });

  const profile = await ensureActorProfile(actor);
  const db = getDatabase();
  const [request] = await db.insert(dataExportRequests).values({ profileId: profile.id }).returning();
  const snapshot = await getProfileSnapshot(profile.id);
  const regularConsents = await db.select().from(consents).where(eq(consents.profileId, profile.id)).orderBy(desc(consents.approvedAt));
  const hostedConsents = await db.select().from(partnerConsents).where(eq(partnerConsents.profileId, profile.id)).orderBy(desc(partnerConsents.approvedAt));

  const [completed] = request
    ? await db.update(dataExportRequests).set({ status: "completed", completedAt: new Date() }).where(eq(dataExportRequests.id, request.id)).returning()
    : [];
  await db.insert(applicationEvents).values({
    profileId: profile.id,
    eventType: "data_export_completed",
    title: "Profile export prepared",
    description: "A portable copy of your ApplyOnce profile and consent history was prepared.",
    metadata: { requestId: request?.id ?? null },
  });

  return Response.json({
    request: completed ?? request,
    export: {
      exportedAt: new Date().toISOString(),
      profile: snapshot?.profile ?? profile,
      claims: snapshot?.claims ?? [],
      documents: (snapshot?.documents ?? []).map((document) => Object.fromEntries(Object.entries(document).filter(([key]) => key !== "storageKey" && key !== "checksum"))),
      applications: snapshot?.applications ?? [],
      consentHistory: [...regularConsents, ...hostedConsents],
    },
  });
}
