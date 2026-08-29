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

export const schema = {
  profiles,
  sourceConnections,
  profileClaims,
  documents,
  applicationTemplates,
  applicationRequirements,
  applications,
  applicationFields,
  consents,
  applicationEvents,
  notifications,
};
