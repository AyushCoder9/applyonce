import dotenv from "dotenv";
import { and, eq } from "drizzle-orm";
import { getDatabase } from "@/db";
import { consents, profiles } from "@/db/schema";
import { STEM_REQUIREMENTS } from "@/lib/application-template";
import { createApplicationPacket, getApplication, submitApplication } from "@/lib/application-service";
import { createConsentHash } from "@/lib/intelligence";

dotenv.config({ path: ".env.local" });
dotenv.config();

async function smoke() {
  const db = getDatabase();
  const clerkUserId = `smoke_${Date.now()}`;
  let profileId: string | undefined;

  try {
    const [profile] = await db
      .insert(profiles)
      .values({
        clerkUserId,
        email: `${clerkUserId}@example.com`,
        fullName: "ApplyOnce smoke user",
      })
      .returning();

    if (!profile) {
      throw new Error("Smoke profile was not created");
    }
    profileId = profile.id;

    const answers = Object.fromEntries(
      STEM_REQUIREMENTS.map((requirement) => [
        requirement.key,
        { valueText: requirement.key === "declaration" ? "I agree" : "Smoke test value", confirmed: true },
      ]),
    );
    const created = await createApplicationPacket({
      profileId,
      templateSlug: "national-stem-entrance-2026",
      answers,
    });

    if (!created || created.application.status !== "ready") {
      throw new Error("Application packet did not reach ready state");
    }

    const scope = created.fields.map((field) => field.requirementKey);
    const purpose = "Smoke test application packet";
    const consentHash = createConsentHash({
      profileId,
      applicationId: created.application.id,
      purpose,
      scope,
      version: "2026-08-30",
    });

    const submitted = await submitApplication({
      profileId,
      applicationId: created.application.id,
      purpose,
      scope,
      consentHash,
      consentMethod: "manual",
    });
    if (!submitted || submitted.application.status !== "submitted" || !submitted.application.receiptCode) {
      throw new Error("Application did not submit or generate a receipt");
    }

    const retried = await submitApplication({
      profileId,
      applicationId: created.application.id,
      purpose,
      scope,
      consentHash,
      consentMethod: "manual",
    });
    const consentRows = await db
      .select({ id: consents.id })
      .from(consents)
      .where(and(eq(consents.profileId, profileId), eq(consents.applicationId, created.application.id)));
    if (!retried || retried.application.receiptCode !== submitted.application.receiptCode || consentRows.length !== 1) {
      throw new Error("Retry created a duplicate application consent");
    }

    const reloaded = await getApplication(created.application.id, profileId);
    if (!reloaded || reloaded.fields.some((field) => !field.sharedWithRecipient)) {
      throw new Error("Submitted packet did not persist its shared field state");
    }

    console.log(`Database smoke passed: ${submitted.application.receiptCode}`);
  } finally {
    if (profileId) {
      await db.delete(profiles).where(and(eq(profiles.id, profileId), eq(profiles.clerkUserId, clerkUserId)));
    }
  }
}

smoke().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
