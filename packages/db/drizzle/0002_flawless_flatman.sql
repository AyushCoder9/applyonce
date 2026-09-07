CREATE INDEX "applications_profile_updated_idx" ON "applications" USING btree ("profile_id","updated_at");--> statement-breakpoint
CREATE INDEX "data_requests_user_requested_idx" ON "data_requests" USING btree ("user_id","created_at");--> statement-breakpoint
CREATE INDEX "document_extractions_document_idx" ON "document_extractions" USING btree ("document_id","reviewed_at");--> statement-breakpoint
CREATE INDEX "mismatches_profile_resolved_idx" ON "mismatches" USING btree ("profile_id","resolved_at");--> statement-breakpoint
CREATE INDEX "profiles_claimed_status_idx" ON "profiles" USING btree ("claimed_by_user_id","status");--> statement-breakpoint
CREATE INDEX "relations_ward_idx" ON "relations" USING btree ("ward_profile_id");--> statement-breakpoint
CREATE INDEX "shares_application_idx" ON "shares" USING btree ("application_id");--> statement-breakpoint
CREATE INDEX "shares_consent_idx" ON "shares" USING btree ("consent_id");