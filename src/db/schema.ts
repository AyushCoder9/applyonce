import {
  boolean,
  date,
  index,
  integer,
  jsonb,
  pgEnum,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";

export const sourceProviderEnum = pgEnum("source_provider", [
  "meripehchaan",
  "digilocker",
  "apaar",
  "manual",
]);

export const sourceStatusEnum = pgEnum("source_status", [
  "connected",
  "attention",
  "disconnected",
]);

export const documentStatusEnum = pgEnum("document_status", [
  "verified",
  "pending",
  "expired",
  "revoked",
]);

export const applicationStatusEnum = pgEnum("application_status", [
  "draft",
  "needs_action",
  "ready",
  "submitted",
  "accepted",
  "rejected",
]);

export const fieldStateEnum = pgEnum("field_state", [
  "prefilled",
  "needs_confirmation",
  "missing",
  "confirmed",
]);

export const consentMethodEnum = pgEnum("consent_method", [
  "otp",
  "passkey",
  "biometric",
  "manual",
]);

export const notificationChannelEnum = pgEnum("notification_channel", [
  "in_app",
  "email",
]);

export const notificationStatusEnum = pgEnum("notification_status", [
  "queued",
  "sent",
  "failed",
]);

export const partnerMemberRoleEnum = pgEnum("partner_member_role", [
  "owner",
  "admin",
  "reviewer",
  "developer",
  "support",
]);

export const partnerFormStatusEnum = pgEnum("partner_form_status", [
  "draft",
  "published",
  "archived",
]);

export const partnerConsentMethodEnum = pgEnum("partner_consent_method", [
  "otp",
  "passkey",
  "biometric",
  "manual",
]);

export const partnerSubmissionStatusEnum = pgEnum("partner_submission_status", [
  "received",
  "under_review",
  "needs_documents",
  "accepted",
  "rejected",
  "completed",
]);

const jsonObject = () => sql`'{}'::jsonb`;
const jsonArray = () => sql`'[]'::jsonb`;

export const profiles = pgTable(
  "profiles",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    clerkUserId: text("clerk_user_id").notNull().unique(),
    email: text("email").notNull(),
    fullName: text("full_name").notNull(),
    phone: text("phone"),
    dateOfBirth: date("date_of_birth"),
    city: text("city"),
    state: text("state"),
    category: text("category"),
    annualIncomePaise: integer("annual_income_paise"),
    metadata: jsonb("metadata").$type<Record<string, unknown>>().notNull().default(jsonObject()),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [index("profiles_email_idx").on(table.email)],
);

export const sourceConnections = pgTable(
  "source_connections",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    profileId: uuid("profile_id")
      .notNull()
      .references(() => profiles.id, { onDelete: "cascade" }),
    provider: sourceProviderEnum("provider").notNull(),
    displayName: text("display_name").notNull(),
    status: sourceStatusEnum("status").notNull().default("connected"),
    scopes: jsonb("scopes").$type<string[]>().notNull().default(jsonArray()),
    lastVerifiedAt: timestamp("last_verified_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    uniqueIndex("source_connections_profile_provider_idx").on(table.profileId, table.provider),
    index("source_connections_profile_idx").on(table.profileId),
  ],
);

export const profileClaims = pgTable(
  "profile_claims",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    profileId: uuid("profile_id")
      .notNull()
      .references(() => profiles.id, { onDelete: "cascade" }),
    sourceConnectionId: uuid("source_connection_id").references(() => sourceConnections.id, {
      onDelete: "set null",
    }),
    key: text("key").notNull(),
    label: text("label").notNull(),
    valueText: text("value_text").notNull(),
    sensitivity: text("sensitivity").notNull().default("personal"),
    confidence: integer("confidence").notNull().default(100),
    verifiedAt: timestamp("verified_at", { withTimezone: true }),
    expiresAt: timestamp("expires_at", { withTimezone: true }),
    metadata: jsonb("metadata").$type<Record<string, unknown>>().notNull().default(jsonObject()),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    index("profile_claims_profile_idx").on(table.profileId),
    index("profile_claims_key_idx").on(table.profileId, table.key),
  ],
);

export const documents = pgTable(
  "documents",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    profileId: uuid("profile_id")
      .notNull()
      .references(() => profiles.id, { onDelete: "cascade" }),
    sourceConnectionId: uuid("source_connection_id").references(() => sourceConnections.id, {
      onDelete: "set null",
    }),
    title: text("title").notNull(),
    documentType: text("document_type").notNull(),
    provider: sourceProviderEnum("provider").notNull(),
    status: documentStatusEnum("status").notNull().default("pending"),
    maskedIdentifier: text("masked_identifier"),
    issuedAt: date("issued_at"),
    expiresAt: date("expires_at"),
    storageKey: text("storage_key"),
    checksum: text("checksum"),
    metadata: jsonb("metadata").$type<Record<string, unknown>>().notNull().default(jsonObject()),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [index("documents_profile_idx").on(table.profileId)],
);

export const applicationTemplates = pgTable(
  "application_templates",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    slug: text("slug").notNull().unique(),
    name: text("name").notNull(),
    externalPortalName: text("external_portal_name").notNull(),
    description: text("description").notNull(),
    category: text("category").notNull(),
    fieldCount: integer("field_count").notNull(),
    deadline: date("deadline"),
    active: boolean("active").notNull().default(true),
    metadata: jsonb("metadata").$type<Record<string, unknown>>().notNull().default(jsonObject()),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [index("application_templates_active_idx").on(table.active)],
);

export const applicationRequirements = pgTable(
  "application_requirements",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    templateId: uuid("template_id")
      .notNull()
      .references(() => applicationTemplates.id, { onDelete: "cascade" }),
    key: text("key").notNull(),
    label: text("label").notNull(),
    dataType: text("data_type").notNull().default("text"),
    required: boolean("required").notNull().default(true),
    sourceKey: text("source_key"),
    sourceProvider: sourceProviderEnum("source_provider"),
    needsUserDecision: boolean("needs_user_decision").notNull().default(false),
    validation: jsonb("validation").$type<Record<string, unknown>>().notNull().default(jsonObject()),
    sortOrder: integer("sort_order").notNull().default(0),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    uniqueIndex("application_requirements_template_key_idx").on(table.templateId, table.key),
    index("application_requirements_template_idx").on(table.templateId),
  ],
);

export const applications = pgTable(
  "applications",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    profileId: uuid("profile_id")
      .notNull()
      .references(() => profiles.id, { onDelete: "cascade" }),
    templateId: uuid("template_id")
      .notNull()
      .references(() => applicationTemplates.id, { onDelete: "restrict" }),
    status: applicationStatusEnum("status").notNull().default("draft"),
    externalApplicationId: text("external_application_id"),
    readinessScore: integer("readiness_score").notNull().default(0),
    readyFieldCount: integer("ready_field_count").notNull().default(0),
    totalFieldCount: integer("total_field_count").notNull().default(0),
    receiptCode: text("receipt_code").unique(),
    submittedAt: timestamp("submitted_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    index("applications_profile_idx").on(table.profileId),
    index("applications_status_idx").on(table.profileId, table.status),
  ],
);

export const applicationFields = pgTable(
  "application_fields",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    applicationId: uuid("application_id")
      .notNull()
      .references(() => applications.id, { onDelete: "cascade" }),
    requirementId: uuid("requirement_id")
      .notNull()
      .references(() => applicationRequirements.id, { onDelete: "cascade" }),
    requirementKey: text("requirement_key").notNull(),
    label: text("label").notNull(),
    valueText: text("value_text"),
    sourceLabel: text("source_label"),
    state: fieldStateEnum("state").notNull().default("missing"),
    confidence: integer("confidence"),
    sharedWithRecipient: boolean("shared_with_recipient").notNull().default(false),
    userConfirmedAt: timestamp("user_confirmed_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    uniqueIndex("application_fields_application_key_idx").on(table.applicationId, table.requirementKey),
    index("application_fields_application_idx").on(table.applicationId),
  ],
);

export const applicationSnapshots = pgTable(
  "application_snapshots",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    applicationId: uuid("application_id")
      .notNull()
      .unique()
      .references(() => applications.id, { onDelete: "cascade" }),
    profileId: uuid("profile_id")
      .notNull()
      .references(() => profiles.id, { onDelete: "cascade" }),
    version: text("version").notNull().default("2026-09-02"),
    payload: jsonb("payload").$type<Record<string, unknown>>().notNull(),
    payloadHash: text("payload_hash").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [index("application_snapshots_profile_idx").on(table.profileId, table.createdAt)],
);

export const consents = pgTable(
  "consents",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    profileId: uuid("profile_id")
      .notNull()
      .references(() => profiles.id, { onDelete: "cascade" }),
    applicationId: uuid("application_id")
      .notNull()
      .references(() => applications.id, { onDelete: "cascade" }),
    purpose: text("purpose").notNull(),
    scope: jsonb("scope").$type<string[]>().notNull().default(jsonArray()),
    method: consentMethodEnum("method").notNull().default("manual"),
    version: text("version").notNull().default("2026-08-01"),
    consentHash: text("consent_hash").notNull(),
    approvedAt: timestamp("approved_at", { withTimezone: true }).defaultNow().notNull(),
    revokedAt: timestamp("revoked_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    index("consents_profile_idx").on(table.profileId),
    index("consents_application_idx").on(table.applicationId),
  ],
);

export const applicationEvents = pgTable(
  "application_events",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    profileId: uuid("profile_id")
      .notNull()
      .references(() => profiles.id, { onDelete: "cascade" }),
    applicationId: uuid("application_id").references(() => applications.id, {
      onDelete: "cascade",
    }),
    eventType: text("event_type").notNull(),
    title: text("title").notNull(),
    description: text("description").notNull(),
    metadata: jsonb("metadata").$type<Record<string, unknown>>().notNull().default(jsonObject()),
    occurredAt: timestamp("occurred_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    index("application_events_profile_idx").on(table.profileId, table.occurredAt),
    index("application_events_application_idx").on(table.applicationId, table.occurredAt),
  ],
);

export const notifications = pgTable(
  "notifications",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    profileId: uuid("profile_id")
      .notNull()
      .references(() => profiles.id, { onDelete: "cascade" }),
    applicationId: uuid("application_id").references(() => applications.id, {
      onDelete: "cascade",
    }),
    channel: notificationChannelEnum("channel").notNull().default("in_app"),
    type: text("type").notNull(),
    status: notificationStatusEnum("status").notNull().default("queued"),
    recipient: text("recipient"),
    subject: text("subject").notNull(),
    body: text("body").notNull(),
    provider: text("provider").notNull().default("database_outbox"),
    providerMessageId: text("provider_message_id"),
    lastError: text("last_error"),
    sentAt: timestamp("sent_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [index("notifications_profile_idx").on(table.profileId, table.createdAt)],
);

export const dataExportRequests = pgTable(
  "data_export_requests",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    profileId: uuid("profile_id")
      .notNull()
      .references(() => profiles.id, { onDelete: "cascade" }),
    status: text("status").notNull().default("requested"),
    requestedAt: timestamp("requested_at", { withTimezone: true }).defaultNow().notNull(),
    completedAt: timestamp("completed_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [index("data_export_requests_profile_idx").on(table.profileId, table.createdAt)],
);

export const dataDeletionRequests = pgTable(
  "data_deletion_requests",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    profileId: uuid("profile_id")
      .notNull()
      .references(() => profiles.id, { onDelete: "cascade" }),
    status: text("status").notNull().default("requested"),
    reason: text("reason"),
    requestedAt: timestamp("requested_at", { withTimezone: true }).defaultNow().notNull(),
    completedAt: timestamp("completed_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [index("data_deletion_requests_profile_idx").on(table.profileId, table.createdAt)],
);

export const organizations = pgTable(
  "organizations",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    clerkOrgId: text("clerk_org_id").unique(),
    name: text("name").notNull(),
    slug: text("slug").notNull().unique(),
    kind: text("kind").notNull().default("education_partner"),
    status: text("status").notNull().default("approved"),
    contactEmail: text("contact_email"),
    verifiedDomain: text("verified_domain"),
    termsAcceptedAt: timestamp("terms_accepted_at", { withTimezone: true }),
    ownerClerkUserId: text("owner_clerk_user_id").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [index("organizations_owner_idx").on(table.ownerClerkUserId)],
);

export const organizationMembers = pgTable(
  "organization_members",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    organizationId: uuid("organization_id")
      .notNull()
      .references(() => organizations.id, { onDelete: "cascade" }),
    clerkUserId: text("clerk_user_id").notNull(),
    email: text("email").notNull(),
    role: partnerMemberRoleEnum("role").notNull().default("reviewer"),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    uniqueIndex("organization_members_org_user_idx").on(table.organizationId, table.clerkUserId),
    index("organization_members_user_idx").on(table.clerkUserId),
  ],
);

export const partnerForms = pgTable(
  "partner_forms",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    organizationId: uuid("organization_id")
      .notNull()
      .references(() => organizations.id, { onDelete: "cascade" }),
    slug: text("slug").notNull().unique(),
    name: text("name").notNull(),
    description: text("description").notNull(),
    category: text("category").notNull().default("admissions"),
    purpose: text("purpose").notNull(),
    status: partnerFormStatusEnum("status").notNull().default("draft"),
    version: integer("version").notNull().default(1),
    formSchema: jsonb("form_schema").$type<{
      fields: Array<{
        key: string;
        label: string;
        type: string;
        required: boolean;
        profileKey?: string;
        helpText?: string;
      }>;
      documents: Array<{ key: string; label: string; required: boolean }>;
    }>().notNull().default(sql`'{"fields":[],"documents":[]}'::jsonb`),
    branding: jsonb("branding").$type<{ accentColor?: string; logoUrl?: string; organizationName?: string }>().notNull().default(jsonObject()),
    createdByClerkUserId: text("created_by_clerk_user_id").notNull(),
    publishedAt: timestamp("published_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    index("partner_forms_org_idx").on(table.organizationId),
    index("partner_forms_status_idx").on(table.status),
  ],
);

export const partnerFormVersions = pgTable(
  "partner_form_versions",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    formId: uuid("form_id")
      .notNull()
      .references(() => partnerForms.id, { onDelete: "cascade" }),
    organizationId: uuid("organization_id")
      .notNull()
      .references(() => organizations.id, { onDelete: "cascade" }),
    version: integer("version").notNull(),
    name: text("name").notNull(),
    description: text("description").notNull(),
    category: text("category").notNull(),
    purpose: text("purpose").notNull(),
    formSchema: jsonb("form_schema").$type<{
      fields: Array<{
        key: string;
        label: string;
        type: string;
        required: boolean;
        profileKey?: string;
        helpText?: string;
      }>;
      documents: Array<{ key: string; label: string; required: boolean }>;
    }>().notNull(),
    branding: jsonb("branding").$type<{ accentColor?: string; logoUrl?: string; organizationName?: string }>().notNull().default(jsonObject()),
    publishedByClerkUserId: text("published_by_clerk_user_id").notNull(),
    publishedAt: timestamp("published_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    uniqueIndex("partner_form_versions_form_version_idx").on(table.formId, table.version),
    index("partner_form_versions_org_idx").on(table.organizationId, table.publishedAt),
  ],
);

export const partnerSubmissions = pgTable(
  "partner_submissions",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    formId: uuid("form_id")
      .notNull()
      .references(() => partnerForms.id, { onDelete: "cascade" }),
    profileId: uuid("profile_id").references(() => profiles.id, { onDelete: "set null" }),
    applicationId: uuid("application_id").references(() => applications.id, { onDelete: "set null" }),
    applicantName: text("applicant_name").notNull(),
    applicantEmail: text("applicant_email").notNull(),
    status: partnerSubmissionStatusEnum("status").notNull().default("received"),
    receiptCode: text("receipt_code").notNull().unique(),
    data: jsonb("data").$type<Record<string, string>>().notNull().default(jsonObject()),
    documentIds: jsonb("document_ids").$type<string[]>().notNull().default(jsonArray()),
    partnerConsentId: uuid("partner_consent_id").references(() => partnerConsents.id, { onDelete: "set null" }),
    idempotencyKey: text("idempotency_key"),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    index("partner_submissions_form_idx").on(table.formId, table.createdAt),
    index("partner_submissions_profile_idx").on(table.profileId),
    index("partner_submissions_status_idx").on(table.status),
    uniqueIndex("partner_submissions_idempotency_idx").on(table.formId, table.idempotencyKey),
  ],
);

export const partnerConsents = pgTable(
  "partner_consents",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    formId: uuid("form_id")
      .notNull()
      .references(() => partnerForms.id, { onDelete: "cascade" }),
    submissionId: uuid("submission_id").notNull(),
    profileId: uuid("profile_id").references(() => profiles.id, { onDelete: "set null" }),
    applicantName: text("applicant_name").notNull(),
    applicantEmail: text("applicant_email").notNull(),
    purpose: text("purpose").notNull(),
    scope: jsonb("scope").$type<string[]>().notNull().default(jsonArray()),
    method: partnerConsentMethodEnum("method").notNull().default("manual"),
    version: text("version").notNull().default("2026-08-30"),
    consentHash: text("consent_hash").notNull(),
    approvedAt: timestamp("approved_at", { withTimezone: true }).defaultNow().notNull(),
    revokedAt: timestamp("revoked_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    index("partner_consents_form_idx").on(table.formId, table.createdAt),
    index("partner_consents_profile_idx").on(table.profileId, table.createdAt),
    index("partner_consents_submission_idx").on(table.submissionId),
  ],
);

export const partnerWebhooks = pgTable(
  "partner_webhooks",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    organizationId: uuid("organization_id")
      .notNull()
      .references(() => organizations.id, { onDelete: "cascade" }),
    url: text("url").notNull(),
    secretHash: text("secret_hash").notNull(),
    secretCiphertext: text("secret_ciphertext"),
    events: jsonb("events").$type<string[]>().notNull().default(jsonArray()),
    active: boolean("active").notNull().default(true),
    lastDeliveryAt: timestamp("last_delivery_at", { withTimezone: true }),
    lastError: text("last_error"),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [index("partner_webhooks_org_idx").on(table.organizationId)],
);

export const partnerApiKeys = pgTable(
  "partner_api_keys",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    organizationId: uuid("organization_id")
      .notNull()
      .references(() => organizations.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    keyPrefix: text("key_prefix").notNull(),
    keyHash: text("key_hash").notNull(),
    scopes: jsonb("scopes").$type<string[]>().notNull().default(jsonArray()),
    createdByClerkUserId: text("created_by_clerk_user_id").notNull(),
    lastUsedAt: timestamp("last_used_at", { withTimezone: true }),
    expiresAt: timestamp("expires_at", { withTimezone: true }),
    revokedAt: timestamp("revoked_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    uniqueIndex("partner_api_keys_hash_idx").on(table.keyHash),
    index("partner_api_keys_org_idx").on(table.organizationId, table.createdAt),
  ],
);

export const partnerWebhookDeliveries = pgTable(
  "partner_webhook_deliveries",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    webhookId: uuid("webhook_id")
      .notNull()
      .references(() => partnerWebhooks.id, { onDelete: "cascade" }),
    eventType: text("event_type").notNull(),
    payload: jsonb("payload").$type<Record<string, unknown>>().notNull().default(jsonObject()),
    statusCode: integer("status_code"),
    status: text("status").notNull().default("pending"),
    attempts: integer("attempts").notNull().default(0),
    lastError: text("last_error"),
    deliveredAt: timestamp("delivered_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [index("partner_webhook_deliveries_webhook_idx").on(table.webhookId, table.createdAt)],
);

export const platformAuditEvents = pgTable(
  "platform_audit_events",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    actorClerkUserId: text("actor_clerk_user_id").notNull(),
    action: text("action").notNull(),
    targetType: text("target_type").notNull(),
    targetId: text("target_id").notNull(),
    metadata: jsonb("metadata").$type<Record<string, unknown>>().notNull().default(jsonObject()),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    index("platform_audit_events_actor_idx").on(table.actorClerkUserId, table.createdAt),
    index("platform_audit_events_target_idx").on(table.targetType, table.targetId, table.createdAt),
  ],
);

export const schema = {
  profiles,
  sourceConnections,
  profileClaims,
  documents,
  applicationTemplates,
  applicationRequirements,
  applications,
  applicationFields,
  applicationSnapshots,
  consents,
  applicationEvents,
  notifications,
  dataExportRequests,
  dataDeletionRequests,
  organizations,
  organizationMembers,
  partnerForms,
  partnerFormVersions,
  partnerSubmissions,
  partnerConsents,
  partnerWebhooks,
  partnerWebhookDeliveries,
  partnerApiKeys,
  platformAuditEvents,
};
