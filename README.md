# ApplyOnce

Your details. Once. Anywhere.

ApplyOnce is a consent-first application platform for admissions, examinations, scholarships, and other high-friction forms. A citizen keeps a reusable profile, sees which values are verified, reviews the exact data a partner requests, and receives a receipt after submission.

It is designed for two sides of the same problem:

- Citizens and students repeat the same identity, address, family, education, and document details across different forms.
- Colleges, schools, exam organizers, and scholarship providers receive incomplete or inconsistent submissions and have to rebuild the same workflow themselves.

ApplyOnce provides a citizen workspace, partner form builder, hosted application forms, purpose-bound consent, private documents, application receipts, status events, and signed webhook delivery primitives.

## Live product

- [Public product](https://applyonce-silk.vercel.app)
- [Synthetic citizen demo](https://applyonce-silk.vercel.app/demo)
- [Hosted partner form](https://applyonce-silk.vercel.app/portal/northstar-undergraduate-2026)
- [Partner documentation](https://applyonce-silk.vercel.app/docs)
- [Security boundary](https://applyonce-silk.vercel.app/security)
- [System status](https://applyonce-silk.vercel.app/status)

The public demo does not require a login. All demo names, records, dates, identifiers, and documents are synthetic. The authenticated citizen and partner workspaces require Clerk sign-in.

## The citizen journey

1. Create a reusable profile.
2. Connect an approved source when an application needs it.
3. Open a partner or education application.
4. Review prefilled values with their source and verification state.
5. Correct or confirm anything that only the citizen can decide.
6. Review the purpose, fields, and documents requested.
7. Give explicit consent and submit once.
8. Keep the receipt and follow status changes from the workspace.

## The partner journey

1. Sign in and open a partner workspace.
2. Create a form with a declared purpose.
3. Add fields and map reusable profile keys where appropriate.
4. Publish a version and share its hosted URL.
5. Receive submissions with a receipt code and consent reference.
6. Move submissions through review, missing documents, acceptance, or completion.
7. Use signed webhook deliveries or the API contract to connect an existing system.

## What is implemented

### Citizen product

- Route-addressable citizen workspace under `/app/*`, with refresh and browser-history recovery.
- Profile editing with durable Neon/Postgres persistence.
- One connector registry with explicit sandbox, approval-pending, unavailable, degraded, connected, expired, and revoked states.
- DigiLocker and MeriPehchaan are approval-pending; APAAR production retrieval is unavailable until approved access exists.
- Private PDF, JPEG, and PNG document upload through Vercel Blob.
- Education application packet creation and deterministic readiness scoring.
- Field-level source labels, confirmation, and review states.
- Purpose-bound consent records and consent revocation.
- Transactional immutable application snapshots, purpose-bound consent, timeline events, notifications, and hashed receipts.
- Application receipts with copy, print, and snapshot-integrity details.
- One application shelf for both ApplyOnce packets and authenticated hosted-form submissions, with receipt and status detail.
- In-app notifications and application timeline events.
- Durable profile export and queued data-deletion request controls.

### Partner product

- Intentional organization onboarding and membership records with partner roles.
- Route-addressable partner workspace under `/partner/*`.
- Restricted operator approval flow that blocks publication until an organization is approved and writes immutable audit events.
- Form creation, field editing, mapping metadata, preview, and publishing.
- Hosted mobile-first form runtime at `/portal/[slug]`.
- Authenticated profile prefill when the applicant is signed in.
- Authenticated private document upload bound to the published form and applicant profile.
- Required-field validation, review step, explicit consent, and receipt generation.
- Partner submission inbox with durable status updates.
- Submission detail review with submitted values, consent state, receipt, and document count.
- Citizen-facing timeline events for authenticated hosted-form applicants.
- Webhook endpoint registration with encrypted signing secrets.
- HMAC-signed delivery primitives, public-network destination checks, failure tracking, durable Workflow retries, and delivery inspection routes.

### Platform foundation

- Next.js App Router and React.
- Clerk authentication and server-side actor checks.
- Standard PostgreSQL through Drizzle and `pg`, with migration files and provider-neutral domain code.
- Vercel Blob private document storage.
- Zod validation at API boundaries.
- Idempotency protection for hosted submissions.
- Transactional snapshot, consent, receipt, event, and notification recording for safe retries.
- Deterministic, auditable eligibility rules with three outcomes and explanation traces.
- OpenAPI 3.1 contract at `/api/openapi`.
- Tenant-scoped partner queries.
- Security and readiness endpoints.
- Responsive custom design system using Sora, Geist, IBM Plex Mono, HeroUI primitives, Lucide icons, and isolated Motion components.

## Honest integration status

ApplyOnce separates the stable application layer from external provider credentials.

- The synthetic source is sandbox-only. Manual upload is real. DigiLocker and MeriPehchaan remain approval-pending, and APAAR production retrieval remains unavailable.
- A connector is not presented as live government connectivity until its official partner approval, credentials, consent flow, and retrieval request are verified.
- The product does not scrape protected portals, bypass CAPTCHA, automate arbitrary external sites, or store face, fingerprint, or iris templates.
- Aadhaar and other sensitive identity values are not collected by default.
- Email delivery remains optional until a verified sending domain is configured. In-app notifications work without it.

## Architecture

```text
Browser
  ├─ Public landing, demo, docs, security, hosted form
  ├─ Citizen workspace
  └─ Partner workspace
       │
       ▼
Next.js route handlers
  ├─ Clerk actor and role boundary
  ├─ Zod request validation
  ├─ Citizen application services
  ├─ Partner form and submission services
  ├─ Consent and audit events
  ├─ Webhook queue and retry processor
  └─ Private Blob upload boundary
       │
       ├─ PostgreSQL via pg and Drizzle
       ├─ Vercel Blob in demo/preview
       ├─ Vercel Workflow for durable webhook delivery
       └─ Official provider adapters when configured
```

### Data model

Core citizen tables include `profiles`, `source_connections`, `profile_claims`, `documents`, `application_templates`, `application_requirements`, `applications`, `application_fields`, `application_snapshots`, `consents`, `application_events`, and `notifications`.

Partner tables include `organizations`, `organization_members`, immutable `partner_form_versions`, `partner_forms`, `partner_submissions`, `partner_consents`, `partner_webhooks`, `partner_webhook_deliveries`, and `partner_api_keys`. Platform reviews write `platform_audit_events`.

Account-control tables include `data_export_requests` and `data_deletion_requests`.

Important invariants:

- Partner-owned records are always queried with the authenticated organization scope.
- Consent and timeline records are append-only events from the application layer.
- Published form versions and submitted application snapshots are immutable.
- API and hosted submissions can carry an idempotency key.
- Webhook signing secrets are encrypted at rest and are not returned by list endpoints.
- Private document files are never exposed through public URLs.
- Synthetic demo rows are labelled and use dedicated demo identities.

## Repository structure

```text
src/
  app/
    api/                  Next.js route handlers
    app/                  Citizen workspace
    partner/              Partner workspace
    ops/                  Restricted platform operations
    portal/[slug]/        Hosted partner form runtime
    docs/                 Partner documentation
    security/             Public security boundary
    status/               Public service status
  components/
    brand/                ApplyOnce logo components
    marketing/            Landing and public page components
  db/
    schema.ts             Drizzle schema
    seed.ts               Synthetic data seed
    smoke.ts              Database integration smoke test
  lib/
    application-service.ts
    intelligence.ts       Deterministic readiness and consent helpers
    eligibility.ts        Versionable deterministic eligibility AST
    connectors/           Honest connector registry and states
    partner-service.ts    Partner forms, submissions, webhooks
public/
  applyonce-mark.svg
  applyonce-wordmark.svg
  applyonce-og.svg
drizzle/
  *.sql                  Ordered database migrations
```

## Agent handoff

The structured, evidence-bound context for the next AI or human contributor is in [`docs/agent-context/00-index.md`](docs/agent-context/00-index.md). It records the product intent, current implementation truth, architecture, workflows, security boundaries, verification commands, and the remaining production work. It is kept public-safe: it contains no credentials, real personal data, or private conversation transcript.

## Local setup

Requirements:

- Node.js 24 LTS (the repository pins `24.x`).
- PostgreSQL. Neon is used for local/preview; the Supabase Mumbai production cutover is gated on Marketplace terms and migration verification.
- Clerk application keys.
- A Vercel Blob store for private document upload.

Install dependencies:

```bash
npm install
```

Copy `.env.example` to `.env.local` and fill the required values:

```bash
DATABASE_URL=               # pooled runtime connection
DATABASE_URL_UNPOOLED=      # migration and seed connection
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=
CLERK_SECRET_KEY=
BLOB_READ_WRITE_TOKEN=
WEBHOOK_ENCRYPTION_KEY=     # long random server-only secret
APPLYONCE_OPS_USER_IDS=     # comma-separated Clerk user IDs allowed into /ops
```

Optional email values:

```bash
RESEND_API_KEY=
RESEND_FROM_EMAIL=
```

Initialize the database and synthetic data:

```bash
npm run db:migrate
npm run db:seed
```

Start the development server:

```bash
npm run dev
```

Open `http://localhost:3000`, `/demo`, or `/portal/northstar-undergraduate-2026`.

## Commands

```bash
npm run dev          # Start Next.js development mode
npm run lint         # ESLint
npm run typecheck    # TypeScript without emit
npm test             # Vitest suite
npm run test:e2e     # Playwright desktop and mobile public journeys
npm run audit:interactions # Reject placeholder links, empty actions, and false receipt claims
npm run build        # Production build
npm run db:generate  # Generate a Drizzle migration
npm run db:migrate   # Apply migrations
npm run db:seed      # Seed synthetic application and partner records
npm run db:smoke     # Create, submit, reload, and clean a real test packet
npm run db:partner-smoke # Exercise hosted submission, consent, status, and cleanup
```

## API surface

The current route handlers live under `/api`. Stable `/api/v1` rewrites expose the public contract names while the implementation remains in one place.

### Public hosted forms

```text
GET  /api/v1/forms/:slug
POST /api/v1/forms/:slug/submit
```

The submit request requires `applicantName`, `applicantEmail`, `data`, and `consentAccepted: true`. An authenticated applicant may also pass private `documentIds` uploaded for that form. Send an `Idempotency-Key` header when retrying a request.

### Citizen APIs

```text
GET    /api/v1/me
PATCH  /api/v1/me/profile
GET    /api/v1/me/applications
GET    /api/v1/me/applications/:id
POST   /api/v1/me/applications/:id/submit
GET    /api/v1/me/applications/:id/receipt
GET    /api/v1/me/documents
POST   /api/v1/me/documents
DELETE /api/v1/me/documents/:id
GET    /api/v1/me/consents
POST   /api/v1/me/consents/:id/revoke
POST   /api/v1/me/data-export
POST   /api/v1/me/data-deletion
```

### Partner APIs

```text
GET    /api/v1/partner/forms
POST   /api/v1/partner/forms
GET    /api/v1/partner/forms/:id
PATCH  /api/v1/partner/forms/:id
POST   /api/v1/partner/forms/:id/publish
GET    /api/v1/partner/submissions
PATCH  /api/v1/partner/submissions/:id/status
GET    /api/v1/partner/webhooks
POST   /api/v1/partner/webhooks
POST   /api/v1/partner/webhooks/process
GET    /api/v1/partner/webhooks/:id/deliveries
POST   /api/v1/partner/api-keys
DELETE /api/v1/partner/api-keys/:id
```

API keys are created from the authenticated partner workspace and are shown once. Store the returned `ao_live_...` value in the consuming system; ApplyOnce stores only its hash, scope list, usage timestamp, expiry, and revocation state. Bearer API-key requests are accepted for the versioned forms, submissions, and webhook routes when the key includes the required scope.

Webhook events currently include `application.submitted` and `application.status_changed`. Delivery headers include the event, delivery ID, timestamp, and HMAC signature. Consumers should reject stale timestamps and replayed delivery IDs.

## Security boundary

ApplyOnce is production-shaped software, not a claim of absolute security. The baseline includes:

- Clerk authentication and server-side authorization.
- Organization-scoped partner queries.
- Zod request validation.
- Parameterized Drizzle queries.
- Private Blob upload and ownership checks.
- MIME and size limits for document uploads.
- HTTPS-only webhook endpoints outside local development.
- DNS and IP validation that rejects private, loopback, link-local, reserved, and mapped private webhook destinations before each delivery.
- Encrypted webhook secrets and HMAC signatures.
- Consent hashes and revocation events.
- Idempotent hosted submissions.
- Security headers and readiness checks.
- No sensitive values in application logs.

Before a production launch, operators still need a threat model, dependency and secret scanning, penetration testing, backup verification, retention policy, incident response, provider approval, and a verified email domain if email is required.

## Testing and release checklist

Run the local checks:

```bash
npm run lint
npm run typecheck
npm test
npm run db:migrate
npm run db:seed
npm run db:smoke
npm run db:partner-smoke
npm run audit:interactions
npm run test:e2e
npm audit --audit-level=moderate
npm run build
```

Before publishing or deploying:

1. Run a secret scan and inspect the complete Git diff.
2. Confirm `.env*`, `.vercel`, build output, and local agent files are ignored.
3. Use synthetic data only in seed and public demo paths.
4. Confirm the migration chain applies to a fresh database and the existing database.
5. Smoke-test landing, demo, hosted form, health, readiness, and auth redirects.
6. Test citizen isolation, partner organization isolation, consent revocation, duplicate submit, and private document ownership.
7. Verify reduced-motion and mobile layouts.
8. Deploy and re-run the public smoke tests against the production URL.

## Logo and brand assets

The transparent ApplyOnce SVG system is in `public/` and the runtime component is `src/components/brand/ApplyOnceLogo.tsx`.

- `applyonce-mark.svg` is the icon and favicon mark.
- `applyonce-wordmark.svg` is the transparent wordmark.
- `applyonce-og.svg` is the Open Graph preview asset.

The mark represents one verified profile rail branching into multiple application destinations. It includes accessible SVG titles and descriptions and is used in metadata, public pages, workspaces, hosted forms, and receipts.

## Roadmap

- Add verified official DigiLocker and other provider credentials through their approved partner processes.
- Complete the gated Supabase Mumbai production migration after Marketplace terms are accepted and migration hashes match.
- Replace the synthetic/demo Blob path with S3/KMS/GuardDuty Mumbai after the AWS account and OIDC trust are approved.
- Add short-lived hosted form sessions with resumable encrypted drafts.
- Add API-key rotation, rate limiting, and scheduled key-expiry and retention workers.
- Complete data-export and deletion execution workflows with legal-hold handling.
- Add Hindi localization and more education templates.
- Expand to jobs, healthcare, licences, and public-service applications only after the education workflow is proven.

## License

MIT. See [LICENSE](./LICENSE).

## Contributing

Please open an issue before a large change. Keep new integrations adapter-based, document whether a provider is live or sandboxed, avoid sensitive demo data, preserve organization isolation, and add tests for every new state-changing route.
