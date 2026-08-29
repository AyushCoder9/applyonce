import { and, asc, desc, eq, ne } from "drizzle-orm";
import { getDatabase } from "@/db";
import {
  applicationEvents,
  applicationFields,
  applicationRequirements,
  applicationTemplates,
  applications,
  consents,
  documents,
  notifications,
  organizations,
  partnerForms,
  partnerSubmissions,
  profileClaims,
  profiles,
  sourceConnections,
} from "@/db/schema";
import {
  createReceiptCode,
  evaluateReadiness,
  type UserAnswer,
} from "@/lib/intelligence";
import { queueInAppNotification } from "@/lib/notifications";

export async function findProfileByClerkUserId(clerkUserId: string) {
  const db = getDatabase();
  const [profile] = await db
    .select()
    .from(profiles)
    .where(eq(profiles.clerkUserId, clerkUserId))
    .limit(1);

  return profile ?? null;
}

export async function getApplicationTemplate(slug: string) {
  const db = getDatabase();
  const [template] = await db
    .select()
    .from(applicationTemplates)
    .where(and(eq(applicationTemplates.slug, slug), eq(applicationTemplates.active, true)))
    .limit(1);

  if (!template) {
    return null;
  }

  const requirements = await db
    .select()
    .from(applicationRequirements)
    .where(eq(applicationRequirements.templateId, template.id))
    .orderBy(asc(applicationRequirements.sortOrder));

  return { template, requirements };
}

export async function getProfileClaims(profileId: string) {
  const db = getDatabase();
  return db
    .select({ claim: profileClaims, sourceLabel: sourceConnections.displayName })
    .from(profileClaims)
    .leftJoin(sourceConnections, eq(profileClaims.sourceConnectionId, sourceConnections.id))
    .where(eq(profileClaims.profileId, profileId))
    .orderBy(desc(profileClaims.updatedAt));
}

export async function calculateProfileReadiness(
  profileId: string,
  templateSlug: string,
  answers: Record<string, UserAnswer> = {},
) {
  const packet = await getApplicationTemplate(templateSlug);
  if (!packet) {
    return null;
  }

  const claimRows = await getProfileClaims(profileId);
  const readiness = evaluateReadiness(
    packet.requirements,
    claimRows.map(({ claim, sourceLabel }) => ({
      key: claim.key,
      valueText: claim.valueText,
      label: claim.label,
      sourceLabel,
      confidence: claim.confidence,
      verifiedAt: claim.verifiedAt,
      expiresAt: claim.expiresAt,
    })),
    answers,
    packet.template.fieldCount,
  );

  return { ...packet, readiness, claimRows };
}

export async function createApplicationPacket(input: {
  profileId: string;
  templateSlug: string;
  answers?: Record<string, UserAnswer>;
}) {
  const calculated = await calculateProfileReadiness(
    input.profileId,
    input.templateSlug,
    input.answers,
  );

  if (!calculated) {
    return null;
  }

  const db = getDatabase();
  const status = calculated.readiness.needsAction.length > 0 ? "needs_action" : "ready";
  const [application] = await db
    .insert(applications)
    .values({
      profileId: input.profileId,
      templateId: calculated.template.id,
      status,
      readinessScore: calculated.readiness.readinessScore,
      readyFieldCount: calculated.readiness.readyFieldCount,
      totalFieldCount: calculated.readiness.totalFieldCount,
    })
    .returning();

  if (!application) {
    throw new Error("Unable to create application packet");
  }

  const claimsByKey = new Map(
    calculated.claimRows.map(({ claim, sourceLabel }) => [claim.key, { claim, sourceLabel }]),
  );

  await db.insert(applicationFields).values(
    calculated.requirements.map((requirement) => {
      const readinessField = calculated.readiness.fields.find(
        (field) => field.key === requirement.key,
      );
      const source = requirement.sourceKey
        ? claimsByKey.get(requirement.sourceKey)
        : undefined;

      return {
        applicationId: application.id,
        requirementId: requirement.id,
        requirementKey: requirement.key,
        label: requirement.label,
        valueText: readinessField?.valueText ?? null,
        sourceLabel: readinessField?.sourceLabel ?? source?.sourceLabel ?? null,
        state: readinessField?.state ?? "missing",
        confidence: readinessField?.confidence ?? source?.claim.confidence ?? null,
      };
    }),
  );

  await db.insert(applicationEvents).values({
    profileId: input.profileId,
    applicationId: application.id,
    eventType: "packet_prepared",
    title: "Application packet prepared",
    description: `${calculated.readiness.readyFieldCount} fields are ready from your approved profile.`,
    metadata: {
      templateSlug: input.templateSlug,
      readinessScore: calculated.readiness.readinessScore,
    },
  });

  await queueInAppNotification({
    profileId: input.profileId,
    applicationId: application.id,
    type: "packet_prepared",
    subject: "Your application packet is ready to review",
    body: `${calculated.template.name} has been mapped. Review the requested fields before sharing.`,
  });

  return getApplication(application.id, input.profileId);
}

export async function getApplication(applicationId: string, profileId: string) {
  const db = getDatabase();
  const [applicationRow] = await db
    .select({ application: applications, template: applicationTemplates })
    .from(applications)
    .innerJoin(applicationTemplates, eq(applications.templateId, applicationTemplates.id))
    .where(and(eq(applications.id, applicationId), eq(applications.profileId, profileId)))
    .limit(1);

  if (!applicationRow) {
    return null;
  }

  const fields = await db
    .select()
    .from(applicationFields)
    .where(eq(applicationFields.applicationId, applicationId))
    .orderBy(asc(applicationFields.createdAt));
  const events = await db
    .select()
    .from(applicationEvents)
    .where(eq(applicationEvents.applicationId, applicationId))
    .orderBy(desc(applicationEvents.occurredAt));

  return {
    ...applicationRow,
    fields,
    events,
  };
}

export async function listApplications(profileId: string) {
  const db = getDatabase();
  return db
    .select({ application: applications, template: applicationTemplates })
    .from(applications)
    .innerJoin(applicationTemplates, eq(applications.templateId, applicationTemplates.id))
    .where(eq(applications.profileId, profileId))
    .orderBy(desc(applications.updatedAt));
}

export async function listPartnerApplications(profileId: string) {
  const db = getDatabase();
  return db
    .select({ submission: partnerSubmissions, form: partnerForms, organization: organizations })
    .from(partnerSubmissions)
    .innerJoin(partnerForms, eq(partnerSubmissions.formId, partnerForms.id))
    .innerJoin(organizations, eq(partnerForms.organizationId, organizations.id))
    .where(eq(partnerSubmissions.profileId, profileId))
    .orderBy(desc(partnerSubmissions.updatedAt));
}

export async function getProfileSnapshot(profileId: string) {
  const db = getDatabase();
  const [profile] = await db.select().from(profiles).where(eq(profiles.id, profileId)).limit(1);

  if (!profile) {
    return null;
  }

  const [connections, claims, profileDocuments, appRows, partnerAppRows, events, profileNotifications] =
    await Promise.all([
      db.select().from(sourceConnections).where(eq(sourceConnections.profileId, profileId)),
      getProfileClaims(profileId),
      db.select().from(documents).where(eq(documents.profileId, profileId)),
      listApplications(profileId),
      listPartnerApplications(profileId),
      db
        .select()
        .from(applicationEvents)
        .where(eq(applicationEvents.profileId, profileId))
        .orderBy(desc(applicationEvents.occurredAt))
        .limit(20),
      db
        .select()
        .from(notifications)
        .where(eq(notifications.profileId, profileId))
        .orderBy(desc(notifications.createdAt))
        .limit(20),
    ]);

  return {
    profile,
    connections,
    claims,
    documents: profileDocuments,
    applications: appRows,
    partnerApplications: partnerAppRows,
    events,
    notifications: profileNotifications,
  };
}

export async function submitApplication(input: {
  applicationId: string;
  profileId: string;
  purpose: string;
  scope: string[];
  consentHash: string;
  consentMethod: "otp" | "passkey" | "biometric" | "manual";
}) {
  const db = getDatabase();
  const submittedAt = new Date();
  const externalApplicationId = `NSE26-${input.applicationId.slice(0, 6).toUpperCase()}`;
  const receiptCode = createReceiptCode("AO");

  const result = await db.transaction(async (tx) => {
    const [updatedApplication] = await tx
      .update(applications)
      .set({
        status: "submitted",
        externalApplicationId,
        receiptCode,
        submittedAt,
        updatedAt: submittedAt,
      })
      .where(and(eq(applications.id, input.applicationId), eq(applications.profileId, input.profileId), ne(applications.status, "submitted")))
      .returning();

    if (!updatedApplication) {
      const [existingApplication] = await tx
        .select()
        .from(applications)
        .where(and(eq(applications.id, input.applicationId), eq(applications.profileId, input.profileId)))
        .limit(1);
      return { application: existingApplication ?? null, created: false };
    }

    const [consent] = await tx
      .insert(consents)
      .values({
        profileId: input.profileId,
        applicationId: input.applicationId,
        purpose: input.purpose,
        scope: input.scope,
        method: input.consentMethod,
        version: "2026-08-30",
        consentHash: input.consentHash,
      })
      .returning({ id: consents.id });

    if (!consent) {
      throw new Error("Unable to record application consent");
    }

    await tx
      .update(applicationFields)
      .set({ sharedWithRecipient: true, updatedAt: submittedAt })
      .where(eq(applicationFields.applicationId, input.applicationId));

    return { application: updatedApplication, created: true };
  });

  if (!result.application) {
    return null;
  }

  if (!result.created) {
    return getApplication(input.applicationId, input.profileId);
  }

  await db.insert(applicationEvents).values({
    profileId: input.profileId,
    applicationId: input.applicationId,
    eventType: "submitted",
    title: "Application submitted",
    description: "The approved packet was submitted to the receiving portal.",
    metadata: { externalApplicationId, receiptCode },
    occurredAt: submittedAt,
  });

  await queueInAppNotification({
    profileId: input.profileId,
    applicationId: input.applicationId,
    type: "application_submitted",
    subject: "Application submitted successfully",
    body: `Your receipt ${receiptCode} is ready. Keep it for future updates.`,
  });

  return getApplication(input.applicationId, input.profileId);
}
