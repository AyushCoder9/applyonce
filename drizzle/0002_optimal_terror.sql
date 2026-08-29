CREATE TYPE "public"."partner_consent_method" AS ENUM('otp', 'passkey', 'biometric', 'manual');--> statement-breakpoint
CREATE TABLE "partner_consents" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"form_id" uuid NOT NULL,
	"submission_id" uuid NOT NULL,
	"profile_id" uuid,
	"applicant_name" text NOT NULL,
	"applicant_email" text NOT NULL,
	"purpose" text NOT NULL,
	"scope" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"method" "partner_consent_method" DEFAULT 'manual' NOT NULL,
	"version" text DEFAULT '2026-08-30' NOT NULL,
	"consent_hash" text NOT NULL,
	"approved_at" timestamp with time zone DEFAULT now() NOT NULL,
	"revoked_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "partner_submissions" DROP CONSTRAINT "partner_submissions_consent_id_consents_id_fk";
--> statement-breakpoint
ALTER TABLE "partner_submissions" ADD COLUMN "partner_consent_id" uuid;--> statement-breakpoint
ALTER TABLE "partner_consents" ADD CONSTRAINT "partner_consents_form_id_partner_forms_id_fk" FOREIGN KEY ("form_id") REFERENCES "public"."partner_forms"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "partner_consents" ADD CONSTRAINT "partner_consents_profile_id_profiles_id_fk" FOREIGN KEY ("profile_id") REFERENCES "public"."profiles"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "partner_consents_form_idx" ON "partner_consents" USING btree ("form_id","created_at");--> statement-breakpoint
CREATE INDEX "partner_consents_profile_idx" ON "partner_consents" USING btree ("profile_id","created_at");--> statement-breakpoint
CREATE INDEX "partner_consents_submission_idx" ON "partner_consents" USING btree ("submission_id");--> statement-breakpoint
ALTER TABLE "partner_submissions" ADD CONSTRAINT "partner_submissions_partner_consent_id_partner_consents_id_fk" FOREIGN KEY ("partner_consent_id") REFERENCES "public"."partner_consents"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "partner_submissions" DROP COLUMN "consent_id";