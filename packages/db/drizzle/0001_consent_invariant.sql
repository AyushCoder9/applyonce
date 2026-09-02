-- INVARIANT: a share can only exist for a valid, unrevoked, unexpired consent whose scope covers every shared key.
CREATE OR REPLACE FUNCTION shares_consent_guard() RETURNS trigger AS $$
DECLARE c consents%ROWTYPE;
BEGIN
  SELECT * INTO c FROM consents WHERE id = NEW.consent_id;
  IF NOT FOUND THEN RAISE EXCEPTION 'PRAMAN_NO_CONSENT: share requires a consent row'; END IF;
  IF c.revoked_at IS NOT NULL THEN RAISE EXCEPTION 'PRAMAN_CONSENT_REVOKED'; END IF;
  IF c.expires_at < now() THEN RAISE EXCEPTION 'PRAMAN_CONSENT_EXPIRED'; END IF;
  IF NOT (NEW.shared_keys <@ c.scope) THEN RAISE EXCEPTION 'PRAMAN_SCOPE_EXCEEDED: shared keys not within consent scope'; END IF;
  RETURN NEW;
END $$ LANGUAGE plpgsql;
--> statement-breakpoint
DROP TRIGGER IF EXISTS shares_consent_guard ON shares;
--> statement-breakpoint
CREATE TRIGGER shares_consent_guard BEFORE INSERT OR UPDATE OF consent_id, shared_keys ON shares FOR EACH ROW EXECUTE FUNCTION shares_consent_guard();
--> statement-breakpoint
-- audit_log is append-only
CREATE OR REPLACE FUNCTION audit_log_immutable() RETURNS trigger AS $$
BEGIN RAISE EXCEPTION 'PRAMAN_AUDIT_IMMUTABLE'; END $$ LANGUAGE plpgsql;
--> statement-breakpoint
DROP TRIGGER IF EXISTS audit_log_immutable ON audit_log;
--> statement-breakpoint
CREATE TRIGGER audit_log_immutable BEFORE UPDATE OR DELETE ON audit_log FOR EACH ROW EXECUTE FUNCTION audit_log_immutable();
