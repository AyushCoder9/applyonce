# ApplyOnce private engineering handoff

Last updated: 2026-09-02 (Asia/Kolkata)

This folder is the private companion to the public handoff at [`docs/agent-context/00-index.md`](../docs/agent-context/00-index.md). It contains the owner’s implementation journal, request chronology, release evidence, and private planning notes. The code and public-safe product context are still the source of truth; this folder adds context that should not be published in the public repository.

## Read this first

1. [`conversation-summary.md`](conversation-summary.md) — faithful chronology of the owner’s product requests and decisions.
2. [`progress-ledger.md`](progress-ledger.md) — completed, verified, blocked, and next work.
3. [`current-state.md`](current-state.md) — exact repository, deployment, branch, and integration state.
4. [`project-plan.md`](project-plan.md) — complete product direction and production-scale scope.
5. [`next-agent-runbook.md`](next-agent-runbook.md) — safe sequence for the next contributor.
6. [`source-builder-brief.md`](source-builder-brief.md) — private copy of the user-supplied hackathon brief.
7. [`visual-evidence/`](visual-evidence/) — the three user-provided UI audit screenshots preserved from the original workspace.

## Privacy boundary

- No credentials, access tokens, environment values, real identity numbers, passwords, or real documents belong here.
- The owner’s registration email is intentionally omitted from repository files. It should be entered only into the submission form when needed.
- The conversation file is a faithful implementation summary, not a raw platform export. The raw chat transcript was not available as a local source file.
- Demo records must remain synthetic.

## One-line product context

ApplyOnce is a consent-controlled application platform: a citizen keeps reusable, provenance-aware profile information and documents, reviews the exact sharing scope, submits to a hosted partner form or integrated API, and receives a durable receipt and status timeline.

## Canonical links

- Public product: `https://applyonce-silk.vercel.app`
- Public repository: `https://github.com/AyushCoder9/applyonce`
- Private engineering mirror: `https://github.com/AyushCoder9/test-applyonce-aks`
- Synthetic hosted form: `https://applyonce-silk.vercel.app/portal/northstar-undergraduate-2026`
- API contract: `https://applyonce-silk.vercel.app/api/openapi`

## Immediate rule for future agents

Read the public current-reality handoff and this private state before claiming that a feature is complete. “UI exists,” “route exists,” “database row exists,” “sandbox adapter exists,” and “official production integration is verified” are different states.
