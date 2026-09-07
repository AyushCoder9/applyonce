import { pgTable, pgEnum, text, integer, real, boolean, jsonb, uuid, uniqueIndex, index, bigserial, primaryKey } from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";
import { bytea, ts, id, createdAt, updatedAt } from "./_common";
import { user } from "./auth";

// ---------- enums ----------
export const profileKind = pgEnum("profile_kind", ["self", "dependent"]);
export const relationBasis = pgEnum("relation_basis", ["minor", "elder_consent", "poa"]);
export const factSource = pgEnum("fact_source", ["self_declared", "document_extracted", "issuer_verified", "provider_verified"]);
export const docOrigin = pgEnum("doc_origin", ["digilocker", "upload", "generated"]);
export const docStatus = pgEnum("doc_status", ["pending", "ready", "rejected"]);
export const providerName = pgEnum("provider_name", ["digilocker", "aadhaar_offline", "pan", "abha", "aa", "esign", "ocr"]);
export const jobStatus = pgEnum("job_status", ["queued", "running", "succeeded", "failed"]);
export const purposeEnum = pgEnum("purpose", ["exam_application", "college_admission", "scholarship", "kyc_financial", "employment", "healthcare", "housing", "government_scheme", "age_verification_only", "identity_verification_only"]);
export const appStatus = pgEnum("application_status", ["draft", "submitted", "under_review", "shortlisted", "accepted", "rejected", "withdrawn", "enrolled"]);
export const appSource = pgEnum("application_source", ["sdk", "extension", "manual"]);
export const appKind = pgEnum("application_kind", ["exam", "admission", "scholarship", "job", "kyc", "healthcare", "scheme", "other"]);
export const partnerKind = pgEnum("partner_kind", ["exam_board", "university", "school", "employer", "bank", "hospital", "government", "other"]);
export const partnerStatus = pgEnum("partner_status", ["pending", "verified", "suspended"]);
export const partnerRole = pgEnum("partner_role", ["owner", "admin", "developer", "reviewer"]);
export const keyEnv = pgEnum("key_env", ["sandbox", "live"]);
export const dataRequestKind = pgEnum("data_request_kind", ["export", "erase", "correct"]);

// ---------- profiles ----------
export const profiles = pgTable("profiles", {
  id: id(),
  ownerUserId: text("owner_user_id").notNull().references(() => user.id, { onDelete: "cascade" }),
  kind: profileKind("kind").notNull().default("self"),
  displayName: text("display_name").notNull(),
  dobYear: integer("dob_year"),
  avatarDocId: uuid("avatar_doc_id"),
  claimedByUserId: text("claimed_by_user_id").references(() => user.id), // dependent who took over at 18
  status: text("status").notNull().default("active"),
  createdAt: createdAt(),
}, (t) => [
  index("profiles_owner_idx").on(t.ownerUserId),
  index("profiles_claimed_status_idx").on(t.claimedByUserId, t.status),
]);

export const relations = pgTable("relations", {
  id: id(),
  guardianProfileId: uuid("guardian_profile_id").notNull().references(() => profiles.id, { onDelete: "cascade" }),
  wardProfileId: uuid("ward_profile_id").notNull().references(() => profiles.id, { onDelete: "cascade" }),
  relation: text("relation").notNull(),      // father|mother|guardian|child|... (RELATION enum in schema pkg)
  basis: relationBasis("basis").notNull(),
  scope: text("scope").array().notNull().default(sql`'{*}'::text[]`), // sections or '*'
  validUntil: ts("valid_until"),
  createdAt: createdAt(),
}, (t) => [
  uniqueIndex("relations_pair_uq").on(t.guardianProfileId, t.wardProfileId),
  index("relations_ward_idx").on(t.wardProfileId),
]);

// ---------- facts ----------
export const facts = pgTable("facts", {
  id: id(),
  profileId: uuid("profile_id").notNull().references(() => profiles.id, { onDelete: "cascade" }),
  factKey: text("fact_key").notNull(),
  repeatIndex: integer("repeat_index").notNull().default(0),
  valueJson: jsonb("value_json"),
  valueEnc: bytea("value_enc"),
  isSensitive: boolean("is_sensitive").notNull().default(false),
  source: factSource("source").notNull(),
  verifiedBy: text("verified_by"),
  evidenceDocumentId: uuid("evidence_document_id"),
  verifiedAt: ts("verified_at"),
  expiresAt: ts("expires_at"),
  confidence: real("confidence"),
  updatedAt: updatedAt(),
  updatedBy: text("updated_by"),
}, (t) => [
  uniqueIndex("facts_profile_key_idx_uq").on(t.profileId, t.factKey, t.repeatIndex),
  index("facts_expires_idx").on(t.expiresAt),
]);

export const factHistory = pgTable("fact_history", {
  id: id(),
  factId: uuid("fact_id").notNull().references(() => facts.id, { onDelete: "cascade" }),
  oldValueEnc: bytea("old_value_enc"),
  newValueEnc: bytea("new_value_enc"),
  oldSource: factSource("old_source"),
  changedBy: text("changed_by"),
  reason: text("reason"),
  changedAt: createdAt(),
});

// ---------- documents ----------
export const documents = pgTable("documents", {
  id: id(),
  profileId: uuid("profile_id").notNull().references(() => profiles.id, { onDelete: "cascade" }),
  docType: text("doc_type").notNull(),          // aadhaar | pan | marksheet_10 | marksheet_12 | category_cert | ...
  title: text("title").notNull(),
  issuerId: text("issuer_id"),
  issuerName: text("issuer_name"),
  docUri: text("doc_uri"),                       // DigiLocker URI
  storageKey: text("storage_key"),
  mime: text("mime").notNull().default("application/pdf"),
  size: integer("size").notNull().default(0),
  sha256: text("sha256"),
  origin: docOrigin("origin").notNull(),
  issuedAt: ts("issued_at"),
  validUntil: ts("valid_until"),
  status: docStatus("status").notNull().default("pending"),
  meta: jsonb("meta").$type<Record<string, unknown>>().default({}),
  createdAt: createdAt(),
}, (t) => [index("documents_profile_idx").on(t.profileId)]);

export const documentExtractions = pgTable("document_extractions", {
  id: id(),
  documentId: uuid("document_id").notNull().references(() => documents.id, { onDelete: "cascade" }),
  provider: text("provider").notNull(),
  rawJson: jsonb("raw_json"),
  proposedFacts: jsonb("proposed_facts").$type<{ key: string; value: unknown; confidence: number }[]>().notNull().default([]),
  confidence: real("confidence"),
  reviewedAt: ts("reviewed_at"),
  reviewedBy: text("reviewed_by"),
  createdAt: createdAt(),
}, (t) => [index("document_extractions_document_idx").on(t.documentId, t.reviewedAt)]);

// ---------- verification ----------
export const providerLinks = pgTable("provider_links", {
  id: id(),
  userId: text("user_id").notNull().references(() => user.id, { onDelete: "cascade" }),
  provider: providerName("provider").notNull(),
  providerRefEnc: bytea("provider_ref_enc"),
  status: text("status").notNull().default("linked"),
  linkedAt: createdAt(),
  lastSyncAt: ts("last_sync_at"),
  meta: jsonb("meta").$type<Record<string, unknown>>().default({}),
}, (t) => [uniqueIndex("provider_links_user_provider_uq").on(t.userId, t.provider)]);

export const verificationJobs = pgTable("verification_jobs", {
  id: id(),
  profileId: uuid("profile_id").notNull().references(() => profiles.id, { onDelete: "cascade" }),
  provider: providerName("provider").notNull(),
  kind: text("kind").notNull(),                  // sync | verify_pan | ocr | ...
  inputJson: jsonb("input_json"),
  status: jobStatus("status").notNull().default("queued"),
  progress: jsonb("progress").$type<{ step: string; pct: number; log: string[] }>().default({ step: "queued", pct: 0, log: [] }),
  resultJson: jsonb("result_json"),
  error: text("error"),
  createdAt: createdAt(),
  finishedAt: ts("finished_at"),
}, (t) => [index("verification_jobs_profile_idx").on(t.profileId)]);

export const mismatches = pgTable("mismatches", {
  id: id(),
  profileId: uuid("profile_id").notNull().references(() => profiles.id, { onDelete: "cascade" }),
  factKey: text("fact_key").notNull(),
  sourceA: text("source_a").notNull(),
  valueA: text("value_a").notNull(),
  sourceB: text("source_b").notNull(),
  valueB: text("value_b").notNull(),
  severity: text("severity").notNull().default("medium"),
  resolvedAt: ts("resolved_at"),
  resolution: text("resolution"),
  createdAt: createdAt(),
}, (t) => [index("mismatches_profile_resolved_idx").on(t.profileId, t.resolvedAt)]);

// ---------- partners ----------
export const partners = pgTable("partners", {
  id: id(),
  slug: text("slug").notNull().unique(),
  name: text("name").notNull(),
  legalName: text("legal_name"),
  kind: partnerKind("kind").notNull(),
  regNo: text("reg_no"),
  regType: text("reg_type"),
  website: text("website"),
  logoUrl: text("logo_url"),
  dpoEmail: text("dpo_email"),
  status: partnerStatus("status").notNull().default("pending"),
  retentionDays: integer("retention_days").notNull().default(365),
  createdAt: createdAt(),
});

export const partnerMembers = pgTable("partner_members", {
  partnerId: uuid("partner_id").notNull().references(() => partners.id, { onDelete: "cascade" }),
  userId: text("user_id").notNull().references(() => user.id, { onDelete: "cascade" }),
  role: partnerRole("role").notNull().default("developer"),
  createdAt: createdAt(),
}, (t) => [primaryKey({ columns: [t.partnerId, t.userId] })]);

export const partnerApiKeys = pgTable("partner_api_keys", {
  id: id(),
  partnerId: uuid("partner_id").notNull().references(() => partners.id, { onDelete: "cascade" }),
  env: keyEnv("env").notNull().default("sandbox"),
  keyHash: text("key_hash").notNull().unique(),
  prefix: text("prefix").notNull(),
  label: text("label"),
  createdAt: createdAt(),
  revokedAt: ts("revoked_at"),
  lastUsedAt: ts("last_used_at"),
});

export const forms = pgTable("forms", {
  id: id(),
  partnerId: uuid("partner_id").notNull().references(() => partners.id, { onDelete: "cascade" }),
  slug: text("slug").notNull().unique(),
  name: text("name").notNull(),
  description: text("description"),
  purpose: purposeEnum("purpose").notNull(),
  kind: appKind("kind").notNull().default("other"),
  requestedFields: jsonb("requested_fields").$type<{ key: string; required: boolean }[]>().notNull().default([]),
  customFields: jsonb("custom_fields").$type<import("@applyonce/schema").CustomField[]>().notNull().default([]),
  retentionDays: integer("retention_days").notNull().default(365),
  redirectUrl: text("redirect_url").notNull(),
  webhookUrl: text("webhook_url"),
  deadlineAt: ts("deadline_at"),
  status: text("status").notNull().default("live"),
  version: integer("version").notNull().default(1),
  createdAt: createdAt(),
}, (t) => [index("forms_partner_idx").on(t.partnerId)]);

export const partnerWebhooks = pgTable("partner_webhooks", {
  id: id(),
  partnerId: uuid("partner_id").notNull().references(() => partners.id, { onDelete: "cascade" }),
  url: text("url").notNull(),
  secretEnc: bytea("secret_enc").notNull(),
  events: text("events").array().notNull().default(sql`'{share.completed,consent.revoked,verification.updated,application.withdrawn}'::text[]`),
  active: boolean("active").notNull().default(true),
  createdAt: createdAt(),
});

export const webhookDeliveries = pgTable("webhook_deliveries", {
  id: id(),
  webhookId: uuid("webhook_id").notNull().references(() => partnerWebhooks.id, { onDelete: "cascade" }),
  event: text("event").notNull(),
  payload: jsonb("payload").notNull(),
  status: text("status").notNull().default("pending"),
  attempts: integer("attempts").notNull().default(0),
  lastError: text("last_error"),
  responseStatus: integer("response_status"),
  nextRetryAt: ts("next_retry_at"),
  createdAt: createdAt(),
}, (t) => [index("webhook_deliveries_status_idx").on(t.status, t.nextRetryAt)]);

// ---------- consent & sharing ----------
export const shareSessions = pgTable("share_sessions", {
  id: id(),
  partnerId: uuid("partner_id").notNull().references(() => partners.id, { onDelete: "cascade" }),
  formId: uuid("form_id").notNull().references(() => forms.id, { onDelete: "cascade" }),
  token: text("token").notNull().unique(),       // in share_url
  returnUrl: text("return_url").notNull(),
  state: text("state"),
  env: keyEnv("env").notNull().default("sandbox"),
  status: text("status").notNull().default("open"), // open | consented | exchanged | expired | cancelled
  profileId: uuid("profile_id"),
  expiresAt: ts("expires_at").notNull(),
  createdAt: createdAt(),
});

export const consents = pgTable("consents", {
  id: id(),
  profileId: uuid("profile_id").notNull().references(() => profiles.id, { onDelete: "cascade" }),
  grantedByUserId: text("granted_by_user_id").notNull().references(() => user.id),
  partnerId: uuid("partner_id").notNull().references(() => partners.id),
  formId: uuid("form_id").references(() => forms.id),
  purpose: purposeEnum("purpose").notNull(),
  scope: text("scope").array().notNull(),
  grantedAt: createdAt(),
  expiresAt: ts("expires_at").notNull(),
  revokedAt: ts("revoked_at"),
  stepUpMethod: text("step_up_method").notNull(),
  ipHash: text("ip_hash"),
}, (t) => [index("consents_profile_partner_idx").on(t.profileId, t.partnerId)]);

export const applications = pgTable("applications", {
  id: id(),
  profileId: uuid("profile_id").notNull().references(() => profiles.id, { onDelete: "cascade" }),
  partnerId: uuid("partner_id").references(() => partners.id),
  formId: uuid("form_id").references(() => forms.id),
  title: text("title").notNull(),
  orgName: text("org_name").notNull(),
  kind: appKind("kind").notNull().default("other"),
  externalRef: text("external_ref"),
  status: appStatus("status").notNull().default("draft"),
  deadlineAt: ts("deadline_at"),
  submittedAt: ts("submitted_at"),
  source: appSource("source").notNull().default("manual"),
  portalUrl: text("portal_url"),
  createdAt: createdAt(),
  updatedAt: updatedAt(),
}, (t) => [
  index("applications_profile_status_idx").on(t.profileId, t.status, t.deadlineAt),
  index("applications_profile_updated_idx").on(t.profileId, t.updatedAt),
]);

export const shares = pgTable("shares", {
  id: id(),
  consentId: uuid("consent_id").notNull().references(() => consents.id),   // INVARIANT: never null; trigger checks validity
  applicationId: uuid("application_id").references(() => applications.id),
  shareSessionId: uuid("share_session_id").references(() => shareSessions.id),
  sharedKeys: text("shared_keys").array().notNull(),
  payloadHash: text("payload_hash").notNull(),
  payloadEnc: bytea("payload_enc").notNull(),                                  // JWS, encrypted with a system key
  shareTokenHash: text("share_token_hash").notNull().unique(),
  exchangedAt: ts("exchanged_at"),
  expiresAt: ts("expires_at").notNull(),
  createdAt: createdAt(),
}, (t) => [
  index("shares_application_idx").on(t.applicationId),
  index("shares_consent_idx").on(t.consentId),
]);

export const applicationEvents = pgTable("application_events", {
  id: id(),
  applicationId: uuid("application_id").notNull().references(() => applications.id, { onDelete: "cascade" }),
  type: text("type").notNull(),                 // created | status | note | document | reminder
  title: text("title").notNull(),
  body: text("body"),
  actor: text("actor").notNull().default("system"), // citizen | partner | system
  meta: jsonb("meta").$type<Record<string, unknown>>().default({}),
  createdAt: createdAt(),
}, (t) => [index("application_events_app_idx").on(t.applicationId)]);

export const applicationDocuments = pgTable("application_documents", {
  applicationId: uuid("application_id").notNull().references(() => applications.id, { onDelete: "cascade" }),
  documentId: uuid("document_id").notNull().references(() => documents.id, { onDelete: "cascade" }),
  label: text("label"),
}, (t) => [primaryKey({ columns: [t.applicationId, t.documentId] })]);

export const partnerStatusPushes = pgTable("partner_status_pushes", {
  id: id(),
  partnerId: uuid("partner_id").notNull().references(() => partners.id),
  applicationId: uuid("application_id").notNull().references(() => applications.id, { onDelete: "cascade" }),
  status: appStatus("status").notNull(),
  note: text("note"),
  idempotencyKey: text("idempotency_key").notNull().unique(),
  createdAt: createdAt(),
});

export const verificationRequests = pgTable("verification_requests", {
  id: id(),
  partnerId: uuid("partner_id").notNull().references(() => partners.id),
  applicationId: uuid("application_id").notNull().references(() => applications.id, { onDelete: "cascade" }),
  factKeys: text("fact_keys").array().notNull(),
  reason: text("reason"),
  status: text("status").notNull().default("open"),
  createdAt: createdAt(),
  resolvedAt: ts("resolved_at"),
});

export const dataRequests = pgTable("data_requests", {
  id: id(),
  userId: text("user_id").notNull().references(() => user.id, { onDelete: "cascade" }),
  kind: dataRequestKind("kind").notNull(),
  status: text("status").notNull().default("pending"),
  resultStorageKey: text("result_storage_key"),
  notes: text("notes"),
  requestedAt: createdAt(),
  fulfilledAt: ts("fulfilled_at"),
}, (t) => [index("data_requests_user_requested_idx").on(t.userId, t.requestedAt)]);

// ---------- notifications & audit ----------
export const notifications = pgTable("notifications", {
  id: id(),
  userId: text("user_id").notNull().references(() => user.id, { onDelete: "cascade" }),
  category: text("category").notNull(),        // application | verification | expiry | consent | system
  title: text("title").notNull(),
  body: text("body"),
  link: text("link"),
  readAt: ts("read_at"),
  createdAt: createdAt(),
}, (t) => [index("notifications_user_idx").on(t.userId, t.readAt)]);

export const notificationPrefs = pgTable("notification_prefs", {
  userId: text("user_id").notNull().references(() => user.id, { onDelete: "cascade" }),
  channel: text("channel").notNull(),          // inapp | sms | email | push | whatsapp
  category: text("category").notNull(),
  enabled: boolean("enabled").notNull().default(true),
}, (t) => [primaryKey({ columns: [t.userId, t.channel, t.category] })]);

export const notificationDeliveries = pgTable("notification_deliveries", {
  id: id(),
  notificationId: uuid("notification_id").notNull().references(() => notifications.id, { onDelete: "cascade" }),
  channel: text("channel").notNull(),
  providerMsgId: text("provider_msg_id"),
  status: text("status").notNull().default("sent"),
  error: text("error"),
  createdAt: createdAt(),
});

export const auditLog = pgTable("audit_log", {
  id: bigserial("id", { mode: "number" }).primaryKey(),
  at: createdAt(),
  actorUserId: text("actor_user_id"),
  actorPartnerId: uuid("actor_partner_id"),
  action: text("action").notNull(),
  targetType: text("target_type").notNull(),
  targetId: text("target_id"),
  meta: jsonb("meta").$type<Record<string, unknown>>().default({}),
  prevHash: text("prev_hash"),
  hash: text("hash").notNull(),
}, (t) => [index("audit_log_at_idx").on(t.at), index("audit_log_actor_idx").on(t.actorUserId)]);

export const flags = pgTable("flags", {
  key: text("key").primaryKey(),
  enabled: boolean("enabled").notNull().default(false),
  rollout: jsonb("rollout").$type<Record<string, unknown>>().default({}),
});

export const systemKeys = pgTable("system_keys", {
  kid: text("kid").primaryKey(),
  kind: text("kind").notNull(),                 // jws_es256 | payload_aes
  privateJwkEnc: bytea("private_jwk_enc").notNull(),
  publicJwk: jsonb("public_jwk"),
  active: boolean("active").notNull().default(true),
  createdAt: createdAt(),
});

export const idempotencyKeys = pgTable("idempotency_keys", {
  key: text("key").primaryKey(),
  scope: text("scope").notNull(),
  responseJson: jsonb("response_json"),
  createdAt: createdAt(),
});
