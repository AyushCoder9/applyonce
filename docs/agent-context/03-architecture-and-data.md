# Architecture, routes, data, and API contracts

## Current runtime architecture

```text
Browser
  ├─ Public pages, demo, docs, security, status
  ├─ Citizen workspace
  ├─ Partner workspace
  └─ Hosted partner form
       │
       ▼
Next.js App Router and route handlers
  ├─ Clerk actor and role checks
  ├─ Zod request validation
  ├─ Citizen application services
  ├─ Partner form/submission services
  ├─ Consent, snapshot, receipt, event, notification recording
  ├─ Webhook queue and Workflow retry
  └─ Private document-storage boundary
       │
       ├─ PostgreSQL through Drizzle and pg
       ├─ Vercel Blob for current demo/preview documents
       ├─ Vercel Workflow for durable webhook processing
       └─ Connector registry and future approved adapters
```

Keep the modular monolith until boundaries, traffic, and operational ownership prove that a service split is necessary.

## Important route groups

Public pages: `/`, `/demo`, `/how-it-works`, `/security`, `/privacy`, `/docs`, `/status`, `/programs`, `/portal/[slug]`, `/sign-in`, `/sign-up`.

Citizen pages: `/app`, `/app/[section]`, `/app/applications/[id]`, `/app/applications/[id]/review`, `/app/applications/[id]/receipt`.

Partner pages: `/partner`, `/partner/[section]`, `/partner/programs/[id]/[mode]`, `/partner/submissions/[id]`.

Operations: `/ops`, `/ops/partners`, `/ops/health`.

Important API routes are under `src/app/api` and include profile, applications, consents, documents, sources, templates, public forms, partner forms/submissions/webhooks, health, integrations, OpenAPI, and operator approval.

## Data model currently in use

Inspect `src/db/schema.ts` and migrations before changing names. Current important tables include:

- `profiles`
- `source_connections`
- `profile_claims`
- `documents`
- `application_templates`
- `application_requirements`
- `applications`
- `application_fields`
- `application_snapshots`
- `consents`
- `application_events`
- `notifications`
- `organizations`
- `organization_members`
- `partner_forms`
- `partner_form_versions`
- `partner_submissions`
- `partner_consents`
- `partner_webhooks`
- `partner_webhook_deliveries`
- `partner_api_keys`
- `platform_audit_events`
- `data_export_requests`
- `data_deletion_requests`

## Target universal model

The post-shortlist model adds or normalizes:

- `accounts`, `people`, `person_relationships`
- `profile_claims`, `claim_versions`, `verification_events`
- `source_connections`, `source_grants`
- `documents`, `document_versions`
- `organizations`, `organization_memberships`
- `programs`, `program_drafts`, `program_versions`
- `program_requirements`, `field_definitions`, `field_mappings`
- `eligibility_rule_sets`, `site_mapping_manifests`
- `applications`, `application_answers`, `application_snapshots`, `application_documents`
- `consent_receipts`, `application_events`, `hosted_form_sessions`, `fill_sessions`
- `external_submission_receipts`, `payment_intents`, `payment_events`
- `api_clients`, `api_keys`, `webhook_endpoints`, `webhook_deliveries`
- `outbox_events`, `workflow_runs`, `notifications`, `audit_events`
- `support_cases`, `data_export_requests`, `data_deletion_requests`, `retention_jobs`, `legal_holds`

Migrate additively: add tables, backfill, dual-read while verifying, switch writes, compare counts/hashes/receipts, then archive only after evidence. One workstream owns production migrations.

## Invariants

- The server derives citizen and organization scope from the authenticated actor; client-supplied ownership IDs are not trusted.
- Published form versions and submitted application snapshots are immutable.
- Consent and audit records are append-only.
- Submission retries are idempotent.
- API-key material is stored only as a hash.
- Connector tokens are encrypted and never logged.
- Sensitive claim values and documents are never logged.
- Demo rows use synthetic identities and a dedicated demo context.
- Submitted applications cannot be edited as drafts.
- Revocation blocks future ApplyOnce access but does not promise deletion from a partner that already received data.

## Claim resolution

Each claim should carry subject, typed value, source/issuer, verification method/state, issued/refreshed/expiry timestamps, editability, sharing restrictions, version, and conflict state.

Precedence:

1. A source explicitly required by the program.
2. Unexpired issuer or cryptographically verified claim.
3. Current citizen-confirmed claim.
4. Stale or inferred value, shown but never silently submitted.

Conflicts block that field until the citizen resolves or refreshes it.

## Application submission transaction

The submit service must:

1. Validate the draft and required values.
2. Check idempotency and reject an already submitted application safely.
3. Create a purpose-bound consent record.
4. Freeze an immutable answers/documents snapshot and hash it.
5. Record the application event and in-app notification.
6. Update status and shared-field state.
7. Return the ApplyOnce receipt only after persistence succeeds.

Use a server-generated receipt/application ID. The client must show a retry-safe error and whether the draft was saved.

## API contract direction

REST remains the public contract under `/api/v1`, with OpenAPI 3.1 and generated TypeScript types. Mutation endpoints use Zod, origin/CORS checks, an idempotency key when retryable, structured audit metadata, rate limiting, and a standard error envelope containing `code`, `message`, field errors, request ID, and retryability.

Partner webhooks carry event ID, timestamp, HMAC signature, replay protection, exponential retry, and a visible dead-letter state. Never deliver to a private or reserved network address.
