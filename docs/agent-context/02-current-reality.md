# Current implementation truth

Last checked: 2026-09-02. This file separates evidence from intent. A route, database row, test, or UI card is not proof of an official external integration.

## Verified repository state

- The current public repository is `AyushCoder9/applyonce`.
- The main branch contains the hardened citizen and partner platform work.
- The working tree has three local, untracked screenshot artifacts. They are user-owned and must not be deleted or accidentally included in unrelated commits.
- The local checks listed in [06-testing-release-and-commands.md](06-testing-release-and-commands.md) have passed in the current release cycle.
- The public repository contains the synthetic-safe README and product implementation.

## Verified public runtime

Canonical public URL: [applyonce-silk.vercel.app](https://applyonce-silk.vercel.app)

Verified public pages and endpoints:

- `/`
- `/demo`
- `/privacy`
- `/programs`
- `/api/health`
- `/api/health/ready`
- `/api/openapi`
- `/api/integrations`
- `/portal/northstar-undergraduate-2026`

The health endpoint reported a connected database. Readiness reported database, authentication, and document-storage checks as available. The public application demo was browser-tested on desktop and mobile: opening the demo, selecting an education form, accepting the scope, reviewing a field, opening the sharing review, confirming the final affirmation, and reaching the “ApplyOnce submission recorded” success state all worked with no page errors.

## Implemented product areas

Citizen:

- Route-addressable workspace under `/app/*`.
- Profile view and editing with server persistence.
- Current/permanent address, postal, family/guardian, education, employment, disability, and masked-identifier fields.
- Source cards with explicit connector state.
- Private document upload and download boundary.
- Applications, review, consent, receipt, timeline, notification, export, and deletion controls.
- Submitted application snapshots with a SHA-256 payload hash.

Partner:

- Explicit organization onboarding rather than silently creating an organization when `/partner` is visited.
- Partner roles, forms, program routes, requirements, eligibility, mapping, branding, preview, submissions, API keys, webhooks, integrations, audit, and settings screens.
- Immutable partner form versions on publish.
- Hosted form runtime with field validation, consent, document intake, and receipt generation.
- Submission status updates and citizen timeline events.

Platform:

- Operator-gated partner approval and audit route.
- Health and readiness routes.
- Connector registry.
- Deterministic eligibility evaluator.
- OpenAPI 3.1 document.
- HMAC webhook delivery primitives, retry workflow, and destination network checks.
- Interaction audit that rejects placeholder links, empty click handlers, and misleading receipt language.

## Integration state from the registry

The current public integration endpoint reports:

| Provider | State | Meaning |
|---|---|---|
| Clerk | connected | Authentication is configured for the deployed environment. |
| Neon/Postgres | connected | The current database is reachable. |
| Resend | awaiting_domain | Email is not the only notification path and a verified sending domain is still required. |
| Synthetic source | sandbox | Synthetic-only reviewer path. |
| Manual upload | connected | Real upload path, subject to storage and scanning policy. |
| DigiLocker | approval_pending | Adapter direction exists; official onboarding/credentials/end-to-end verification are not complete. |
| MeriPehchaan | approval_pending | Authentication/SSO direction only; not a universal document source. |
| APAAR | unavailable | No approved production retrieval path is being claimed. |
| eSign | approval_pending | Requires an approved provider and legal/operational setup. |

## Current production-shaped limitations

These are genuine release gates, not cosmetic backlog items:

- The current deployed database is Neon/standard Postgres; the planned India-primary PII cutover to Supabase Mumbai has not happened.
- The current production document path is private Vercel Blob; S3/KMS/GuardDuty Mumbai is planned but not configured.
- Clerk environment keys are development keys in the current setup; production identity configuration requires a deliberate cutover.
- Official government connectors are not live.
- Browser extension, Android AutofillService, and Apple Safari extension are not implemented.
- Verified outbound email domain, advanced observability, load testing, backup restore drills, and formal incident controls remain release work.
- The public demo is synthetic and intentionally does not prove mass-market PII readiness.

## Do not regress these truths

- Say “ApplyOnce submission recorded” for internal persistence.
- Say “filled and ready for you to submit” for an unintegrated external portal.
- Keep approval-pending and unavailable connectors visibly distinct from connected sources.
- Keep demo names, dates, identifiers, and documents synthetic.
- Never put a secret in source, logs, screenshots, or Markdown.
