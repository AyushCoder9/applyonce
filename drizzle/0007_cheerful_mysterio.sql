CREATE TABLE "partner_form_versions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"form_id" uuid NOT NULL,
	"organization_id" uuid NOT NULL,
	"version" integer NOT NULL,
	"name" text NOT NULL,
	"description" text NOT NULL,
	"category" text NOT NULL,
	"purpose" text NOT NULL,
	"form_schema" jsonb NOT NULL,
	"branding" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"published_by_clerk_user_id" text NOT NULL,
	"published_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "organizations" ADD COLUMN "status" text DEFAULT 'approved' NOT NULL;--> statement-breakpoint
ALTER TABLE "organizations" ADD COLUMN "contact_email" text;--> statement-breakpoint
ALTER TABLE "organizations" ADD COLUMN "verified_domain" text;--> statement-breakpoint
ALTER TABLE "organizations" ADD COLUMN "terms_accepted_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "partner_form_versions" ADD CONSTRAINT "partner_form_versions_form_id_partner_forms_id_fk" FOREIGN KEY ("form_id") REFERENCES "public"."partner_forms"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "partner_form_versions" ADD CONSTRAINT "partner_form_versions_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "partner_form_versions_form_version_idx" ON "partner_form_versions" USING btree ("form_id","version");--> statement-breakpoint
CREATE INDEX "partner_form_versions_org_idx" ON "partner_form_versions" USING btree ("organization_id","published_at");--> statement-breakpoint
INSERT INTO "partner_form_versions" (
	"form_id",
	"organization_id",
	"version",
	"name",
	"description",
	"category",
	"purpose",
	"form_schema",
	"branding",
	"published_by_clerk_user_id",
	"published_at"
)
SELECT
	"id",
	"organization_id",
	"version",
	"name",
	"description",
	"category",
	"purpose",
	"form_schema",
	"branding",
	"created_by_clerk_user_id",
	COALESCE("published_at", "updated_at")
FROM "partner_forms"
WHERE "status" = 'published'
ON CONFLICT ("form_id", "version") DO NOTHING;
