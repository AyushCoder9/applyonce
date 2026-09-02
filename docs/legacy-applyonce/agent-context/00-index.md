# ApplyOnce agent handoff

Last verified: 2026-09-02 (Asia/Kolkata)

This directory is the shortest reliable way for a new agent to understand the ApplyOnce repository before editing it. Read the files in order when the task is broad; jump to the relevant file for a focused change.

## Read order

1. [Product and problem](01-product-and-problem.md) — what ApplyOnce is, who it serves, and what it must not claim.
2. [Current reality](02-current-reality.md) — what is verified in code and production today, versus what is planned.
3. [Architecture and data](03-architecture-and-data.md) — runtime shape, routes, persistence, APIs, and invariants.
4. [User flows and UI](04-user-flows-and-ui.md) — citizen, partner, hosted-form, consent, receipt, and visual-system expectations.
5. [Security and integrations](05-security-integrations-operations.md) — privacy boundaries, connector states, deployment and operations.
6. [Testing and release](06-testing-release-and-commands.md) — local commands, CI gates, public smoke checks, and release rules.
7. [Next workstreams](07-next-workstreams.md) — ordered backlog for turning the current product-shaped POC into a mass-scale service.
8. [Decision log](08-decision-log.md) — choices that should not be reversed casually.

## One-minute orientation

ApplyOnce is a consent-controlled application platform. A citizen maintains reusable profile claims and documents, reviews exactly what a partner requests, confirms consent, submits an application, and receives a durable receipt. Partners can build and publish hosted forms, receive submissions, request information, and update status. The initial market is education, but the domain model is intentionally broader.

The canonical public journey is synthetic and reviewer-safe:

```text
public landing → demo → education application → prefilled fields →
scope review → explicit affirmation → internal submission record → receipt
```

The most important truth boundary is this: an ApplyOnce submission is not an external government or partner-portal receipt unless an approved integration returns and stores a verified external receipt. Current public demo submissions are recorded by ApplyOnce itself.

## Repository facts

- Product: ApplyOnce
- Public repository: `AyushCoder9/applyonce`
- Canonical public URL: `https://applyonce-silk.vercel.app`
- Hosted synthetic form: `https://applyonce-silk.vercel.app/portal/northstar-undergraduate-2026`
- Framework: Next.js App Router, React, TypeScript
- Auth: Clerk
- Database: PostgreSQL through Drizzle and standard `pg`
- Demo/preview document storage: private Vercel Blob
- Durable webhook retry: Vercel Workflow
- Deployment region configuration: Mumbai `bom1`
- Node requirement: 24.x
- Current public-safe state: production-shaped proof of concept, not yet mass-market PII readiness

## Rules for the next agent

- Inspect `git status`, `git log`, and the relevant route before editing.
- Preserve unrelated user changes, including untracked screenshot files.
- Do not put secrets, personal identifiers, raw tokens, real documents, or private transcripts into the public repository.
- Do not label an integration live because an adapter or UI card exists. Use the registry state and evidence.
- Every visible control needs a route or backend action, loading feedback, success/error feedback, and a test.
- Prefer additive migrations. Never reset or delete a database to make a local test pass.
- Keep deterministic eligibility authoritative. AI can explain or assist, never decide, consent, share, or submit.
- When changing a public claim, update the README and this context set in the same change.
- Before handing off, run the smallest relevant checks and record their result in the progress notes or PR description.

## Start here

```bash
git status --short --branch
git log --oneline -8
npm install
npm run typecheck
npm run lint
npm test
```

Then inspect the exact route or service involved. For a full release gate, use [06-testing-release-and-commands.md](06-testing-release-and-commands.md).

## Context hygiene

This public handoff intentionally describes the project and implementation truth without reproducing private chat history. The private mirror requested by the owner contains an additional implementation journal and conversation-summary file; those private files are not part of this public repository.
