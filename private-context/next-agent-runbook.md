# Next-agent runbook

## Before changing code

1. Read the public handoff index and this private folder.
2. Inspect `git status --short --branch` and `git log --oneline -8`.
3. Check whether another task has active edits in this repository or whether a worktree is safer.
4. Read the relevant Next.js guide in `node_modules/next/dist/docs/` before using a breaking or unfamiliar API.
5. Find the route, service, schema, tests, and live behavior that actually implement the requested feature.

## Safe implementation rules

- Use `apply_patch` for source and Markdown edits.
- Keep public docs public-safe.
- Put private planning/journal material only under `private-context/` in this private repository.
- Never add `.env`, `.env.local`, `.vercel`, credentials, tokens, real identity values, or real documents.
- Use additive migrations; never reset a shared database.
- Derive tenant and user ownership on the server.
- Keep consent, snapshot, receipt, and event writes transactionally consistent.
- Make retryable mutations idempotent.
- Test every visible control and every failure/recovery state.
- Do not run a Vercel deploy for this private archive repository.

## Suggested next milestone

The most valuable next production milestone is identity/data integrity, not more decorative UI:

1. Normalize people and guardian relationships.
2. Add claim versions, provenance, freshness, conflicts, and explicit source precedence.
3. Add consent receipt canonicalization and signing.
4. Add organization isolation and RLS defense-in-depth.
5. Add authorization matrix and IDOR tests.
6. Add durable export/deletion workflows.
7. Add document quarantine and scan-state workflow.

After that, implement partner versioning/API contracts, then the connector framework, browser/mobile clients, and production operations.

## Verification before handoff

```bash
npm run typecheck
npm run lint
npm test
npm run audit:interactions
npm run db:migrate
npm run db:seed
npm run db:smoke
npm run db:partner-smoke
npm run test:e2e
npm run build
```

Record the exact commit, checks, deployment URL, and any remaining release gates in `progress-ledger.md`. A private mirror commit is not a production deployment.

## If blocked

Do not invent credentials or mark an external integration live. Record the blocker, keep the adapter state honest, implement the contract boundary and synthetic test fixture, and leave the official approval/credential gate visible.
