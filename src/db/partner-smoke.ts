import dotenv from "dotenv";
import { and, eq } from "drizzle-orm";
import { getDatabase } from "@/db";
import { partnerConsents, partnerSubmissions, profiles } from "@/db/schema";
import { createPublicSubmission, getPublishedPartnerForm, updatePartnerSubmissionStatus } from "@/lib/partner-service";
import { getProfileSnapshot } from "@/lib/application-service";

dotenv.config({ path: ".env.local" });
dotenv.config();

async function smoke() {
  const db = getDatabase();
  const formResult = await getPublishedPartnerForm("northstar-undergraduate-2026");
  if (!formResult) throw new Error("Seeded partner form was not found");
  const clerkUserId = `partner_smoke_${Date.now()}`;
  let profileId: string | undefined;
  let submissionId: string | undefined;

  try {
    const [profile] = await db.insert(profiles).values({ clerkUserId, email: `${clerkUserId}@example.com`, fullName: "ApplyOnce partner smoke user" }).returning();
    if (!profile) throw new Error("Partner smoke profile was not created");
    profileId = profile.id;
    const idempotencyKey = `partner-smoke-${Date.now()}`;
    const input = {
      formId: formResult.form.id,
      profileId,
      applicantName: profile.fullName,
      applicantEmail: profile.email,
      data: { full_name: profile.fullName, email_address: profile.email, academic_record: "Smoke test record", preferred_course: "Computer Science" },
      documentIds: [],
      idempotencyKey,
      purpose: formResult.form.purpose,
      scope: ["full_name", "email_address", "academic_record", "preferred_course"],
      consentMethod: "manual" as const,
      status: "needs_documents" as const,
      formName: formResult.form.name,
      organizationName: formResult.organization.name,
      organizationId: formResult.organization.id,
    };
    const first = await createPublicSubmission(input);
    const second = await createPublicSubmission(input);
    if (!first || !second || first.id !== second.id || first.partnerConsentId === null || first.status !== "needs_documents") {
      throw new Error("Partner submission idempotency or consent persistence failed");
    }
    submissionId = first.id;
    const updated = await updatePartnerSubmissionStatus({ id: first.id, organizationId: formResult.organization.id, status: "accepted" });
    if (!updated || updated.status !== "accepted") throw new Error("Partner submission status did not persist");
    const citizenSnapshot = await getProfileSnapshot(profileId);
    if (!citizenSnapshot?.partnerApplications.some(({ submission }) => submission.id === first.id && submission.status === "accepted")) {
      throw new Error("Partner application did not appear in the citizen workspace snapshot");
    }
    const [reloaded] = await db.select({ status: partnerSubmissions.status, consentId: partnerSubmissions.partnerConsentId }).from(partnerSubmissions).where(and(eq(partnerSubmissions.id, first.id), eq(partnerSubmissions.formId, formResult.form.id))).limit(1);
    if (!reloaded || reloaded.status !== "accepted" || !reloaded.consentId) throw new Error("Partner submission could not be reloaded");
    console.log(`Partner database smoke passed: ${first.receiptCode}`);
  } finally {
    if (submissionId) await db.delete(partnerConsents).where(eq(partnerConsents.submissionId, submissionId));
    if (submissionId) await db.delete(partnerSubmissions).where(eq(partnerSubmissions.id, submissionId));
    if (profileId) await db.delete(profiles).where(and(eq(profiles.id, profileId), eq(profiles.clerkUserId, clerkUserId)));
  }
}

smoke().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
