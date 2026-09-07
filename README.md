# ApplyOnce — Verify once. Apply anywhere.

ApplyOnce turns a citizen's reusable facts and documents into a purpose-bound application. Each answer keeps its source; the citizen reviews exactly what an institution requests, confirms consent, and tracks the resulting application.

This repository contains the production-shaped ApplyOnce sandbox, built as a TypeScript monorepo. The deployed reviewer journey uses persistent backend state and synthetic citizen/institution records; live government, health and financial provider onboarding remains external work.

Live reviewer surfaces: [ApplyOnce](https://applyonce-silk.vercel.app) and the independent [Bharat Test Agency portal](https://applyonce-bta-demo.vercel.app).

## What you can demonstrate

- **Evidence readiness:** see missing, expired, conflicting and out-of-scope requirements before starting an application. Open the source details and follow repair links.
- **Ask ApplyOnce:** English/Hindi local explanations work without an API key. An optional OpenAI Responses adapter explains the same deterministic result using derived information, without receiving raw facts or documents.
- **Complete BTA application:** create a partner session → review exact fields → confirm OTP → exchange a signed payload → refresh/edit the saved review → submit → push status back to the citizen tracker.
- **Citizen controls:** ten vault sections, document uploads and review, sample evidence previews, family scopes, consent receipts/revocation, export, cancellable erasure requests, and a stored declaration receipt. Consent receipts download as value-free ES256 evidence that verifies against the public JWKS.
- **Partner and operations portals:** switch among seeded organizations; manage forms, applicants, team, keys and webhooks; inspect provider jobs, queues, audit events and data requests.
- **Extension:** Chrome MV3 recipes, field matching and guarded fill plans for supported forms. Real portal compatibility requires separate live-site validation.

## Run locally

Requires Node 24 LTS, pnpm 9 and Docker.

```bash
corepack enable
corepack prepare pnpm@9.15.9 --activate
pnpm install --frozen-lockfile
cp .env.example .env
docker compose up -d
pnpm db:migrate
pnpm db:seed
pnpm dev
```

Open [ApplyOnce](http://localhost:3300) and the [BTA portal](http://localhost:3301). Root commands load `.env` for every workspace; explicit shell exports take precedence. Keep providers in `mock` for this demonstration. `db:seed` is idempotent; `db:refresh-demo` updates existing sample attachment hashes and supplies sample photo/signature records.

| Phone | Persona | Purpose |
|---|---|---|
| `9876543210` | Aarav | Student/application demo |
| `9876500002` | Sunita | Minor and scoped elder access |
| `9123456780` | Vikram | Job-seeker vault |
| `9000000001` | Partner admin | BTA, Nova University, bank console |
| `9000000000` | Operations admin | Admin portal |

All mock accounts use OTP **123456**. Source badges on seeded records describe the simulated provider path, not a live issuer verification.

## Two-minute pitch

Use [the timed demo script](docs/DEMO-SCRIPT.md), including exact pages, clicks, speaking cues and rehearsal setup. The differentiator is **evidence readiness with a constrained explanation layer**: fast applications need trustworthy inputs, explicit sources and deliberate consent.

For production-mode rehearsal, build both apps, start the worker, and set `DEMO_ADMIN_ENABLED=1` when starting BTA to expose its sample status controls. See [the runbook](docs/RUNBOOK.md). This flag does not enable a real institution administration service.

## Verify the build

```bash
pnpm typecheck
pnpm test -- --concurrency=1
pnpm build
# With web, worker and BTA running against a disposable seeded database:
pnpm audit:workflows
node scripts/run.mjs pnpm --filter @applyonce/web test:e2e --workers=1
pnpm inventory
```

The audit modifies demo facts, creates applications/uploads and schedules then cancels a deletion request. Run it only against disposable local fixtures. It writes a machine-readable report to `docs/audit-results.json`. Test and coverage details, known limits and exact results are in [AUDIT-REPORT.md](docs/AUDIT-REPORT.md).

## Repository map

| Path | Responsibility |
|---|---|
| `apps/web` | Next.js citizen, partner, admin and public surfaces; APIs |
| `apps/demo-exam-portal` | Separate BTA app with signed SDK exchange and Redis-backed review/application state |
| `apps/worker` | BullMQ provider, document, webhook, reminder and data jobs |
| `apps/extension` | MV3 autofill service worker, popup and recipes |
| `packages/schema` | Canonical facts, EN/HI labels, validation and readiness |
| `packages/db` | Drizzle/Postgres, access rules, provenance writes and consent trigger |
| `packages/crypto` | Fact encryption, signed payloads and webhook signatures |
| `packages/providers` | Deterministic demos, readiness registry, Setu sandbox adapters and direct DigiLocker Requester OAuth/PKCE adapter |
| `packages/sdk` | Partner session creation, token exchange and verification |
| `packages/ui` | Shared source-aware UI components |

## Current documentation

- [Project context](docs/PROJECT-CONTEXT.md): architecture, workflows, boundaries and decisions.
- [Production deployment](docs/PRODUCTION-DEPLOYMENT.md): verified current topology, latency budgets, Mumbai target and migration gates.
- [Audit report](docs/AUDIT-REPORT.md): findings, fixes, validation and remaining gaps.
- [Current progress](docs/CURRENT-PROGRESS.md): delivered work and handoff checklist.
- [Government integration register](docs/integrations/README.md): current official access paths, implemented boundaries and blockers.
- [External approval register](docs/integrations/APPROVAL-REGISTER.md): organization evidence and approval work that code cannot complete.
- [DigiLocker runbook](docs/integrations/DIGILOCKER-RUNBOOK.md): exact configuration and production-proof gate.
- [Integrations and roadmap](docs/INTEGRATIONS-AND-ROADMAP.md): optional AI setup and prioritized engineering work.
- [Runbook](docs/RUNBOOK.md): local setup, rehearsal and troubleshooting.
- [Source inventory](docs/source-inventory.json): file hashes, line counts and extracted structure.

Graphify was used to navigate the code graph; Ponytail's simple, explicit implementation approach guided the fixes. Historical PRDs, research and ApplyOnce documentation remain under `docs/`; treat them as design history where they differ from these current documents.
