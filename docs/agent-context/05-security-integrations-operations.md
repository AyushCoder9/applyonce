# Security, integrations, and operations

## Security baseline

The product handles identity, education, family, document, and consent data. Treat it as high-sensitivity even when the demo is synthetic.

Required baseline:

- Clerk authentication and server-side actor checks.
- Organization and citizen isolation in the data-access layer.
- PostgreSQL RLS as defense-in-depth for the production cutover.
- Recent MFA/passkey verification for sensitive actions.
- AES-256-GCM envelope encryption for sensitive claims; keys held and rotated through KMS in the production design.
- Private document storage, quarantine before clean scan, short-lived signed downloads, MIME/content/size/checksum validation.
- Origin/CSRF checks, security headers, staged CSP enforcement, rate limiting, and redacted errors/logs.
- HMAC-signed webhooks with timestamps, five-minute replay protection, retries, and dead-letter visibility.
- SSRF-resistant webhook delivery: resolve DNS, block loopback/private/link-local/reserved/mapped ranges, re-check before connection, and restrict egress.
- Secret, dependency, SAST, DAST, and SBOM checks.
- Immutable consent and audit events.
- Durable export, deletion, retention, and legal-hold workflows.

“Fully secure” is not an absolute claim. Document the threat model, controls, tests, monitoring, and known residual risks.

## Official connector policy

All connectors implement a common shape: begin authorization, callback, request consent, list claims, list documents, fetch document, refresh, revoke, and health. The registry is the source of visible state.

Allowed states:

- `unavailable`
- `approval_pending`
- `sandbox`
- `connected`
- `degraded`
- `expired`
- `revoked`

Current facts:

- Synthetic source is sandbox-only.
- Manual upload is a real current path subject to storage policy.
- DigiLocker is approval-pending until requester onboarding, agreement, credentials, and production retrieval are verified.
- MeriPehchaan is an authentication/SSO direction, not a universal document source.
- APAAR remains unavailable until a documented third-party access path exists.
- eSign requires an approved ASP/ESP provider and verified flow.
- API Setu and other government APIs are live only after documented access and testing.

Never scrape, bypass CAPTCHA, automate arbitrary protected sites, or label an adapter as live from a mock callback.

## Planned production infrastructure

The current deployed POC uses Neon and private Vercel Blob. The mass-scale plan is:

- Supabase managed PostgreSQL in Mumbai `ap-south-1` for production primary PII.
- Neon branches for local/preview only.
- Private S3 in Mumbai with SSE-KMS, versioning, quarantine, and malware scanning for production documents.
- Vercel OIDC short-lived AWS credentials; no long-lived AWS keys.
- Vercel Workflow for uploads, scans, webhooks, notifications, exports, deletion, retention, refresh, and receipts.
- Resend after a verified domain; in-app and web-push notifications must work independently.
- Vercel WAF/BotID for registration, public forms, uploads, and submission abuse.
- OpenTelemetry/Vercel Observability, PII-scrubbed error monitoring, and public-flow monitors.

The Supabase Marketplace cutover previously stopped at terms acceptance. Do not claim that a Mumbai production database exists until the resource is actually provisioned, migrated, tested, and verified.

## Browser and mobile autofill

The future WXT extension and native clients must be citizen-controlled:

1. Request temporary active-tab/site permission only when used.
2. Analyze the page locally.
3. Receive a short-lived, origin-bound signed fill package.
4. Preview every mapping, value source, and verification state.
5. Fill only selected fields; leave ambiguous fields untouched.
6. Let the citizen complete OTP, CAPTCHA, files, payments, and final submit.
7. Store no durable profile copy in the extension and never record field values.

Browsers do not allow scripts to assign a local file to a file input. The product must guide the citizen through manual document selection. Android should use AutofillService and device unlock. Apple should use a Safari WebExtension with Keychain-held tokens.

## Operational targets

Initial engineering targets: 1M registered citizens, 100k daily active users, 500 peak API requests/second, 20 submissions/second, p95 reads under 400ms and writes under 800ms excluding external providers, 99.9% controlled-beta availability, RPO at most 15 minutes, and RTO at most 60 minutes. These are targets, not evidence that the current deployment meets them.

Environments must be separated:

- Local: synthetic data only.
- Preview: Neon branch, preview Clerk, preview storage, synthetic users.
- Staging: production-equivalent Mumbai infrastructure and synthetic data.
- Production: Mumbai primary PII, production Clerk, approved connectors, private documents.
