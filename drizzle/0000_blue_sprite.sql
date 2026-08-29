CREATE TYPE "public"."application_status" AS ENUM('draft', 'needs_action', 'ready', 'submitted', 'accepted', 'rejected');--> statement-breakpoint
CREATE TYPE "public"."consent_method" AS ENUM('otp', 'passkey', 'biometric', 'manual');--> statement-breakpoint
CREATE TYPE "public"."document_status" AS ENUM('verified', 'pending', 'expired', 'revoked');--> statement-breakpoint
CREATE TYPE "public"."field_state" AS ENUM('prefilled', 'needs_confirmation', 'missing', 'confirmed');--> statement-breakpoint
CREATE TYPE "public"."notification_channel" AS ENUM('in_app', 'email');--> statement-breakpoint
CREATE TYPE "public"."notification_status" AS ENUM('queued', 'sent', 'failed');--> statement-breakpoint
CREATE TYPE "public"."source_provider" AS ENUM('meripehchaan', 'digilocker', 'apaar', 'manual');--> statement-breakpoint
CREATE TYPE "public"."source_status" AS ENUM('connected', 'attention', 'disconnected');--> statement-breakpoint
CREATE TABLE "application_events" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"profile_id" uuid NOT NULL,
	"application_id" uuid,
	"event_type" text NOT NULL,
	"title" text NOT NULL,
	"description" text NOT NULL,
	"metadata" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"occurred_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "application_fields" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"application_id" uuid NOT NULL,
	"requirement_id" uuid NOT NULL,
	"requirement_key" text NOT NULL,
	"label" text NOT NULL,
	"value_text" text,
	"source_label" text,
	"state" "field_state" DEFAULT 'missing' NOT NULL,
	"confidence" integer,
	"shared_with_recipient" boolean DEFAULT false NOT NULL,
	"user_confirmed_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "application_requirements" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"template_id" uuid NOT NULL,
	"key" text NOT NULL,
	"label" text NOT NULL,
	"data_type" text DEFAULT 'text' NOT NULL,
	"required" boolean DEFAULT true NOT NULL,
	"source_key" text,
	"source_provider" "source_provider",
	"needs_user_decision" boolean DEFAULT false NOT NULL,
	"validation" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "application_templates" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"slug" text NOT NULL,
	"name" text NOT NULL,
	"external_portal_name" text NOT NULL,
	"description" text NOT NULL,
	"category" text NOT NULL,
	"field_count" integer NOT NULL,
	"deadline" date,
	"active" boolean DEFAULT true NOT NULL,
	"metadata" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "application_templates_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "applications" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"profile_id" uuid NOT NULL,
	"template_id" uuid NOT NULL,
	"status" "application_status" DEFAULT 'draft' NOT NULL,
	"external_application_id" text,
	"readiness_score" integer DEFAULT 0 NOT NULL,
	"ready_field_count" integer DEFAULT 0 NOT NULL,
	"total_field_count" integer DEFAULT 0 NOT NULL,
	"receipt_code" text,
	"submitted_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "applications_receipt_code_unique" UNIQUE("receipt_code")
);
--> statement-breakpoint
CREATE TABLE "consents" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"profile_id" uuid NOT NULL,
	"application_id" uuid NOT NULL,
	"purpose" text NOT NULL,
	"scope" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"method" "consent_method" DEFAULT 'manual' NOT NULL,
	"version" text DEFAULT '2026-08-01' NOT NULL,
	"consent_hash" text NOT NULL,
	"approved_at" timestamp with time zone DEFAULT now() NOT NULL,
	"revoked_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "documents" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"profile_id" uuid NOT NULL,
	"source_connection_id" uuid,
	"title" text NOT NULL,
	"document_type" text NOT NULL,
	"provider" "source_provider" NOT NULL,
	"status" "document_status" DEFAULT 'pending' NOT NULL,
	"masked_identifier" text,
	"issued_at" date,
	"expires_at" date,
	"storage_key" text,
	"checksum" text,
	"metadata" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "notifications" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"profile_id" uuid NOT NULL,
	"application_id" uuid,
	"channel" "notification_channel" DEFAULT 'in_app' NOT NULL,
	"type" text NOT NULL,
	"status" "notification_status" DEFAULT 'queued' NOT NULL,
	"recipient" text,
	"subject" text NOT NULL,
	"body" text NOT NULL,
	"provider" text DEFAULT 'database_outbox' NOT NULL,
	"provider_message_id" text,
	"last_error" text,
	"sent_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "profile_claims" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"profile_id" uuid NOT NULL,
	"source_connection_id" uuid,
	"key" text NOT NULL,
	"label" text NOT NULL,
	"value_text" text NOT NULL,
	"sensitivity" text DEFAULT 'personal' NOT NULL,
	"confidence" integer DEFAULT 100 NOT NULL,
	"verified_at" timestamp with time zone,
	"expires_at" timestamp with time zone,
	"metadata" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "profiles" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"clerk_user_id" text NOT NULL,
	"email" text NOT NULL,
	"full_name" text NOT NULL,
	"phone" text,
	"date_of_birth" date,
	"city" text,
	"state" text,
	"category" text,
	"annual_income_paise" integer,
	"metadata" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "profiles_clerk_user_id_unique" UNIQUE("clerk_user_id")
);
--> statement-breakpoint
CREATE TABLE "source_connections" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"profile_id" uuid NOT NULL,
	"provider" "source_provider" NOT NULL,
	"display_name" text NOT NULL,
	"status" "source_status" DEFAULT 'connected' NOT NULL,
	"scopes" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"last_verified_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "application_events" ADD CONSTRAINT "application_events_profile_id_profiles_id_fk" FOREIGN KEY ("profile_id") REFERENCES "public"."profiles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "application_events" ADD CONSTRAINT "application_events_application_id_applications_id_fk" FOREIGN KEY ("application_id") REFERENCES "public"."applications"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "application_fields" ADD CONSTRAINT "application_fields_application_id_applications_id_fk" FOREIGN KEY ("application_id") REFERENCES "public"."applications"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "application_fields" ADD CONSTRAINT "application_fields_requirement_id_application_requirements_id_fk" FOREIGN KEY ("requirement_id") REFERENCES "public"."application_requirements"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "application_requirements" ADD CONSTRAINT "application_requirements_template_id_application_templates_id_fk" FOREIGN KEY ("template_id") REFERENCES "public"."application_templates"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "applications" ADD CONSTRAINT "applications_profile_id_profiles_id_fk" FOREIGN KEY ("profile_id") REFERENCES "public"."profiles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "applications" ADD CONSTRAINT "applications_template_id_application_templates_id_fk" FOREIGN KEY ("template_id") REFERENCES "public"."application_templates"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "consents" ADD CONSTRAINT "consents_profile_id_profiles_id_fk" FOREIGN KEY ("profile_id") REFERENCES "public"."profiles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "consents" ADD CONSTRAINT "consents_application_id_applications_id_fk" FOREIGN KEY ("application_id") REFERENCES "public"."applications"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "documents" ADD CONSTRAINT "documents_profile_id_profiles_id_fk" FOREIGN KEY ("profile_id") REFERENCES "public"."profiles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "documents" ADD CONSTRAINT "documents_source_connection_id_source_connections_id_fk" FOREIGN KEY ("source_connection_id") REFERENCES "public"."source_connections"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_profile_id_profiles_id_fk" FOREIGN KEY ("profile_id") REFERENCES "public"."profiles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_application_id_applications_id_fk" FOREIGN KEY ("application_id") REFERENCES "public"."applications"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "profile_claims" ADD CONSTRAINT "profile_claims_profile_id_profiles_id_fk" FOREIGN KEY ("profile_id") REFERENCES "public"."profiles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "profile_claims" ADD CONSTRAINT "profile_claims_source_connection_id_source_connections_id_fk" FOREIGN KEY ("source_connection_id") REFERENCES "public"."source_connections"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "source_connections" ADD CONSTRAINT "source_connections_profile_id_profiles_id_fk" FOREIGN KEY ("profile_id") REFERENCES "public"."profiles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "application_events_profile_idx" ON "application_events" USING btree ("profile_id","occurred_at");--> statement-breakpoint
CREATE INDEX "application_events_application_idx" ON "application_events" USING btree ("application_id","occurred_at");--> statement-breakpoint
CREATE UNIQUE INDEX "application_fields_application_key_idx" ON "application_fields" USING btree ("application_id","requirement_key");--> statement-breakpoint
CREATE INDEX "application_fields_application_idx" ON "application_fields" USING btree ("application_id");--> statement-breakpoint
CREATE UNIQUE INDEX "application_requirements_template_key_idx" ON "application_requirements" USING btree ("template_id","key");--> statement-breakpoint
CREATE INDEX "application_requirements_template_idx" ON "application_requirements" USING btree ("template_id");--> statement-breakpoint
CREATE INDEX "application_templates_active_idx" ON "application_templates" USING btree ("active");--> statement-breakpoint
CREATE INDEX "applications_profile_idx" ON "applications" USING btree ("profile_id");--> statement-breakpoint
CREATE INDEX "applications_status_idx" ON "applications" USING btree ("profile_id","status");--> statement-breakpoint
CREATE INDEX "consents_profile_idx" ON "consents" USING btree ("profile_id");--> statement-breakpoint
CREATE INDEX "consents_application_idx" ON "consents" USING btree ("application_id");--> statement-breakpoint
CREATE INDEX "documents_profile_idx" ON "documents" USING btree ("profile_id");--> statement-breakpoint
CREATE INDEX "notifications_profile_idx" ON "notifications" USING btree ("profile_id","created_at");--> statement-breakpoint
CREATE INDEX "profile_claims_profile_idx" ON "profile_claims" USING btree ("profile_id");--> statement-breakpoint
CREATE INDEX "profile_claims_key_idx" ON "profile_claims" USING btree ("profile_id","key");--> statement-breakpoint
CREATE INDEX "profiles_email_idx" ON "profiles" USING btree ("email");--> statement-breakpoint
CREATE UNIQUE INDEX "source_connections_profile_provider_idx" ON "source_connections" USING btree ("profile_id","provider");--> statement-breakpoint
CREATE INDEX "source_connections_profile_idx" ON "source_connections" USING btree ("profile_id");