# Praman — Verify once. Apply anywhere.

**प्रमाण** · The verified-profile layer for India. Enter your details once, verify them against the issuer (DigiLocker, UIDAI, CBSE, Income Tax, ABDM…), then push them into any exam form, college application, scholarship, bank KYC, job or government scheme with one consent tap. Institutions get an **“Apply with Praman”** button and signed, verified JSON. A browser extension autofills portals that never integrated. Families manage minors and elders. A consent ledger and application tracker close the loop. Built for DPDP Act 2023.

## What’s inside
| Path | What |
|---|---|
| `apps/web` | Next.js 16 app: citizen PWA (`/app`), onboarding (`/welcome`), share/consent flow (`/share/:token`), partner console (`/partner`), admin (`/admin`), public site |
| `apps/worker` | BullMQ workers: DigiLocker sync, PAN/AA/ABHA, OCR, webhooks, reminders, export/erase |
| `apps/demo-exam-portal` | “Bharat Test Agency — BTA-JEE 2026”: a realistic 48-field exam form with *Fill manually* vs *Apply with Praman* |
| `apps/extension` | Chrome MV3 autofill extension with portal recipes |
| `packages/schema` | **Canonical Citizen Schema** — the field registry (≈200 `fact_key`s, EN/HI labels, zod, purposes) |
| `packages/db` | Drizzle schema + migrations + seed; `putFact()` (encryption + provenance), consent-invariant trigger |
| `packages/providers` | Adapters: `mock` (deterministic fixtures) · `setu` (sandbox) · swap via env |
| `packages/crypto` | Envelope encryption (per-user DEK), ES256 JWS, webhook HMAC |
| `packages/sdk` | `@praman/sdk` for partners (button + Node helper) |
| `packages/ui` | Design system composites (SourceChip, FactRow, FieldDiff, …) on HeroUI v3 |
| `docs/` | PRD, architecture, data model, design system, API/flows, research, plans |

## Run it (5 minutes)
```bash
corepack enable && corepack prepare pnpm@9.15.9 --activate   # or: npm i -g pnpm@9
pnpm install
cp .env.example .env
docker compose up -d            # postgres :5434 · redis :6380 · minio :9002
pnpm db:reset                   # migrate + seed demo data
pnpm dev                        # web :3100 · worker · demo portal :3101
```
Open http://localhost:3100 → **Log in** with `9876543210`, OTP `123456` (mock SMS). Then open http://localhost:3101 and click **Apply with Praman**.

Demo accounts (OTP `123456`): `9876543210` Aarav (student, DigiLocker-verified) · `9876500002` Sunita (parent; guardian of Riya 15 and Kamla 72) · `9123456780` Vikram (job seeker) · `9000000001` partner admin (BTA, Nova University, bank sandbox) · `9000000000` Praman admin.

## The 3-minute demo
1. BTA portal → *Fill manually* → feel the 48 fields. Back → *Apply with Praman*.
2. Consent screen: 44 fields requested · 36 verified by CBSE/UIDAI/Income Tax · 5 missing → fill 5 → passkey/OTP → back to BTA, everything filled with verified badges + attached marksheet & category certificate → submit.
3. Praman → Track: the application appears. BTA admin pushes “Admit card released” → notification in Praman.
4. Connections → see exactly what BTA received → revoke → BTA’s webhook fires.
5. Switch profile to sister Riya → same form as guardian.

## Principles
- **Schema is the product.** `packages/schema` drives the vault, the form builder, the SDK payload, extension recipes and the DB.
- **Every fact carries provenance.** `self_declared` · `document_extracted` · `issuer_verified` · `provider_verified`, always rendered with a `SourceChip`.
- **No share without consent.** A Postgres trigger refuses any `shares` row without a valid, unrevoked, in-scope consent (tested).
- **Providers are pluggable.** `PROVIDER_DIGILOCKER=mock|setu` — the UI never changes.
- **Never store the Aadhaar number.** Only name/DOB/gender/address/last-4/XML hash/reference key from offline e-KYC.

## Commands
`pnpm dev` · `pnpm test` · `pnpm typecheck` · `pnpm db:generate` / `db:migrate` / `db:seed` / `db:reset` · `pnpm --filter @praman/web test:e2e` · `pnpm graph` (graphify)

## Docs
Start at `docs/00-README.md`. Product: `10-PRD-v2.md`, `07-USE-CASE-CATALOG.md`, `11-UX-FLOWS.md`. Tech: `02-ARCHITECTURE.md`, `03-DATA-MODEL.md`, `05-API-AND-FLOWS.md`, `08-INTEGRATIONS-PLAN.md`, `plans/2026-09-02-build-plan.md`, `RUNBOOK.md`. Business: `09-GTM-AND-BUSINESS.md`. Research: `docs/research/`.

## Status
v0.9 (demo-ready). Providers run in `mock`; `setu` sandbox adapter is coded for DigiLocker + PAN and needs keys. Live DigiLocker/Aadhaar/AA/ABHA require organisation registration — see `docs/08-INTEGRATIONS-PLAN.md`.
