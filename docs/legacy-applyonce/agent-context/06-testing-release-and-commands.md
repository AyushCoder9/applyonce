# Testing, verification, and release commands

## Local commands

```bash
npm install
npm run dev
npm run lint
npm run typecheck
npm test
npm run audit:interactions
npm run db:migrate
npm run db:seed
npm run db:smoke
npm run db:partner-smoke
npm run test:e2e
npm run build
```

Use `npm run db:generate` only after inspecting the schema and confirming that the migration is additive and owned by the migration workstream.

## What the checks cover today

- TypeScript and ESLint catch compile and code-quality errors.
- Vitest covers eligibility, partner-service safety, and application/domain helpers.
- Interaction audit catches placeholder links, empty handlers, and misleading external-receipt claims.
- Database smoke scripts exercise current citizen and partner persistence against the configured database.
- Playwright covers public desktop and mobile journeys, including the synthetic hosted-form submission.
- The production build and Vercel build validate deployability.
- Dependency audit and Gitleaks run in CI.

The existing unit suite is useful but not sufficient for mass-market readiness. Add authorization, workflow, data-protection, and recovery coverage before accepting real public PII.

## Required future coverage

Unit/property:

- Claim precedence, conflict and stale handling.
- Eligibility AST and explanation trace.
- Field mapping.
- Consent and receipt canonicalization/signing.
- Idempotency.
- Webhook signature/replay verification.
- Retention calculations.
- Encryption/key-rotation boundaries.

Database/integration:

- Adult, guardian, child, and dependent profiles.
- Cross-citizen and cross-organization isolation.
- Draft, immutable program publication, hosted session, autosave, and submission transaction.
- Duplicate submit and retry.
- Consent revocation.
- Document quarantine and scan result.
- Export/deletion completion and legal holds.
- Webhook retry and dead-letter handling.

End-to-end:

- Full citizen application and receipt flow.
- Parent applying for a child.
- Partner form creation, requirements, eligibility, mapping, branding, preview, and publish.
- Partner request for information and citizen response.
- Status update visible in the citizen timeline.
- Extension mapping preview/fill against a fixture portal.
- External confirmation capture without auto-submit.
- Shared-device logout and cache clearing.

Quality/security:

- IDOR and role matrix.
- CSRF, origin, CORS, SSRF, file-upload abuse, CSP, and replay tests.
- Keyboard, screen reader, contrast, reduced motion, Hindi layout, long text, slow network, and mobile tests.
- k6 capacity tests.
- Backup restoration and dependency-failure drills.
- Lighthouse and bundle budgets.

## Public release sequence

1. Inspect the diff and protect user-owned files.
2. Run local checks and secret/data scans.
3. Push the verified branch and merge through the repository workflow.
4. Confirm Vercel production deployment and Mumbai function placement.
5. Test the canonical public alias from a clean logged-out browser.
6. Check public pages, health, readiness, OpenAPI, integrations, hosted form, consent, submit, receipt, and mobile behavior.
7. Record exact commit, deployment, URL, and remaining gates.

## Release truth checklist

- Public URL opens without access request.
- Demo data is synthetic and clearly labelled.
- No `.env*`, token, real document, or secret is tracked.
- Every visible primary control has a tested action.
- Internal receipt wording is not confused with external submission.
- Connector labels match the registry.
- Submitted snapshots and consent records survive refresh and retries.
- Citizen and organization isolation tests pass.
- A rollback path exists.

The current Vercel CLI has a known patch update available (`59.11.0 → 59.11.2` at the time of this handoff). Upgrade it before relying on new CLI behavior, but do not make a CLI upgrade part of an unrelated product change without re-running the build and deployment checks.
