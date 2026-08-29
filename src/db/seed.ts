import dotenv from "dotenv";
import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import { and, eq } from "drizzle-orm";
import { DEMO_PROFILE, DEMO_SOURCES, STEM_REQUIREMENTS, STEM_TEMPLATE } from "@/lib/application-template";
import {
  applicationEvents,
  applicationFields,
  applicationRequirements,
  applicationTemplates,
  applications,
  documents,
  notifications,
  organizationMembers,
  organizations,
  profileClaims,
  profiles,
  partnerForms,
  partnerSubmissions,
  schema,
  sourceConnections,
} from "@/db/schema";

dotenv.config({ path: ".env.local" });
dotenv.config();

const connectionString = process.env.DATABASE_URL_UNPOOLED ?? process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error("DATABASE_URL_UNPOOLED or DATABASE_URL is required to seed the database");
}

const db = drizzle(neon(connectionString), { schema });

async function seed() {
  const [template] = await db
    .insert(applicationTemplates)
    .values({
      slug: STEM_TEMPLATE.slug,
      name: STEM_TEMPLATE.name,
      externalPortalName: STEM_TEMPLATE.externalPortalName,
      description: STEM_TEMPLATE.description,
      category: STEM_TEMPLATE.category,
      fieldCount: STEM_TEMPLATE.fieldCount,
      deadline: STEM_TEMPLATE.deadline,
    })
    .onConflictDoUpdate({
      target: applicationTemplates.slug,
      set: {
        name: STEM_TEMPLATE.name,
        externalPortalName: STEM_TEMPLATE.externalPortalName,
        description: STEM_TEMPLATE.description,
        category: STEM_TEMPLATE.category,
        fieldCount: STEM_TEMPLATE.fieldCount,
        deadline: STEM_TEMPLATE.deadline,
        updatedAt: new Date(),
      },
    })
    .returning();

  if (!template) {
    throw new Error("Unable to create the STEM application template");
  }

  for (const [sortOrder, requirement] of STEM_REQUIREMENTS.entries()) {
    await db
      .insert(applicationRequirements)
      .values({
        templateId: template.id,
        key: requirement.key,
        label: requirement.label,
        dataType: requirement.dataType,
        sourceKey: requirement.sourceKey,
        sourceProvider: requirement.sourceProvider,
        needsUserDecision: requirement.needsUserDecision,
        sortOrder,
      })
      .onConflictDoUpdate({
        target: [applicationRequirements.templateId, applicationRequirements.key],
        set: {
          label: requirement.label,
          dataType: requirement.dataType,
          sourceKey: requirement.sourceKey,
          sourceProvider: requirement.sourceProvider,
          needsUserDecision: requirement.needsUserDecision,
          sortOrder,
        },
      });
  }

  const requirementCount = await db
    .select({ id: applicationRequirements.id })
    .from(applicationRequirements)
    .where(and(eq(applicationRequirements.templateId, template.id)));

  console.log(`Seeded ${template.slug} with ${requirementCount.length} requirements`);

  await seedDemo(template.id);
  await seedPartnerWorkspace();
}

async function seedPartnerWorkspace() {
  const [insertedOrganization] = await db
    .insert(organizations)
    .values({
      clerkOrgId: "demo_partner_applyonce",
      name: "Northstar Education",
      slug: "northstar-education",
      ownerClerkUserId: "demo_partner_applyonce",
    })
    .onConflictDoNothing({ target: organizations.slug })
    .returning();

  const [organization] = insertedOrganization
    ? [insertedOrganization]
    : await db.select().from(organizations).where(eq(organizations.slug, "northstar-education")).limit(1);
  if (!organization) throw new Error("Unable to create partner demo workspace");

  await db
    .insert(organizationMembers)
    .values({
      organizationId: organization.id,
      clerkUserId: "demo_partner_applyonce",
      email: "partner.demo@example.com",
      role: "owner",
    })
    .onConflictDoNothing({ target: [organizationMembers.organizationId, organizationMembers.clerkUserId] });

  const defaultSchema = {
    fields: [
      { key: "full_name", label: "Full name", type: "text", required: true, profileKey: "full_name", helpText: "Use the name on your official identity record." },
      { key: "email_address", label: "Email address", type: "email", required: true, profileKey: "email_address" },
      { key: "academic_record", label: "Latest academic record", type: "text", required: true, profileKey: "academic_record" },
      { key: "preferred_course", label: "Preferred course", type: "select", required: true, helpText: "Choose your first preference." },
    ],
    documents: [{ key: "class_xii_marksheet", label: "Class XII marksheet", required: true }],
  };

  const [insertedForm] = await db
    .insert(partnerForms)
    .values({
      organizationId: organization.id,
      slug: "northstar-undergraduate-2026",
      name: "Northstar Undergraduate 2026",
      description: "A calmer admissions form for Northstar Education applicants.",
      category: "Admissions",
      purpose: "Evaluate an undergraduate admission application for the 2026 intake.",
      status: "published",
      formSchema: defaultSchema,
      branding: { accentColor: "#4F46E5", organizationName: "Northstar Education" },
      createdByClerkUserId: "demo_partner_applyonce",
      publishedAt: new Date("2026-08-29T13:20:00.000Z"),
    })
    .onConflictDoNothing({ target: partnerForms.slug })
    .returning();
  const [form] = insertedForm
    ? [insertedForm]
    : await db.select().from(partnerForms).where(eq(partnerForms.slug, "northstar-undergraduate-2026")).limit(1);
  if (!form) throw new Error("Unable to create partner demo form");

  const [demoProfile] = await db.select().from(profiles).where(eq(profiles.clerkUserId, "demo_applyonce")).limit(1);
  const existingSubmission = await db.select({ id: partnerSubmissions.id }).from(partnerSubmissions).where(eq(partnerSubmissions.formId, form.id)).limit(1);
  if (!existingSubmission[0]) {
    await db.insert(partnerSubmissions).values({
      formId: form.id,
      profileId: demoProfile?.id,
      applicantName: "Aanya Mehta",
      applicantEmail: "aanya.mehta.demo@example.com",
      status: "under_review",
      receiptCode: "AP-2026-NSTAR01",
      data: { full_name: "Aanya Mehta", email_address: "aanya.mehta.demo@example.com", academic_record: "Class XII · 91.4%", preferred_course: "Computer Science" },
    });
  }
  console.log("Seeded Northstar partner workspace and hosted form");
}

async function seedDemo(templateId: string) {
  const [insertedProfile] = await db
    .insert(profiles)
    .values({
      clerkUserId: "demo_applyonce",
      email: DEMO_PROFILE.email,
      fullName: DEMO_PROFILE.fullName,
      phone: DEMO_PROFILE.phone,
      dateOfBirth: DEMO_PROFILE.dateOfBirth,
      city: DEMO_PROFILE.city,
      state: DEMO_PROFILE.state,
      category: DEMO_PROFILE.category,
    })
    .onConflictDoNothing({ target: profiles.clerkUserId })
    .returning();

  const [demoProfile] = insertedProfile
    ? [insertedProfile]
    : await db.select().from(profiles).where(eq(profiles.clerkUserId, "demo_applyonce")).limit(1);

  if (!demoProfile) {
    throw new Error("Unable to create synthetic demo profile");
  }

  for (const source of DEMO_SOURCES) {
    await db
      .insert(sourceConnections)
      .values({
        profileId: demoProfile.id,
        provider: source.provider,
        displayName: source.displayName,
        status: source.status,
        lastVerifiedAt: new Date("2026-08-29T13:12:00.000Z"),
      })
      .onConflictDoNothing({
        target: [sourceConnections.profileId, sourceConnections.provider],
      });
  }

  await db
    .insert(sourceConnections)
    .values({
      profileId: demoProfile.id,
      provider: "manual",
      displayName: "Profile details",
      status: "connected",
      lastVerifiedAt: new Date("2026-08-29T13:12:00.000Z"),
    })
    .onConflictDoNothing({
      target: [sourceConnections.profileId, sourceConnections.provider],
    });

  const demoSources = await db
    .select()
    .from(sourceConnections)
    .where(eq(sourceConnections.profileId, demoProfile.id));
  const sourceByProvider = new Map(demoSources.map((source) => [source.provider, source]));

  const claims = [
    ["full_name", "Full name", DEMO_PROFILE.fullName, "meripehchaan"],
    ["date_of_birth", "Date of birth", "14 August 2005", "meripehchaan"],
    ["parent_guardian", "Parent / guardian", DEMO_PROFILE.parentGuardian, "manual"],
    ["category", "Category", DEMO_PROFILE.category, "meripehchaan"],
    ["annual_family_income", "Annual family income", DEMO_PROFILE.annualFamilyIncome, "manual"],
    ["mobile_number", "Mobile number", DEMO_PROFILE.phone, "meripehchaan"],
    ["email_address", "Email address", DEMO_PROFILE.email, "manual"],
    ["academic_record", "Academic record", DEMO_PROFILE.academicRecord, "apaar"],
    ["class_xii_marksheet", "Class XII marksheet", "Class XII marksheet · 91.4%", "digilocker"],
    ["identity_verified", "Identity verification", "Verified", "meripehchaan"],
  ] as const;

  for (const [key, label, valueText, provider] of claims) {
    const existing = await db
      .select({ id: profileClaims.id })
      .from(profileClaims)
      .where(and(eq(profileClaims.profileId, demoProfile.id), eq(profileClaims.key, key)))
      .limit(1);

    if (!existing[0]) {
      await db.insert(profileClaims).values({
        profileId: demoProfile.id,
        sourceConnectionId: sourceByProvider.get(provider)?.id,
        key,
        label,
        valueText,
        sensitivity: key.includes("income") ? "financial" : "personal",
        confidence: 99,
        verifiedAt: new Date("2026-08-29T13:12:00.000Z"),
      });
    }
  }

  const existingDocument = await db
    .select({ id: documents.id })
    .from(documents)
    .where(and(eq(documents.profileId, demoProfile.id), eq(documents.documentType, "class_xii_marksheet")))
    .limit(1);
  if (!existingDocument[0]) {
    await db.insert(documents).values({
      profileId: demoProfile.id,
      sourceConnectionId: sourceByProvider.get("digilocker")?.id,
      title: "Class XII marksheet",
      documentType: "class_xii_marksheet",
      provider: "digilocker",
      status: "verified",
      maskedIdentifier: "DL••••914",
      issuedAt: "2024-05-20",
      metadata: { synthetic: true, note: "Hackathon demo document metadata only" },
    });
  }

  const [existingApplication] = await db
    .select()
    .from(applications)
    .where(and(eq(applications.profileId, demoProfile.id), eq(applications.templateId, templateId)))
    .limit(1);

  const demoApplication = existingApplication ?? (await db.insert(applications).values({
    profileId: demoProfile.id,
    templateId,
    status: "needs_action",
    readinessScore: 92,
    readyFieldCount: 35,
    totalFieldCount: 38,
  }).returning())[0];

  if (!demoApplication) {
    throw new Error("Unable to create synthetic demo application");
  }

  const requirementRows = await db
    .select()
    .from(applicationRequirements)
    .where(eq(applicationRequirements.templateId, templateId))
    .orderBy(applicationRequirements.sortOrder);
  const existingFields = await db
    .select({ requirementKey: applicationFields.requirementKey })
    .from(applicationFields)
    .where(eq(applicationFields.applicationId, demoApplication.id));

  if (existingFields.length === 0) {
    const values: Record<string, string> = {
      full_name: DEMO_PROFILE.fullName,
      date_of_birth: "14 August 2005",
      parent_guardian: DEMO_PROFILE.parentGuardian,
      category: DEMO_PROFILE.category,
      annual_family_income: DEMO_PROFILE.annualFamilyIncome,
      mobile_number: DEMO_PROFILE.phone,
      email_address: DEMO_PROFILE.email,
      academic_record: DEMO_PROFILE.academicRecord,
      class_xii_marksheet: "Class XII marksheet · 91.4%",
      identity_verification: "Verified",
      exam_city: DEMO_PROFILE.city,
      declaration: "I agree to the terms",
    };
    await db.insert(applicationFields).values(
      requirementRows.map((requirement) => ({
        applicationId: demoApplication.id,
        requirementId: requirement.id,
        requirementKey: requirement.key,
        label: requirement.label,
        valueText: values[requirement.key] ?? null,
        sourceLabel: requirement.key === "exam_city" || requirement.key === "declaration"
          ? "You confirmed"
          : requirement.sourceProvider === "digilocker"
            ? "DigiLocker"
            : requirement.sourceProvider === "apaar"
              ? "APAAR"
              : requirement.sourceProvider === "meripehchaan"
                ? "MeriPehchaan"
                : "Profile details",
        state: requirement.key === "annual_family_income"
          ? ("needs_confirmation" as const)
          : ("prefilled" as const),
        confidence: requirement.key === "annual_family_income" ? 91 : 99,
      })),
    );
  }

  const existingEvent = await db
    .select({ id: applicationEvents.id })
    .from(applicationEvents)
    .where(and(eq(applicationEvents.applicationId, demoApplication.id), eq(applicationEvents.eventType, "packet_prepared")))
    .limit(1);
  if (!existingEvent[0]) {
    await db.insert(applicationEvents).values([
      {
        profileId: demoProfile.id,
        applicationId: demoApplication.id,
        eventType: "academic_refreshed",
        title: "Academic record refreshed",
        description: "APAAR matched the latest Class XII record.",
        occurredAt: new Date("2026-08-29T13:12:00.000Z"),
      },
      {
        profileId: demoProfile.id,
        applicationId: demoApplication.id,
        eventType: "packet_prepared",
        title: "Profile packet prepared",
        description: "35 fields are ready for National STEM Entrance.",
        occurredAt: new Date("2026-08-29T12:55:00.000Z"),
      },
      {
        profileId: demoProfile.id,
        applicationId: demoApplication.id,
        eventType: "consent_saved",
        title: "Consent preferences saved",
        description: "Nothing is shared until you approve an application packet.",
        occurredAt: new Date("2026-08-28T13:12:00.000Z"),
      },
    ]);
  }

  const existingNotification = await db
    .select({ id: notifications.id })
    .from(notifications)
    .where(and(eq(notifications.profileId, demoProfile.id), eq(notifications.type, "packet_prepared")))
    .limit(1);
  if (!existingNotification[0]) {
    await db.insert(notifications).values({
      profileId: demoProfile.id,
      applicationId: demoApplication.id,
      channel: "in_app",
      type: "packet_prepared",
      status: "sent",
      subject: "Your application packet is ready to review",
      body: "National STEM Entrance 2026 has been mapped and is ready for review.",
      provider: "database_outbox",
      sentAt: new Date("2026-08-29T12:55:00.000Z"),
    });
  }

  console.log("Seeded synthetic demo profile and packet");
}

seed().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
