# Praman — agent instructions

Read `docs/` before planning. `docs/03-DATA-MODEL.md` + `packages/schema/src/registry.ts` are the source of truth for every field name; never invent a `fact_key`. Current build contract: `docs/plans/2026-09-02-build-plan.md`.

## Standing rules
- Plan mode first for any task touching >3 files; write the plan to `docs/plans/<date>-<task>.md`, then implement.
- Consult the knowledge graph before reading raw files: `graphify query "<question>"` (graph in `graphify-out/`); rebuild with `pnpm graph`.
- Simplest solution that works (ponytail is active). No new dependency without a one-line justification in the plan.
- Every fact value rendered in UI must show its `SourceChip`. Every share must reference a `consent_id`. Both have tests; do not weaken them.
- Providers: code against `packages/providers` interfaces only. Default env is `mock`. Never call live provider URLs from tests.
- Facts are written only through `putFact()` (`packages/db/src/facts.ts`). Sensitive values are encrypted with the owner's DEK.
- UI: `apps/web/src/app/globals.css` tokens + HeroUI v3 components first, composed components in `packages/ui` second, raw Tailwind last. No inline hex colours.
- Copy is short, direct, Hindi-friendly English. Every empty state has one next action.
- Tests: Vitest for units, Playwright for the three golden flows. Run `pnpm test` before declaring done.
- When compacting, preserve: modified file list, open plan file path, failing test names, env vars introduced.

## Commands
`docker compose up -d` (postgres :5434, redis :6380, minio :9002) · `cp .env.example .env` · `pnpm db:reset` (drop + migrate + seed) · `pnpm dev` (web :3300, worker, demo portal :3301) · `pnpm test` · `pnpm typecheck` · `pnpm graph`

Demo logins (mock SMS, OTP **123456**): 9876543210 Aarav (student) · 9876500002 Sunita (parent, guardian of Riya + Kamla) · 9123456780 Vikram (job seeker) · 9000000001 BTA partner admin · 9000000000 Praman admin.

## Structure
`apps/web` (Next 16: citizen app, partner console, admin, public, share flow) · `apps/worker` (BullMQ) · `apps/demo-exam-portal` (Bharat Test Agency) · `apps/extension` (Chrome MV3) · `packages/schema` (registry) · `packages/db` (Drizzle) · `packages/crypto` · `packages/providers` · `packages/jobs` · `packages/sdk` · `packages/ui` · `packages/config`. Domains: identity · profiles · documents · verification · consent · applications · partners · notifications · audit.
