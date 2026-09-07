# Exact current state

Verified: 8 September 2026. Re-verify this file after every production release.

## Repository and release

- Public repository: `AyushCoder9/applyonce`
- Private archive: `AyushCoder9/test-applyonce-aks` (must not be deployed)
- Active release branch: `ayush-code/production-performance`
- Public production URL: `https://applyonce-silk.vercel.app`
- Public BTA portal URL: `https://applyonce-bta-demo.vercel.app`
- Vercel project: `ayushcoder9s-projects/applyonce`
- Preserve both stable aliases; reviewers already use them.
- Untracked screenshots, `.agents/`, `.playwright-mcp/`, `next-env.d.ts`, and `skills-lock.json` are user-owned. Do not delete or commit them unless explicitly requested.

## Product capabilities implemented

- Better Auth session boundaries and synthetic reviewer identities.
- PostgreSQL/Drizzle persistence for reusable profiles, documents, consents, hosted forms, applications, receipts, partner records, notifications, API keys, webhooks, and audit events.
- Private document access, encrypted sensitive provider references, idempotent application submission, explicit consent affirmation, immutable submission snapshots, receipts, and citizen/partner timelines.
- ApplyOnce-hosted citizen and partner workflows plus the standalone BTA portal.
- Browser-extension workspace and fixture coverage for citizen-reviewed form filling; it does not bypass OTP, CAPTCHA, file selection, payment, or final submission.
- Honest connector runtime with fail-closed states: `demo`, `sandbox`, `approval_pending`, `configured_unverified`, `live`, `unavailable`, and `misconfigured`.
- Direct DigiLocker Requester adapter for OAuth authorization-code flow, S256 PKCE, state binding, token exchange/refresh/revocation, issued files, eAadhaar XML, HMAC validation, timeouts, and active-content rejection.
- OAuth transactions are sealed in a short-lived HttpOnly cookie and bound to the current user/profile/provider. Provider tokens do not enter Redis/job payloads.
- DigiLocker disconnection attempts remote revocation, always removes the local link, and records an audit event.

## Verification baseline before release

The current working tree passed locally before this state update:

- 117 package tests.
- TypeScript type-check.
- ESLint plus interaction audit across 119 TSX files.
- Production build for both Next.js applications and the extension.
- 84/84 workflow audit checks against local production-mode servers.
- 18 Playwright checks, including the complete hosted application flow and DigiLocker connect/callback/disconnect path.

Run the final matrix again after the last code edit and before pushing.

## Integration truth

| Provider | Runtime state without credentials | What is real now | External gate |
|---|---|---|---|
| Synthetic source | `demo` | Complete end-to-end reviewer path | None; clearly synthetic only |
| Manual upload | available | Real upload/persistence path | Production malware scanning/storage hardening remains a release gate |
| DigiLocker | `approval_pending` | Direct adapter and callback security are implemented | API Setu organization approval, agreement, client, scopes, callback, then production proof |
| APAAR/ABC/NAD | future DigiLocker scope | Generic issued-document runtime | Approved document scopes and issuer coverage |
| UIDAI Aadhaar App/OVSE | `approval_pending` | Readiness contract only | OVSE registration, legal purpose, domain/certificate/app details, approval |
| Aadhaar online auth/e-KYC | `unavailable` | None | AUA/KUA or approved Sub-AUA/Sub-KUA role, audit, agreement, test and production approval |
| MeriPehchaan | `approval_pending` | SSO readiness contract | Application-owner organization approval and conformance; not a document source |
| eSign | `approval_pending` | Readiness contract | ASP agreement with an empanelled ESP, DSC/public key, pre-production and audit |
| PAN | sandbox only | Existing sandbox interface | ITD approval or approved production intermediary contract |
| Account Aggregator | `unavailable` | None | Eligible regulated FIU partner and certified lawful purpose |
| ABDM/ABHA | demo/backlog | No production exchange | India entity, use case, sandbox milestones, audit and NHA production exit |

The canonical matrix, official links and state meanings are in `docs/integrations/README.md`. The external owner/action list is in `docs/integrations/APPROVAL-REGISTER.md`.

## First external action

Prepare the P0 organization pack, then create the API Setu partner account at `https://partners.apisetu.gov.in/signup`. The live signup currently starts through DigiLocker-MeriPehchaan identity; organization verification follows. Do not submit identities, agreements or client secrets from automation without the founder's action-time confirmation.

The minimum P0 inputs are:

- India legal entity name/type/registration number.
- Authorized signatory and authority letter.
- Organization PAN/GST/incorporation evidence as applicable.
- Domain-controlled email and website.
- Privacy notice, terms, grievance/security contacts.
- Declared use case, minimum DigiLocker document scopes, callback URL, purpose and retention.

## Environment truth

- Current production hosting is Vercel, with the web backend running as Vercel Functions.
- Current database/storage settings must be verified from Vercel environment metadata before every release; secrets must never be copied into this file.
- The planned Mumbai primary-PII database and S3/KMS/GuardDuty document architecture remain a production-scale plan until provisioning and migration evidence exists.
- Email remains optional until a sending domain is verified; in-app notifications work independently.
- No government connector is production-live as of this verification date.

## Safe release sequence

```bash
git status --short --branch
git diff --check
pnpm test
pnpm typecheck
pnpm lint
pnpm build
pnpm audit --audit-level=moderate
```

Then run local production workflow/Playwright checks, push the verified commit, wait for Git-connected Vercel deployment, and smoke-test both stable public aliases from a logged-out browser. Never deploy the private archive repository.
