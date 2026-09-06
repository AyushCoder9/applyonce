# 06 — Claude Code playbook

Sourced from Anthropic's current Claude Code best-practices page and the graphify/ponytail READMEs (Sept 2026). The core discipline: **plan → implement → subagent review against the plan → commit → clear.** Treat every session as disposable; the repo + `docs/plans/` are the memory.

## 0. Setup (once)
```bash
# in your existing repo (or a fresh one)
cp -r applyonce-kit/ docs/ && mv docs/CLAUDE.md ./CLAUDE.md
uv tool install graphifyy            # graphify CLI (note the double y)
graphify install --project           # writes CLAUDE.md directive + PreToolUse hook
echo "graphify-out/" >> .claudeignore # keeps prompt cache stable; still commit graphify-out/
```
Inside Claude Code (two separate prompts for ponytail):
```
/plugin marketplace add DietrichGebert/ponytail
/plugin install ponytail@ponytail
/graphify .
```
Model: Opus/Fable as orchestrator; set `CLAUDE_CODE_SUBAGENT_MODEL` to Sonnet for research/review subagents to save cost.

## 1. Session rhythm (every phase)
1. `/graphify . --update` if files changed outside the session.
2. Prompt (below) → Claude enters plan mode → you read `docs/plans/…md`, challenge it (cheap), approve.
3. Implementation.
4. `Use a subagent to review the diff against docs/plans/<file>.md. Report only gaps affecting correctness or the stated requirements.`
5. `pnpm test` green → you commit → `/clear`.

## 2. Phase prompts
Paste each as the first message of a fresh session. Standing rules live in CLAUDE.md — don't restate them.

### P0 — Audit the current build (if a repo exists)
> Use subagents to audit this repo against docs/01-PRD.md and docs/02-ARCHITECTURE.md. For each area (schema, auth, vault UI, providers, partner side, tests) produce: what exists, what is prototype-only, what to keep, what to delete. Write docs/plans/audit.md with a keep/rewrite decision per directory. Recommend whether to migrate in place or start from the monorepo layout in docs/02 §3 and move salvageable code.

### P1 — Monorepo + schema (the foundation)
> Plan and implement the Turborepo/pnpm monorepo from docs/02 §3 with Next.js 15 (App Router, TS), Tailwind v4, HeroUI v3, Drizzle + Postgres, Redis, docker-compose (postgres, redis, minio). Build `packages/schema` first: a field registry implementing every fact_key in docs/03 §1 with type, section, sensitivity, allowed sources, i18n labels (en, hi), and generators for zod validators and the Drizzle `fact_key` enum. Add unit tests that the registry round-trips and that every key in docs/03 exists. Then create all tables in docs/03 §3 as Drizzle schema + migration, and the seed from docs/03 §4.

### P2 — Design system + shell
> Implement docs/04 as `apps/web/DESIGN.md`, the Tailwind @theme tokens, HeroUI theme override, fonts (Bricolage Grotesque, Inter, Noto Sans Devanagari, JetBrains Mono), and the composed components in docs/04 §5 inside packages/ui with a Storybook-free `/dev/ui` gallery route showing every component in every state. Build the citizen shell (rail + bottom tabs), partner shell, and public shell layouts. No feature pages yet.

### P3 — Auth + profiles + vault
> Implement better-auth with phone OTP (mock SMS in dev) and passkeys, step-up sessions, device/session management, and `withProfileAccess` ACL. Then the Vault: `/app/vault` section grid and `/app/vault/[section]` with FactRow, add/edit sheets generated from the schema registry, history drawer, sensitive-fact masking with passkey reveal. Home page with completion ring and "Needs attention". Golden Playwright flow #1 (register → add facts) must pass.

### P4 — Providers + onboarding + documents
> Implement packages/providers interfaces from docs/02 §5 with `mock` implementations returning the seeded fixtures, plus a `setu` sandbox implementation behind env flags (read Setu DigiLocker + Offline Aadhaar docs; do not hardcode secrets). Build the BullMQ worker, verification jobs, SSE `/api/events`. Then the onboarding wizard (docs/05 F1) with the DigiLocker connect step, and Documents (upload → signed URL → AV stub → OCR mock → proposed facts review, F4). Mismatch + expiry jobs (F6).

### P5 — Consent, share, partner console, SDK
> Implement consents/shares with the DB-level invariant (trigger + test) that a share cannot exist without a valid, unrevoked, in-scope consent. Build the share flow `/share/[token]` (docs/05 F2) with FieldDiff, missing-fields mini form, step-up, JWS payload signing + JWKS. Build the partner console pages (docs/04 §7 #17), form builder from the schema tree, API keys, webhooks with HMAC + retries, status push. Publish `@applyonce/sdk` in packages/sdk with the button + Node helper.

### P6 — Demo exam portal + applications tracker
> Build apps/demo-exam-portal ("Bharat Test Agency — BTA-JEE 2026") as a deliberately realistic 6-step, 48-field government-style form with "Fill manually" and "Apply with ApplyOnce" using @applyonce/sdk against local ApplyOnce. Implement the applications tracker and timeline, partner status push appearing live via SSE. Golden Playwright flow #2 (full F2 through the demo portal) must pass. Then script the 3-minute demo in docs/05 §4 as a Playwright "demo mode" that runs it.

### P7 — Extension
> Build apps/extension (Chrome MV3, Vite + React) per docs/05 F3: web-handshake login, recipe engine, `nta-jee`, `nsp`, and `generic` recipes, sequential fill with highlight sweep, application-ref capture. Add a recipe for the demo portal's "Fill manually" path so both paths demo. Golden flow #3.

### P8 — Family, notifications, settings, data rights
> Implement relations/delegation (F5) with profile switcher and handover-at-18 job; notifications (in-app, email via Resend, SMS via MSG91, web push) with preferences; settings pages; export/erase jobs; audit log viewer; admin console basics (partner approvals, provider health, queues).

### P9 — Hardening & ship
> Security pass: IDOR tests on every profile-scoped route, rate limits, share-token replay test, webhook signature tests, upload validation, CSP, secrets scan. Performance: RSC for vault, Redis profile summary cache, DB indexes from docs/03. Observability: Sentry + OTel + pino. Write docs/RUNBOOK.md (deploy to Vercel + Fly/Railway, env matrix, provider switch procedure, breach runbook). Produce a one-command `docker compose up` demo.

## 3. Cost/quality guardrails
- Don't kitchen-sink: one phase per session; split P4/P5 if context passes ~60% (`/compact` with the CLAUDE.md preservation rule).
- Use `/btw` for quick questions you don't want in context.
- Reviewer subagents flag gaps, not style; ignore over-engineering suggestions.
- Prefer `<input type="date">`-style simplicity where HeroUI has no primitive (ponytail will push this; accept it unless DESIGN.md says otherwise).

## 4. Definition of done (product)
- Three golden Playwright flows green in CI; `docker compose up` gives a working demo with seeded users in < 3 min.
- Every fact in the UI shows a source; zero unconsented shares (tested); export/erase work.
- Provider switch `mock → setu` requires only env changes.
- Lighthouse ≥ 90 (perf/a11y) on Home, Vault, Share.
