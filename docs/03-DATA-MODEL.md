# 03 — Data model

## 1. Canonical Citizen Schema (`packages/schema`)
Facts are stored as **typed rows**, not one giant JSON, so each carries its own provenance and can be shared individually. The registry below is the single source of truth: it generates zod validators, DB `fact_key` enum, partner form-builder options, extension field maps, and i18n labels.

Notation: `key : type · sources allowed · notes`

### identity
- `identity.full_name : string · aadhaar|pan|passport|self` · Aadhaar name is canonical; mismatches flagged
- `identity.first_name / middle_name / last_name : string · derived`
- `identity.dob : date · aadhaar|marksheet|passport|self`
- `identity.gender : enum(M,F,T,X) · aadhaar|self`
- `identity.photo : file_ref · aadhaar|self`
- `identity.nationality : enum · passport|self` (default IN)
- `identity.aadhaar_last4 : string(4) · aadhaar` · plus `aadhaar_ref_key`, `aadhaar_xml_hash` (system)
- `identity.pan : string · pan_verify|digilocker` · encrypted, masked `ABCDE****F` in UI
- `identity.voter_id : string · digilocker|self`
- `identity.passport_no / passport_expiry : string/date · digilocker|self`
- `identity.driving_licence_no / dl_expiry`
- `identity.apaar_id : string · apaar|self` · `identity.abha_id : string · abha`
- `identity.signature : file_ref · self` · `identity.blood_group : enum · self|abha`
- `identity.marital_status : enum · self`
- `identity.mother_tongue / languages_known : string[] · self`

### contact
- `contact.mobile_primary : phone · otp_verified` · `contact.mobile_secondary`
- `contact.email_primary : email · verified` · `contact.email_secondary`
- `contact.whatsapp_optin : bool`

### address (repeating, role-tagged)
- `address.{role}` where role ∈ `permanent | current | correspondence` · structured: `line1, line2, landmark, village_town, district, state, pincode, country, since` · sources `aadhaar|self|utility_bill`

### family (repeating relation rows; each relation may link to a real profile)
- `family.father.{name, occupation, mobile, email, education, annual_income, is_alive}`
- `family.mother.{…}` · `family.guardian.{…, relation}` · `family.spouse.{…}`
- `family.siblings[] : {name, dob}`
- `family.annual_income_total : money · self|itr|aa` · `family.income_certificate : file_ref · digilocker|upload`

### category & eligibility
- `category.social : enum(GEN, EWS, OBC-NCL, OBC-CL, SC, ST) · certificate`
- `category.certificate_no / issue_date / valid_until / issuing_authority` · expiry reminders
- `category.pwd : bool · udid` + `pwd_type, pwd_percentage, udid_no, scribe_required`
- `category.ex_serviceman_ward, kashmiri_migrant, defence_ward, single_girl_child, minority : bool`
- `category.domicile_state : enum · certificate|self` + `domicile_certificate`
- `category.religion : enum · self` (optional; only shareable with explicit purpose)

### education (repeating rows by `level`)
- `education.class10.{board, school_name, school_udise, year, roll_no, medium, total_marks, obtained_marks, percentage, cgpa, subjects[] {name, marks, max}}` · sources `digilocker_cbse|upload_ocr|self`
- `education.class12.{…, stream, pcm_pct, pcb_pct, subjects[]}`
- `education.graduation[] {university, college, aishe_code, degree, branch, start_year, end_year, cgpa, percentage, backlogs, status}`
- `education.postgrad[]`, `education.diploma[]`, `education.gap_years : {years, reason}`
- `education.exam_scores[] {exam (JEE_MAIN, NEET, CUET, GATE…), year, roll, score, percentile, rank, category_rank}`

### employment (repeating)
- `employment.current.{employer, designation, sector, start, ctc, uan, employee_id}` · `employment.history[]`
- `employment.experience_total_months : int · derived`

### health (opt-in section; strongest consent gating)
- `health.abha_id`, `health.blood_group`, `health.allergies[]`, `health.chronic_conditions[]`, `health.emergency_contacts[] {name, relation, phone}`, `health.insurance {insurer, policy_no, valid_until}`

### bank
- `bank.primary.{account_last4, ifsc, bank_name, holder_name, account_type}` · `penny_drop|self` · full account no encrypted, shared only under `payout` purpose

### preferences
- `prefs.language`, `prefs.exam_city_choices[]`, `prefs.notification_channels`

Each fact row also has system columns: `source`, `verified_by`, `evidence_document_id`, `verified_at`, `expires_at`, `confidence`, `updated_at`, `updated_by`.

## 2. Purposes & scopes (consent vocabulary)
`exam_application | college_admission | scholarship | kyc_financial | employment | healthcare | housing | government_scheme | age_verification_only | identity_verification_only`

A partner form declares purpose + requested `fact_keys`. Sensitive groups require explicit purpose: `health.*` → healthcare/insurance; `category.religion` → only when legally required; `bank.*` → payout/kyc_financial.

## 3. Postgres schema (Drizzle; abbreviated but complete in intent)
```sql
-- identity
users(id uuid pk, phone_hash text unique, phone_enc bytea, email_hash, email_enc, dek_wrapped bytea, locale text, status, created_at)
passkeys(id, user_id fk, credential_id bytea unique, public_key bytea, counter, transports text[], device_name, created_at, last_used_at)
sessions(id, user_id, device_id, ip_hash, ua, stepped_up_at timestamptz, expires_at)
otp_challenges(id, channel, target_hash, code_hash, attempts, expires_at, consumed_at)

-- profiles
profiles(id uuid pk, owner_user_id fk, kind enum('self','dependent'), display_name, dob_year int, avatar_doc_id, status, created_at)
relations(id, guardian_profile_id fk, ward_profile_id fk, relation enum, basis enum('minor','elder_consent','poa'), scope text[], valid_until, created_at, unique(guardian_profile_id, ward_profile_id))
facts(id uuid pk, profile_id fk, fact_key text, value_json jsonb, value_enc bytea, is_sensitive bool,
      source enum('self_declared','document_extracted','issuer_verified','provider_verified'),
      verified_by text, evidence_document_id fk, verified_at, expires_at, confidence real,
      updated_at, updated_by, unique(profile_id, fact_key, coalesce(repeat_index,0)))
addresses(id, profile_id, role enum, line1, line2, landmark, town, district, state, pincode, country, since, source, verified_at)
fact_history(id, fact_id, old_value_enc, new_value_enc, changed_by, changed_at, reason)

-- documents
documents(id uuid pk, profile_id fk, doc_type text, title, issuer_id, issuer_name, doc_uri, storage_key, mime, size, sha256, origin enum('digilocker','upload','generated'), issued_at, valid_until, status enum('pending','ready','rejected'), created_at)
document_extractions(id, document_id, provider, raw_json, proposed_facts jsonb, confidence, reviewed_at, reviewed_by)

-- verification
provider_links(id, user_id, provider enum, provider_ref_enc, status, linked_at, last_sync_at, meta jsonb)
verification_jobs(id, profile_id, provider, kind, input_json, status enum('queued','running','succeeded','failed'), result_json, error, created_at, finished_at)
mismatches(id, profile_id, fact_key, source_a, value_a, source_b, value_b, severity, resolved_at, resolution)

-- consent & sharing
consents(id uuid pk, profile_id fk, granted_by_user_id fk, partner_id fk, form_id fk, purpose enum, scope text[], granted_at, expires_at, revoked_at, step_up_method, ip_hash)
shares(id, consent_id fk NOT NULL, application_id fk, payload_hash, payload_jws_storage_key, share_token_hash unique, exchanged_at, expires_at, created_at)
data_requests(id, user_id, kind enum('export','erase','correct'), status, requested_at, fulfilled_at, notes)

-- applications
applications(id uuid pk, profile_id fk, partner_id fk null, form_id fk null, title, org_name, kind enum, external_ref, status enum('draft','submitted','under_review','shortlisted','accepted','rejected','withdrawn','enrolled'), deadline_at, submitted_at, source enum('sdk','extension','manual'), created_at)
application_events(id, application_id, type, title, body, actor enum('citizen','partner','system'), meta jsonb, created_at)
application_documents(application_id, document_id, label)

-- partners
partners(id uuid pk, name, legal_name, kind enum('exam_board','university','school','employer','bank','hospital','government','other'), reg_no, reg_type, website, status enum('pending','verified','suspended'), logo_doc_id, dpo_email, retention_days int default 365, created_at)
partner_members(partner_id, user_id, role enum('owner','admin','developer','reviewer'))
partner_api_keys(id, partner_id, env enum('sandbox','live'), key_hash, prefix, created_at, revoked_at, last_used_at)
forms(id uuid pk, partner_id, name, slug, purpose enum, requested_fields jsonb, custom_fields jsonb, redirect_url, webhook_url, status, version int, created_at)
partner_webhooks(id, partner_id, url, secret_enc, events text[], active)
webhook_deliveries(id, webhook_id, event, payload_hash, status, attempts, last_error, next_retry_at)
partner_status_pushes(id, partner_id, application_id, status, note, idempotency_key unique, created_at)

-- notifications & audit
notification_prefs(user_id, channel, category, enabled)
notifications(id, user_id, category, title, body, link, read_at, created_at)
notification_deliveries(id, notification_id, channel, provider_msg_id, status, error, created_at)
audit_log(id bigserial, at, actor_user_id, actor_partner_id, action, target_type, target_id, meta jsonb, prev_hash, hash)
flags(key pk, enabled bool, rollout jsonb)
```
Indexes: `facts(profile_id, fact_key)`, `applications(profile_id, status, deadline_at)`, `consents(profile_id, partner_id)`, `audit_log(at)`, blind index on `users.phone_hash`.

Row-level access: every query goes through `withProfileAccess(session, profileId)` which resolves owner-or-guardian scope; no raw table access from route handlers.

## 4. Seed data (mock env)
- Users: `Aarav Sharma` (student, 18, CBSE 2025, OBC-NCL, Lucknow), `Sunita Sharma` (parent, guardian of `Riya` age 15 and elder `Kamla Devi` 72), `Vikram Rao` (job seeker, B.Tech 2024), partner `Bharat Test Agency` (exam board, live form "BTA-JEE 2026"), partner `Nova University` (admissions form), partner `Axis-style Bank KYC (sandbox)`.
- Mock DigiLocker returns for Aarav: Aadhaar XML, PAN, CBSE Class 10 & 12 marksheets with subject-wise marks; OBC-NCL certificate expiring in 40 days (to demo reminders).
