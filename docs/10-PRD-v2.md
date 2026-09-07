# 10 — PRD v2 (supersedes 01-PRD.md, kept consistent with it)

This consolidates `docs/01-PRD.md` with the research findings in `docs/07-USE-CASE-CATALOG.md`, `docs/08-INTEGRATIONS-PLAN.md`, and `docs/09-GTM-AND-BUSINESS.md`. Where this doc and `01-PRD.md` overlap, this one is authoritative; nothing here contradicts `docs/02-ARCHITECTURE.md` or `packages/schema`.

## 1. Problem
A citizen's identity and life facts are re-typed, re-uploaded and re-verified thousands of times across their life. Every exam, college, scholarship, bank, hospital, employer, or government-scheme application rebuilds the same 30–60 fields and 6–12 documents from scratch. Name-spelling mismatches across Aadhaar/PAN/marksheet are the #1 rejection cause (research 02 §Part C: ~28% of PAN rejections, ~40% of NSP rejections are preventable mismatches). DigiLocker solved document *storage*; nobody stores verified *structured facts* or lets a citizen push them into a form with one consent tap.

## 2. Vision
The verified-profile layer for India: **enter once, verify once, apply anywhere, track everything.**

## 3. Personas & jobs-to-be-done
| # | Persona | Core job (JTBD) | Pain today |
|---|---|---|---|
| 1 | **Student (15–24)** — Aarav, JEE/NEET/CUET aspirant | "When I apply to 10–30 exams/colleges a year, help me submit each one correctly in minutes, not hours." | Retyping parents' details + income + category every time; uploads that fail size/format checks; tracking 15 portals with different deadlines |
| 2 | **Parent** — Sunita, manages 2 kids + her mother | "When I fill forms for people who can't fill their own, let me act for them cleanly and legally, without re-entering the same family data per child." | No consented, auditable way to "act for" a minor or elder; re-enters the same family facts per child |
| 3 | **Job seeker / fresher (21–30)** | "When I apply to jobs and PSU/government exams, let my education and identity facts follow me instead of re-proving them per employer." | Re-KYC per employer; background-verification delays; 10th/12th/degree proof required afresh each time |
| 4 | **Working professional (25–50)** | "When my address or bank details change, let that one update propagate to everything I've consented to share it with." | KYC fatigue across bank/insurance/rentals/passport/tax/EPFO; an address change propagates nowhere |
| 5 | **Senior citizen (60+)** | "When I need to prove I'm alive/eligible for a pension or health scheme, let a trusted person do it for me without exposing everything I own." | Digitally excluded (13–15% internet usage per research 02 §Part C); biometric auth fails with aged fingerprints; needs a delegate |
| 6 | **Institution admin** — exam board, college, employer, hospital | "When I need verified applicant data at scale, let me get it pre-verified instead of manually checking documents for fraud." | Bad data, manual verification load, document fraud, no standard field set |
| 7 | **ApplyOnce admin/ops** | "When something goes wrong (fraud, breach, abuse), let me see and act on it fast with a full audit trail." | — (internal persona; no external pain, but the product must give them this or trust collapses) |

## 4. Feature list by surface (MoSCoW + acceptance criteria)
Priority key: **M**ust (v0.9 demo blocker) · **S**hould (v1.0 pilot) · **C**ould (v1.5+) · **W**on't (not in this roadmap).

### 4.1 Citizen web/PWA
| Feature | Pri | Acceptance criteria |
|---|---|---|
| Auth: phone OTP + passkey (WebAuthn) | M | OTP rate-limited (6-digit, 5-min expiry); session persists across restart; step-up (`sessions.stepped_up_at` ≤5 min) required before any share/export |
| Onboarding wizard (≤6 min) | M | Mock DigiLocker connect returns seeded fixture in ~2s with progress SSE; wizard ends with a created passkey and a completion % on Home |
| Vault (10 sections) | M | Every `FactRow` renders a `SourceChip`; sensitive facts masked, reveal requires step-up; no fact ever renders without provenance (hard invariant, tested) |
| Documents (DigiLocker / upload / generated) | M | OCR-proposed facts land as `source=document_extracted`, distinct from `issuer_verified`; an extraction conflicting with an issuer-verified value creates a `mismatch` row, never silently overwrites |
| Verifications hub | S | Expiry reminders fire at 60/30/7 days before `facts.expires_at`; mismatch list shows severity and a guided fix path |
| Connections & consent ledger | M | One-tap revoke sets `consents.revoked_at` and fires the partner's `consent.revoked` webhook within the retry window; `/me/export` and `/me/erase` both functional |
| Apply with ApplyOnce (share flow) | M | `FieldDiff` accurately reflects requested vs. available vs. missing; **no share can be created without a valid, unrevoked, in-scope consent** (DB trigger + test, per `docs/02-ARCHITECTURE.md` §6) |
| Applications tracker | M | Partner status pushes appear in the timeline via SSE within seconds of `POST /partner/applications/:id/status` |
| Family (dependents & delegation) | M | Adding a minor creates a ward `profile` + `relations(basis='minor')`; handover-at-18 SMS flow works; a guardian's default share scope for a minor excludes `health.*` unless explicitly step-up confirmed (per `docs/07-USE-CASE-CATALOG.md` §4) |
| Settings (language, security, privacy) | S | EN/HI toggle changes all labels via the registry's `Label{en,hi}`; audit log viewer shows the citizen's own `audit_log` rows |
| Command bar (Cmd-K) | C | Jumps to section/application/partner in ≤2 keystrokes |
| PWA installability / offline vault read | C | Manifest + service worker; last-synced vault view readable offline |

### 4.2 Partner console
| Feature | Pri | Acceptance criteria |
|---|---|---|
| Org onboarding | M | Self-serve CIN/UDISE/AISHE/GSTIN check + manual review queue in admin; sandbox API key issued immediately, live key only after `partners.status='verified'` |
| Form builder | M | Field picker is restricted to `SHAREABLE_KEYS` from the registry; selecting a purpose auto-drops keys `canShare()` returns false for (per `packages/schema/src/consent.ts`) |
| Applicants table with per-field verified badges | M | Each cell shows `source` from the payload; drawer shows the full `ApplyOncePayload` for that applicant |
| Verification requests | S | `POST /partner/verification-requests` creates a citizen-visible request; citizen can re-verify or decline with a reason |
| Webhooks + JWKS | M | Deliveries HMAC-signed (`X-ApplyOnce-Signature`), retried 5× exponential backoff, deduplicated via `Idempotency-Key`; `GET /partner/jwks` serves current signing keys |
| API keys (sandbox/live) | M | Keys hashed at rest (`key_hash`), never returned again after creation, revocable |
| Bulk import of legacy applicants | C | CSV import maps to registry keys with a dry-run diff before commit |
| Analytics / fraud signals | W (v0.9) / C (v1.5) | Deferred — no fraud-signal ML in scope before pilot data exists |

### 4.3 Admin
| Feature | Pri | Acceptance criteria |
|---|---|---|
| Partner approvals | M | Approve/suspend changes `partners.status`; suspension immediately blocks new share sessions |
| Provider health dashboard | S | Shows per-provider job success rate and latency from `verification_jobs` |
| Job queue monitor | S | BullMQ queue depth/failure visibility |
| Flags | S | Per-org rollout via the `flags` table, no redeploy needed |
| Abuse reports | C | Manual triage queue |
| Data-principal requests queue | M | Every `data_requests` row (export/erase/correct) visible with SLA countdown — required for DPDP compliance (`docs/08-INTEGRATIONS-PLAN.md` §2) |
| Audit search | M | Full-text/actor/target search over `audit_log`, hash-chain integrity check visible |

### 4.4 Demo exam portal (`apps/demo-exam-portal`)
| Feature | Pri | Acceptance criteria |
|---|---|---|
| "Bharat Test Agency — BTA-JEE 2026" 6-step, 48-field form | M | "Fill manually" path has a visible timer (feels the pain, ~20s minimum before the point lands); "Apply with ApplyOnce" completes the same form in <90s end-to-end |
| Status push admin panel | M | Demo admin can push "Admit card released"; appears in the citizen's ApplyOnce tracker within seconds |

### 4.5 Extension (Chrome MV3)
| Feature | Pri | Acceptance criteria |
|---|---|---|
| Web handshake login (short-lived extension token) | M | Passkey confirmed on the web page, never re-entered in the extension popup |
| Recipe engine + `generic` label-heuristic fallback | M | A portal with no dedicated recipe still gets partial autofill via label-text matching |
| `nta-jee`, `nsp` recipes (P1: at least one exam + NSP) | M | Recipe JSON in `apps/extension/recipes/*.json` maps `{selector, fact_key, transform}`; badge shows accurate fillable-field count before click |
| Sequential fill with highlight sweep | M | 40 fields fill in <2s total, 40ms stagger, skips captcha/file inputs (per `docs/04-DESIGN-SYSTEM.md` §4) |
| Application-ref capture post-submit | S | Confirmation page's reference number is captured into `applications.external_ref` with `source='extension'` |
| Community-contributable recipes | C | Recipe schema documented; PR template exists |

### 4.6 SDK (`@applyonce/sdk`)
| Feature | Pri | Acceptance criteria |
|---|---|---|
| "Apply with ApplyOnce" button (script tag) | M | Renders from `data-applyonce-form`, opens `share_url` in popup or redirect |
| Node server helper | M | `createShareSession`, `exchange`, `verifyWebhook`, `pushStatus` all typed against `ApplyOncePayload` from `packages/schema` |
| Typed payload + signature verification | M | Partner can verify the JWS against `GET /partner/jwks` without a ApplyOnce-provided library if they choose |
| SDKs beyond Node (Python, PHP, Java) | W | Not in scope until ≥3 non-Node partners request it |

## 5. Non-goals (v0.9–v1.5)
Native mobile apps (PWA first) · storing biometrics · replacing DigiLocker/UMANG · becoming a DPDP Consent Manager or an AA Financial Information User directly (ApplyOnce integrates with/white-labels under existing licensed entities — `docs/08-INTEGRATIONS-PLAN.md` §2–3) · government-only distribution · becoming an AUA/KUA for online Aadhaar auth · full ITR-via-Account-Aggregator (not live nationally as of this writing) · direct CKYC registration (access-gated to PMLA reporting entities).

## 6. Success metrics
- Time to complete a 40-field exam form: **<90s** with ApplyOnce vs. ~25min baseline.
- Onboarding completion rate ≥60%; DigiLocker connect success ≥85%.
- Verified-fact coverage per active profile ≥20 facts.
- Partner integration time ≤1 day (sandbox → first successful share).
- Zero unconsented shares (hard invariant, tested every CI run).
- Applications-per-profile re-use rate ≥2 by v1.0 pilot (`docs/09-GTM-AND-BUSINESS.md` §10).
- Cost per application vs. the ₹50–150 manual/CSC baseline (`docs/09-GTM-AND-BUSINESS.md` §3, §D).

## 7. Release plan

**v0.9 — Demo (judge/investor-facing, all providers mocked).** The full P1 feature set above at **Must** priority: vault, onboarding, Apply-with-ApplyOnce share flow, applications tracker, family/delegation, connections/consent ledger, the BTA-JEE demo portal, and an extension covering at least the demo portal's "Fill manually" path plus one real legacy recipe. All three golden Playwright flows (onboarding, apply-with-applyonce, extension fill on demo portal) green in CI. `docker compose up` gives a working demo with seeded users in <3 minutes.

**v1.0 — Pilot (one real institution + one CSC district).** Keep each integration independently gated: approved DigiLocker Requester, registered OVSE for Aadhaar offline/App VC, approved PAN intermediary and ASP agreement with an empanelled eSign provider. One live institution or scholarship-body partner uses an ApplyOnce-hosted form/API. Autofill remains user-controlled on unintegrated portals. Notifications and data-principal export/erase work end-to-end.

**v1.5 — Scale (health vertical exploration, more states, regulatory maturity).** ABDM HIU exploration if health-vertical traction justifies the 6–9 month certification lift. Account Aggregator white-label conversation converts to a live integration if a partner FIU is secured. Extension recipe library to 50+ portals. Hosted "ApplyOnce Forms" for institutions with no dev team. DigiLocker pull live for additional e-District states beyond the 3 confirmed (Maharashtra, Karnataka, Tamil Nadu). Formal DPDP Consent Manager registration decision made once Phase 2 rules are live (14 Nov 2026).

## 8. Open questions
1. Consent Manager vs. Data Fiduciary posture — decide before the DPDP registration window opens (14 Nov 2026); v1.5 assumes Data Fiduciary integrating with a registered CM, but this should be revisited with legal counsel as volume grows.
2. Which state to pick for the CSC/VLE pilot district, and whether the scholarship or SSC/PSC wedge (research 04 §G Phase 1) is the better starting use case given local coaching-institute density.
3. When to introduce the CSC/VLE commission model (§09 revenue menu item 2) without undercutting the free-to-citizen promise.
4. How to handle the APAAR consent legal flux (Orissa HC ruling, pending Supreme Court direction) in the education-facts ingestion flow — build the mandatory-opt-out UI now or wait for the national mandate to formalize.
5. Whether to pursue a Sub-AUA commercial agreement in year one or defer online Aadhaar OTP entirely to v1.5+, given §8A offline XML already covers the highest-value identity facts.
6. Institution pricing: is a public exam body (SSC/state PSC) free-for-public-bodies per `docs/04-DESIGN-SYSTEM.md` page-7 §2 (`/for-institutions`), or does the ₹15–40/application fee apply uniformly regardless of institution kind?
7. Regional-language rollout sequencing beyond EN/HI (the registry already carries `Label{en,hi}` only — when to add a third language and which one, informed by the CSC-pilot state's dominant language).
