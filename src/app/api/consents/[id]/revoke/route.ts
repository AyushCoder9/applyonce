import { and, eq } from "drizzle-orm";
import { getDatabase } from "@/db";
import { applicationEvents, consents, partnerConsents } from "@/db/schema";
import { ensureActorProfile, getActor } from "@/lib/auth";

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const actor = await getActor();
  if (!actor) return Response.json({ error: "Authentication required" }, { status: 401 });

  const profile = await ensureActorProfile(actor);
  const id = (await params).id;
  const db = getDatabase();
  const revokedAt = new Date();
  const [applicationConsent] = await db
    .update(consents)
    .set({ revokedAt })
    .where(and(eq(consents.id, id), eq(consents.profileId, profile.id)))
    .returning({ id: consents.id, applicationId: consents.applicationId });

  if (applicationConsent) {
    await db.insert(applicationEvents).values({
      profileId: profile.id,
      applicationId: applicationConsent.applicationId,
      eventType: "consent_revoked",
      title: "Application consent revoked",
      description: "Future access to this application sharing scope is now blocked.",
    });
    return Response.json({ revoked: true, consentId: id, revokedAt });
  }

  const [partnerConsent] = await db
    .update(partnerConsents)
    .set({ revokedAt })
    .where(and(eq(partnerConsents.id, id), eq(partnerConsents.profileId, profile.id)))
    .returning({ id: partnerConsents.id, formId: partnerConsents.formId, submissionId: partnerConsents.submissionId });

  if (!partnerConsent) return Response.json({ error: "Consent not found" }, { status: 404 });
  await db.insert(applicationEvents).values({
    profileId: profile.id,
    eventType: "partner_consent_revoked",
    title: "Partner consent revoked",
    description: "Future access to this hosted application sharing scope is now blocked.",
    metadata: { formId: partnerConsent.formId, submissionId: partnerConsent.submissionId },
  });
  return Response.json({ revoked: true, consentId: id, revokedAt });
}
