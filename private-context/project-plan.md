# ApplyOnce full product plan

## Product definition

ApplyOnce is universal application infrastructure with three rails: hosted forms, partner APIs/webhooks, and citizen-controlled autofill clients. The core owns reusable profile claims, provenance, document references, consent receipts, immutable application snapshots, receipts, and status history. It does not replace every government portal and does not claim government endorsement.

## Personas

Citizen-side:

- Adult applying for self.
- Student applicant.
- Parent or verified guardian applying for a minor.
- Authorized delegate helping another adult.

Partner-side:

- Organization owner/admin.
- Form builder.
- Reviewer.
- Developer.
- Auditor.
- Restricted support operator.

Platform-side:

- Partner verification operator.
- Connector operator.
- Security operator.
- Data-request operator.
- Incident manager.
- Read-only auditor.

## Domain packs

- Education: schools, colleges, exams, scholarships, coaching, certifications.
- Public services: schemes, benefits, certificates, licences, pensions, grievances.
- Employment: jobs, internships, recruitment, apprenticeships.
- Household: guardians, dependents, addresses, family income.
- Healthcare administration: appointments, benefits, insurance pre-authorisation, non-clinical forms.
- Financial aid/insurance: application data only; regulated decisions and payments remain with the partner.

## Required citizen capabilities

- Open registration, passkey/MFA, self/dependent people contexts.
- Reusable profile claims with source, freshness, verification, expiry, editability, and sharing history.
- Approved source connections and manual upload.
- Private document manager with scanning, replacement, expiry, download, and deletion.
- Program discovery and deterministic eligibility explanation.
- Autosaved application drafts, conflict resolution, scope review, explicit consent, duplicate-safe submit, receipt, status timeline, notifications, export, deletion, and revocation.

## Required partner capabilities

- Organization verification and team roles.
- Program/form draft, requirements, field mappings, eligibility AST, branding, preview, immutable publish/versioning.
- Hosted form, REST API, generated SDK, HMAC webhooks.
- Submission inbox, document requests, notes, status updates, reviewer actions, audit, and delivery retries.

## Target universal data model

People and claims: `accounts`, `people`, `person_relationships`, `profile_claims`, `claim_versions`, `source_connections`, `source_grants`, `verification_events`.

Programs: `organizations`, `organization_memberships`, `programs`, `program_drafts`, `program_versions`, `program_requirements`, `field_definitions`, `field_mappings`, `eligibility_rule_sets`, `site_mapping_manifests`.

Applications: `applications`, `application_answers`, `application_snapshots`, `application_documents`, `consent_receipts`, `application_events`, `hosted_form_sessions`, `fill_sessions`, `external_submission_receipts`.

Operations: `api_clients`, `api_keys`, `webhook_endpoints`, `webhook_deliveries`, `outbox_events`, `workflow_runs`, `notifications`, `audit_events`, `support_cases`, `data_export_requests`, `data_deletion_requests`, `retention_jobs`, `legal_holds`.

## Target production architecture

```text
Citizen web/PWA · partner web · browser extension · Android · Apple
                              │
                    OAuth/PKCE + REST/OpenAPI
                              │
             Next.js modular monolith on Vercel bom1
                │            │             │
             Clerk      Supabase Mumbai   durable workflows
                              │             │
                         claims/forms   email/webhooks/exports
                              │
                       S3/KMS/GuardDuty Mumbai
                              │
                    approved source/provider connectors
```

Keep deployment modular until service boundaries are proven. One migration owner controls schema changes.

## Safety and intelligence

Eligibility is versioned and deterministic with `eligible`, `ineligible`, or `needs_information` plus an explanation trace. AI may explain, translate, suggest mappings, surface conflicts, and summarize. AI may not decide eligibility, alter verified claims, give consent, share, or submit.

## Production gates

- Official provider agreements and credentials.
- India-primary PII data placement verification.
- Encrypted, scanned, private production documents.
- RLS/authorization/IDOR testing.
- Rate limits, CSRF/origin/CORS, CSP, SSRF, replay, and upload defenses.
- Durable export/deletion/retention workflows.
- Backups, restore drill, RPO/RTO evidence.
- Load, accessibility, mobile, Hindi, low-bandwidth, and recovery tests.
- Monitoring, incident runbook, support controls, privacy notice, DPIA, vendor review, and grievance process.
