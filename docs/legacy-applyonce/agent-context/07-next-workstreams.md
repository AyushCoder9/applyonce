# Ordered next workstreams

This is the production roadmap after the current public-safe hardening. Workstreams may be split into separate branches/worktrees, but contracts and migrations need one owner.

## 1. Foundation and contracts

- Move toward an npm-workspace monorepo only after the current public path is stable.
- Extract shared Zod contracts, OpenAPI types, UI tokens, form runtime, domain state machines, connectors, SDK, and test fixtures.
- Add CI gates for migration dry-run, Playwright, accessibility, SBOM, secret scan, preview smoke, canary, and rollback.
- Add request IDs and consistent error envelopes.

## 2. Identity, people, and claims

- Normalize self, child, dependent, guardian, and delegate contexts.
- Add claim versions, provenance, verification events, conflicts, freshness, expiry, and sharing restrictions.
- Add recent-MFA checks for sensitive profile, source, document, consent, export, and deletion actions.
- Add production RLS and prove isolation with adversarial tests.

## 3. Citizen web

- Finish route-level server-backed profile, people, sources, documents, programs, applications, consents, activity, notifications, help, and settings.
- Add autosave/recovery, offline/shared-device behavior, low-bandwidth mode, English/Hindi message catalogues, and complete accessibility.
- Make data export/deletion durable workflows with progress, completion, legal holds, and retention exceptions.

## 4. Partner platform

- Add organization verification, role/permission matrix, team invitations, approval workflow, form version diff, publishing rollback, and reviewer support tooling.
- Add field builder, requirements, deterministic eligibility, source mapping, branding, preview, submissions, missing-document requests, notes, status events, API keys, webhooks, and audit.
- Add partner-facing operational metrics that are derived from real records.

## 5. Hosted forms and API product

- Version all public endpoints under `/api/v1`.
- Publish OpenAPI and generated SDKs.
- Add short-lived form sessions, origin binding, abuse controls, idempotency, consent receipts, document intake, and honest external-receipt capture.
- Add webhook replay, retry, dead-letter, signature inspection, and partner test delivery.

## 6. Integration framework

- Implement connector interface and synthetic/manual adapters first.
- Complete legal, security, partner, credential, consent, and end-to-end gates for every official provider.
- Build source refresh, disconnect, revoke, degraded, expiry, and unavailable states.
- Store only minimum encrypted claims or verifiable references.

## 7. Autofill clients

- Build WXT extension for Chrome/Edge/Firefox with signed mapping manifests and local DOM analysis.
- Build Android AutofillService with device-unlock protection.
- Build Apple Safari WebExtension inside the native wrapper.
- Add fixture portals, permission review, mapping preview, no-file-automation behavior, and telemetry that never records field values.

## 8. Production infrastructure and operations

- Provision and verify Supabase Mumbai, S3/KMS/GuardDuty Mumbai, production Clerk, WAF/BotID, observability, email, and workflow environments.
- Migrate additively from Neon/Blob after counts, hashes, receipts, access policies, and restore tests match.
- Add backups, PITR, restore drill, retention jobs, incident runbook, CERT-In applicability review, support access controls, and change management.

## 9. Intelligence

- Keep eligibility deterministic and versioned.
- Add explanation, translation, stale/conflict hints, partner requirement drafting, and summaries as optional assistive features.
- Redact or avoid sending sensitive claims/documents to models by default.
- Test the product with AI disabled.

## Recommended execution order

```text
contracts/schema → claims/consent → citizen persistence → partner persistence →
hosted form/API → connector/workflow → extension/mobile → security/ops → scale
```

Do not spend the next cycle polishing a screen while its backend action, authorization, persistence, and recovery behavior are still absent.
