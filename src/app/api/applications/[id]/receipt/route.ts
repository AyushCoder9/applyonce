import { and, desc, eq } from "drizzle-orm";
import { getDatabase } from "@/db";
import { applicationSnapshots, consents } from "@/db/schema";
import { ensureActorProfile, getActor } from "@/lib/auth";
import { getApplication } from "@/lib/application-service";
import { applicationReceiptSchema } from "@/lib/contracts/application";

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
  if (application.application.status !== "submitted" || !application.application.receiptCode) {
    return Response.json({ error: "A receipt is available after submission" }, { status: 409 });
  }

  const [consent] = await getDatabase()
    .select()
    .from(consents)
    .where(and(eq(consents.applicationId, id), eq(consents.profileId, profile.id)))
    .orderBy(desc(consents.approvedAt))
    .limit(1);
  const [snapshot] = await getDatabase()
    .select({ payloadHash: applicationSnapshots.payloadHash, version: applicationSnapshots.version })
    .from(applicationSnapshots)
    .where(and(eq(applicationSnapshots.applicationId, id), eq(applicationSnapshots.profileId, profile.id)))
    .limit(1);

  const receipt = applicationReceiptSchema.parse({
      receiptCode: application.application.receiptCode,
      applicationReference: application.application.externalApplicationId,
      submittedAt: application.application.submittedAt,
      applicationName: application.template.name,
      intendedDestination: application.template.externalPortalName,
      submissionChannel: "applyonce_hosted",
      externalReceiptConfirmed: false,
      snapshotHash: snapshot?.payloadHash ?? null,
      snapshotVersion: snapshot?.version ?? null,
      consentHash: consent?.consentHash ?? null,
      scope: consent?.scope ?? [],
  });
  return Response.json({ receipt });
}
