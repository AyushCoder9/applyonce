# ApplyOnce progress ledger

Status date: 2026-09-02

## Completed and verified

### Product foundation

- Next.js App Router and React product shell.
- Clerk authentication boundary.
- PostgreSQL access through Drizzle and standard `pg`.
- Private Vercel Blob document path for current demo/preview use.
- Vercel Workflow webhook retry path.
- Mumbai `bom1` Vercel region configuration.
- Synthetic demo path that does not require a login.

### Citizen journey

- Public landing and demo.
- Route-addressable citizen workspace.
- Profile view/edit persistence through the backend.
- Source, document, application, consent, activity, notification, help, and settings areas.
- Application readiness and deterministic eligibility helpers.
- Review of field sources and verification state.
- Explicit scope/consent review.
- Idempotent submit request with duplicate-click protection.
- Transactional application event, consent, immutable snapshot, notification, and receipt creation.
- Snapshot SHA-256 hash and receipt details.
- Application status/timeline and export/deletion request controls.

### Partner journey

- Intentional organization onboarding.
- Partner workspace routes and role checks.
- Operator approval route.
- Form/program creation, requirements, eligibility, mapping, branding, preview, and publish routes.
- Immutable partner form versions on publish.
- Hosted mobile-first form runtime.
- Public form sessions, field validation, consent, document intake, submit, and receipt.
- Partner submission inbox and detail/status actions.
- API-key and webhook primitives.

### Trust and safety

- Connector registry with honest states.
- DigiLocker and MeriPehchaan approval-pending, APAAR unavailable, synthetic sandbox, manual upload connected.
- Source connect refuses unavailable/approval-pending states.
- Webhook destination DNS/IP checks against private and reserved ranges.
- Encrypted webhook secrets and HMAC delivery shape.
- Interaction audit for placeholder links, empty handlers, and false external-receipt claims.
- Public-safe README and synthetic-data disclosure.

### Verification evidence

- `npm run typecheck` passed.
- `npm run lint` passed.
- `npm test` passed with 11 tests in the release cycle.
- `npm run audit:interactions` passed.
- `npm audit --audit-level=moderate` passed with zero vulnerabilities after repository overrides.
- `npm run build` passed.
- `npm run db:migrate` passed.
- `npm run db:seed` passed.
- `npm run db:smoke` passed.
- `npm run db:partner-smoke` passed.
- `npm run test:e2e` passed with 10 desktop/mobile tests.
- `vercel build --yes` passed.
- GitHub Actions run `33553300730` passed the secret scan and verification steps.
- Public browser smoke passed desktop and mobile with zero page errors.

## Completed repository actions

- Public repository: `AyushCoder9/applyonce`.
- Public handoff commit: `18c1f09`.
- Public merge commit: `d6d2c97`.
- Private repository created: `AyushCoder9/test-applyonce-aks`.
- Private repository confirmed private.
- Public `main` history mirrored into private `main`.
- This private context layer is being added on top of the mirrored history.

## In progress or release-gated

- Supabase Mumbai production cutover: blocked pending Marketplace terms acceptance, then provisioning and migration verification.
- Production document storage: S3/KMS/GuardDuty design only; current public-safe path is private Vercel Blob.
- Production Clerk configuration: current deployment uses development configuration; a deliberate production identity cutover is required.
- Official provider integrations: no government connector is live.
- Verified email domain: Resend remains awaiting domain; in-app notifications work independently.
- Browser extension: not implemented.
- Android AutofillService: not implemented.
- Apple Safari WebExtension: not implemented.
- Full production observability, load testing, backup restore drills, formal incident controls, and compliance review: not complete.

## Do not mark complete without evidence

- “Mass-scale production ready” requires capacity, recovery, isolation, privacy, and operational evidence.
- “DigiLocker connected” requires official approval, credentials, consent, retrieval, error/revocation, and end-to-end verification.
- “Application submitted externally” requires a verified external receipt.
- “Secure” requires threat-model coverage, tested controls, monitoring, and known residual-risk documentation.

## 8 September 2026 — government integration and release-truth pass

### Implemented

- Added a direct DigiLocker Requester adapter with OAuth authorization code, S256 PKCE, state binding, token exchange, refresh, revocation, issued-document retrieval, eAadhaar XML retrieval, response-HMAC validation, network timeouts, and active-content rejection.
- Added a sealed, expiring, user-bound OAuth transaction cookie; stopped putting provider tokens in background-job payloads.
- Added fail-closed provider selection: unknown or incomplete production modes cannot silently fall back to mock data.
- Added runtime readiness states and exact blockers for DigiLocker, Aadhaar OVSE/online auth, PAN, ABHA, Account Aggregator, eSign, OCR, SMS, and email.
- Added a working DigiLocker disconnect route and citizen UI with remote-revocation warning plus local deletion/audit semantics.
- Reworked citizen and operator connector screens so only an evidence-backed production integration may appear green/live.
- Added canonical integration research, a DigiLocker production runbook, and an external approval register under `docs/integrations/`.
- Corrected stale claims that Aadhaar offline/VC verification required no organization registration; the current path requires UIDAI OVSE registration.
- Added adapter, cryptographic callback, HMAC, active-content, readiness, and browser-flow tests.

### Evidence captured before final release pass

- `pnpm test`: 117 tests passed.
- `pnpm typecheck`: passed.
- `pnpm lint`: passed; interaction audit covered 119 TSX files.
- `pnpm build`: passed for web, portal, and extension workspaces.
- Local production workflow audit: 84/84 checks passed.
- Playwright production-mode flows: 18 checks passed, including DigiLocker connect/callback/disconnect.
- Live API Setu signup inspection confirmed DigiLocker-MeriPehchaan identity is the entry rail; no application was submitted.

### Still externally gated

- API Setu/DigiLocker organization and requester approval, agreement, credentials, scopes, callback, and production proof.
- UIDAI OVSE registration or the substantially heavier AUA/KUA/Sub-AUA path.
- MeriPehchaan application-owner onboarding, eSign ASP/ESP agreement, PAN production authorization, and all publisher-specific API Setu approvals.
- Legal entity/signatory evidence, controlled domain, privacy/retention pack, verified email domain, and production compliance review.
- Production Mumbai PII/database and malware-scanned S3 document cutover remain unverified plans, not completed infrastructure.
