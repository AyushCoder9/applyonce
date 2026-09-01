CREATE TABLE "platform_audit_events" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"actor_clerk_user_id" text NOT NULL,
	"action" text NOT NULL,
	"target_type" text NOT NULL,
	"target_id" text NOT NULL,
	"metadata" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE INDEX "platform_audit_events_actor_idx" ON "platform_audit_events" USING btree ("actor_clerk_user_id","created_at");--> statement-breakpoint
CREATE INDEX "platform_audit_events_target_idx" ON "platform_audit_events" USING btree ("target_type","target_id","created_at");