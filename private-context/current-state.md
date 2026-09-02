# Exact current state

## Repository and Git

- Public repository: `AyushCoder9/applyonce`
- Private mirror: `AyushCoder9/test-applyonce-aks`
- Private mirror visibility: confirmed private
- Public default branch: `main`
- Private default branch: `main`
- Original workspace branch at handoff: `ayush-code/applyonce-mass-product`
- Public feature branch head after documentation: `18c1f09`
- Public merge commit: `d6d2c97`
- Earlier hardened product commit: `5725953`
- The three local screenshot artifacts are user-owned and untracked in the original workspace; do not remove them.

## Live deployment

- Canonical URL: `https://applyonce-silk.vercel.app`
- Vercel project: `ayushcoder9s-projects/applyonce`
- Production deployment was verified after the hardening release.
- Function placement was verified in Mumbai `bom1`.
- Alternate Vercel deployment aliases may be access-protected; use the canonical public alias for reviewer smoke tests.
- The private mirror is not connected to Vercel and must not be deployed as part of this archive operation.

## Public checks that passed

The following returned successfully from the canonical public alias:

- `/`
- `/demo`
- `/privacy`
- `/programs`
- `/api/health`
- `/api/health/ready`
- `/api/openapi`
- `/api/integrations`
- `/portal/northstar-undergraduate-2026`

Health reported `ok: true` and a connected database. Readiness reported database, authentication, and document storage checks available. The browser journey reached the success heading “ApplyOnce submission recorded.”

## Integration registry snapshot

| Provider | State | Current interpretation |
|---|---|---|
| Clerk | connected | Auth configured for the deployed environment. |
| Neon/Postgres | connected | Current database reachable. |
| Resend | awaiting_domain | Email requires a verified sending domain. |
| Synthetic | sandbox | Reviewer-safe synthetic source only. |
| Manual upload | connected | Current real upload path. |
| DigiLocker | approval_pending | No verified production connector yet. |
| MeriPehchaan | approval_pending | SSO/auth direction only. |
| APAAR | unavailable | No approved production retrieval path. |
| eSign | approval_pending | Approved provider and flow required. |

## Current environment truth

The repository expects environment variables for database, Clerk, private Blob, webhook encryption, and optional Resend. Values must come from the local or deployment secret manager and must never be committed or copied into this folder.

The planned production architecture moves primary citizen PII to Supabase Mumbai and production documents to S3/KMS/GuardDuty Mumbai. This is a plan, not a completed cutover.

## Next safe command sequence

```bash
git status --short --branch
git log --oneline -8
npm run typecheck
npm run lint
npm test
npm run audit:interactions
npm run build
```

Then run database and browser checks only with an appropriate synthetic/local or approved staging environment. Do not run a Vercel deploy from this private mirror.
