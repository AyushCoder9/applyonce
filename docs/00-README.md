# Documentation index

Start with [PROJECT-CONTEXT.md](PROJECT-CONTEXT.md), [AUDIT-REPORT.md](AUDIT-REPORT.md), [CURRENT-PROGRESS.md](CURRENT-PROGRESS.md), [DEMO-SCRIPT.md](DEMO-SCRIPT.md) and [RUNBOOK.md](RUNBOOK.md). These describe the September 2026 audited implementation.

The material below is historical product planning. Proposed integrations, compliance, deployment and market claims should not be read as implemented capabilities.

---

# ApplyOnce — build kit

**ApplyOnce** (Hindi/Sanskrit: *applyonce* = "proof / verified evidence") · Working tagline: **Verify once. Apply anywhere.**

This folder is everything a builder (you + Claude Code, or a smaller model) needs *before* writing product code, plus the exact prompt sequence to build it.

| File | What it is | Read when |
|---|---|---|
| `01-PRD.md` | Problem, personas, full use-case map, feature list, scope, metrics | First. Decides *what* |
| `02-ARCHITECTURE.md` | Stack, monorepo, integration adapters, security/consent model, infra | Before any code |
| `03-DATA-MODEL.md` | Canonical Citizen Schema (the crown jewel) + Postgres tables | Before backend |
| `04-DESIGN-SYSTEM.md` | Tokens, type, colour, motion, component rules, full page list + layouts | Before any UI |
| `05-API-AND-FLOWS.md` | API surface, end-to-end user flows, partner "Apply with ApplyOnce" protocol, extension autofill | Before integrations |
| `06-CLAUDE-CODE-PLAYBOOK.md` | CLAUDE.md, plugin setup (graphify, ponytail), phase-by-phase prompts | When building |
| `CLAUDE.md` | Drop into repo root verbatim | Day 1 |
| `07-USE-CASE-CATALOG.md` | 165+ application types by life stage, top-40 fields → registry keys, special populations | Prioritising |
| `08-INTEGRATIONS-PLAN.md` | Provider-by-provider access path (mock → sandbox → live), DPDP checklist, 12-month roadmap | Before provider work |
| `09-GTM-AND-BUSINESS.md` | Analogs (Myinfo), India landscape, pricing, TAM, moats, 12-month GTM, pitch | Fundraising / GTM |
| `10-PRD-v2.md` | Consolidated PRD with MoSCoW + acceptance criteria per surface | Building |
| `11-UX-FLOWS.md` | 10 end-to-end flows with edge paths, EN/HI copy, events | Building UI |
| `RUNBOOK.md` | Deploy, env matrix, provider switch, key rotation, breach runbook | Ops |
| `plans/2026-09-02-build-plan.md` | Decisions + work packages + API surface (the build contract) | Any code change |
| `research/01..05` | Raw research: DPI integrations, use cases, UI libraries, market, verified stack notes | Reference |

## The one-paragraph pitch
Every Indian fills the same 40 fields — name, DOB, parents, category, income, address, Aadhaar, 10th/12th marks — into every exam form, college application, scholarship, bank KYC, hospital registration, job portal, and government scheme. DigiLocker stores *documents*; nobody stores *verified structured facts* and lets a citizen push them into any form with one consent tap. ApplyOnce is the verified-profile layer: enter once, verify against the issuer, then autofill any form (partner SDK, browser extension, or hosted forms) with purpose-scoped consent, and track every application's lifecycle in one place. Built for DPDP Act 2023 from day one.

## Honest constraints baked into the plan
- Aadhaar OTP e-KYC needs AUA/KUA licensing → we use **Offline Aadhaar (paperless e-KYC XML)** and **DigiLocker-issued documents** via an aggregator sandbox (Setu / Cashfree / Surepass). Never fake it.
- Direct DigiLocker Requester APIs need a registered organisation ToS on API Setu → adapter layer now, swap provider later, zero UI change.
- Face/iris scans are not something a private app should collect. Auth = **passkeys (WebAuthn)** + phone OTP. Liveness only via a licensed vendor, optional, later.
- "One seamless central system for each citizen" is a *product* claim; legally it is *citizen-owned, consent-gated, purpose-limited*. The consent ledger is the product's spine.
