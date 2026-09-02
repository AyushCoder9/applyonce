# Decision log

These decisions are locked unless new evidence or an explicit product decision changes them.

## Product

- Name: ApplyOnce.
- Promise: reusable, verified, consent-controlled application data.
- Education is the first launch market; the schema is universal.
- Citizens use the product free at launch.
- Payments are modeled but disabled; partners retain payment credentials and checkout.
- Hosted forms, partner APIs/webhooks, and citizen-controlled autofill are the three rails.

## Truth and trust

- ApplyOnce records an internal receipt after its own transaction succeeds.
- An external receipt is shown only after a verified partner/integration response.
- Demo data is synthetic.
- Government connectivity is never inferred from a connector card, mock adapter, or sandbox row.
- No scraping, CAPTCHA bypass, arbitrary portal automation, or biometric vault.
- Deterministic rules are authoritative. AI is explanatory and assistive only.

## Technology

- Next.js App Router and React remain the web foundation.
- Clerk remains identity and organization source of truth until a deliberate change.
- Drizzle and standard `pg` are the database access layer.
- Current deployment remains a modular monolith.
- HeroUI primitives, Sora, Geist, IBM Plex Mono, Lucide, and isolated Motion components define the current UI direction.
- REST/OpenAPI 3.1 is preferred over GraphQL.
- Vercel Fluid Compute/Node.js is preferred over Edge runtime assumptions.

## Storage and region plan

- Current public-safe deployment uses Neon and private Vercel Blob.
- Planned production PII database is Supabase Mumbai; Neon remains local/preview.
- Planned production documents are private S3 Mumbai with KMS, quarantine, versioning, and malware scanning.
- The cutover is not complete until resources, credentials, migration, access controls, backup, restore, and smoke tests are verified.

## Privacy and compliance direction

- Build toward DPDP notice, consent, security, child-data, grievance, breach, retention, export, and deletion requirements; obtain counsel validation for the exact fiduciary/processor role.
- Verify parental authority for minors and avoid behavioural advertising or child profiling.
- Review CERT-In applicability, GIGW 3.0, WCAG 2.2 AA, retention, subprocessors, and data-residency requirements before real public PII.

## Collaboration

- Prefer additive, reviewable changes.
- One migration owner changes production schema files.
- Every workstream supplies tests and operational documentation.
- Inspect current code and live behavior before assuming a planned feature exists.
- Preserve user-owned untracked files and unrelated work.
