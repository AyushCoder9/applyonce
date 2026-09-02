# Praman — build kit

**Praman** (Hindi/Sanskrit: *praman* = "proof / verified evidence") · Working tagline: **Verify once. Apply anywhere.**

This folder is everything a builder (you + Claude Code, or a smaller model) needs *before* writing product code, plus the exact prompt sequence to build it.

| File | What it is | Read when |
|---|---|---|
| `01-PRD.md` | Problem, personas, full use-case map, feature list, scope, metrics | First. Decides *what* |
| `02-ARCHITECTURE.md` | Stack, monorepo, integration adapters, security/consent model, infra | Before any code |
| `03-DATA-MODEL.md` | Canonical Citizen Schema (the crown jewel) + Postgres tables | Before backend |
| `04-DESIGN-SYSTEM.md` | Tokens, type, colour, motion, component rules, full page list + layouts | Before any UI |
| `05-API-AND-FLOWS.md` | API surface, end-to-end user flows, partner "Apply with Praman" protocol, extension autofill | Before integrations |
| `06-CLAUDE-CODE-PLAYBOOK.md` | CLAUDE.md, plugin setup (graphify, ponytail), phase-by-phase prompts | When building |
| `CLAUDE.md` | Drop into repo root verbatim | Day 1 |

## The one-paragraph pitch
Every Indian fills the same 40 fields — name, DOB, parents, category, income, address, Aadhaar, 10th/12th marks — into every exam form, college application, scholarship, bank KYC, hospital registration, job portal, and government scheme. DigiLocker stores *documents*; nobody stores *verified structured facts* and lets a citizen push them into any form with one consent tap. Praman is the verified-profile layer: enter once, verify against the issuer, then autofill any form (partner SDK, browser extension, or hosted forms) with purpose-scoped consent, and track every application's lifecycle in one place. Built for DPDP Act 2023 from day one.

## Honest constraints baked into the plan
- Aadhaar OTP e-KYC needs AUA/KUA licensing → we use **Offline Aadhaar (paperless e-KYC XML)** and **DigiLocker-issued documents** via an aggregator sandbox (Setu / Cashfree / Surepass). Never fake it.
- Direct DigiLocker Requester APIs need a registered organisation ToS on API Setu → adapter layer now, swap provider later, zero UI change.
- Face/iris scans are not something a private app should collect. Auth = **passkeys (WebAuthn)** + phone OTP. Liveness only via a licensed vendor, optional, later.
- "One seamless central system for each citizen" is a *product* claim; legally it is *citizen-owned, consent-gated, purpose-limited*. The consent ledger is the product's spine.
