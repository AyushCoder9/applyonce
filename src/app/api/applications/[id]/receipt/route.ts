import { and, desc, eq } from "drizzle-orm";
import { getDatabase } from "@/db";
import { consents } from "@/db/schema";
import { ensureActorProfile, getActor } from "@/lib/auth";
import { getApplication } from "@/lib/application-service";

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

  return Response.json({
    receipt: {
      receiptCode: application.application.receiptCode,
      externalApplicationId: application.application.externalApplicationId,
      submittedAt: application.application.submittedAt,
      applicationName: application.template.name,
      portal: application.template.externalPortalName,
      consentHash: consent?.consentHash ?? null,
      scope: consent?.scope ?? [],
    },
  });
}
