# 01 — Product Requirements Document: Praman

## 1. Problem
A citizen's identity and life facts are re-typed, re-uploaded and re-verified thousands of times across their life. Each application (exam, college, scholarship, bank, hospital, employer, government scheme) rebuilds the same profile from scratch, with the same 30–60 fields and the same 6–12 documents. Errors creep in (name spelling mismatch across Aadhaar/PAN/marksheet is the #1 rejection cause), deadlines are missed, and nobody has a single view of "what did I apply to, and what happened".

DigiLocker solved *document storage and issuer-verified copies*. It did not solve:
1. **Structured, verified facts** (a marksheet PDF ≠ "Class 12 PCM aggregate: 91.2%, CBSE, 2024, roll 1234567").
2. **Push into forms** — the citizen still types.
3. **Consent + purpose scoping** for each share, with a ledger the citizen can read.
4. **Lifecycle** — applications, admits, results, appointments flowing *back* into the profile.
5. **Family** — parents managing minors, adult children managing elderly parents.

## 2. Vision
The verified-profile layer for India: **enter once, verify once, apply anywhere, track everything.**

## 3. Personas
| Persona | Core job | Pain today |
|---|---|---|
| **Student (15–24)** — Aarav, JEE/NEET/CUET aspirant | Apply to 10–30 exams/colleges a year | Retyping parents' details + income + category, certificate uploads that fail size/format checks, tracking 15 portals |
| **Parent** — Sunita, manages 2 kids + her mother | Fill forms for people who can't | Same data across kids, no way to "act for" a minor legally + cleanly |
| **Job seeker / fresher (21–30)** | Apply to jobs, PSU exams, gov recruitment | Re-KYC per employer, background verification delays, 10th/12th/degree proof each time |
| **Working professional (25–50)** | Bank, insurance, rentals, passport, tax, EPFO | KYC fatigue, address change propagates nowhere |
| **Senior citizen (60+)** | Pension, health, hospital, life certificate | Digitally excluded; a trusted delegate must act |
| **Institution admin** — exam board, college, employer, hospital | Collect verified data at scale | Bad data, manual verification, document fraud |
| **Praman admin / ops** | Trust & safety, provider health, audit | — |

## 4. Use-case map (extensive)
Grouped by life stage. ✅ = Phase 1 target, 🔜 = Phase 2, 🧭 = Phase 3 / partner-dependent.

### 4.1 Education
- ✅ Competitive exam forms: JEE Main/Adv, NEET, CUET, GATE, CAT, CLAT, NDA, UPSC prelims, SSC, state CETs
- ✅ College applications: central (JoSAA/CSAB counselling), state counselling, private universities (own portals), study-abroad common data
- ✅ School admissions (nursery → Class 11), transfer certificates, inter-board migration
- ✅ Scholarships: NSP (National Scholarship Portal), state scholarships, private (Reliance, Tata, Aditya Birla), merit-cum-means
- ✅ Certificates: 10th/12th marksheets (CBSE/ICSE/state boards via DigiLocker), degree/provisional/transcript (NAD), APAAR ID / Academic Bank of Credits
- 🔜 Hostel, mess, library, exam-hall-ticket data sync; internship applications (AICTE, company portals)
- 🔜 Education loan (income + admission proof + co-applicant)
- 🧭 Sports/NCC/NSS quota certificates, PwD certificates, EWS/OBC-NCL certificate validity tracking (they expire — remind & re-fetch)

### 4.2 Identity & civic
- ✅ Aadhaar (offline XML), PAN, Voter ID, Passport data page, Driving Licence, ration card — as verified facts + linked documents
- ✅ Address history with "current / permanent / correspondence" roles; one change → suggest updates everywhere consented
- 🔜 Name-mismatch detector across Aadhaar/PAN/marksheet/passport with a guided fix path
- 🧭 Passport application prefill, new voter registration, Aadhaar update appointment prefill

### 4.3 Financial & KYC
- ✅ Bank/NBFC/fintech KYC via "Apply with Praman" (CKYC-aligned field set)
- ✅ Family income (self-declared + ITR/Form-16 proof via Account Aggregator 🔜) → feeds scholarships, EWS, fee waivers
- 🔜 Insurance proposal forms, mutual fund onboarding, demat, loan applications
- 🧭 DBT scheme eligibility engine (PM-Kisan, PMAY, Ayushman, state schemes) from profile facts

### 4.4 Health
- ✅ ABHA (Ayushman Bharat Health Account) link; hospital OPD registration prefill; emergency card (blood group, allergies, emergency contacts)
- 🔜 Vaccination records (CoWIN), lab reports flowing into health section with consent, insurance claim prefill
- 🧭 Medical fitness certificates for exams/jobs, disability certificate (UDID)

### 4.5 Employment
- ✅ Job applications (company portals, Naukri-style), fresher onboarding packet (ID, education, address, bank), background-verification handoff
- 🔜 EPFO/UAN, ESIC, Form-16 collection, experience letters as verified facts
- 🧭 Government recruitment (SSC, railways, banking IBPS, state PSC) with category/age relaxation auto-computed

### 4.6 Family & delegation
- ✅ Parent ↔ minor: guardian creates and manages a child profile; child takes over at 18 (handover flow)
- ✅ Adult ↔ elderly parent: delegated access with scope + expiry; pension life-certificate reminders
- 🔜 Spouse/household shared facts (address, ration card, family income) with per-fact ownership
- 🧭 Nominee / next-of-kin sharing on death (legal-hold state)

### 4.7 Housing, travel, daily life
- 🔜 Rental agreements + police verification prefill, society/gate apps, utility connections
- 🔜 Visa forms (common fields), hotel/airline KYC, SIM re-KYC
- 🧭 Vehicle registration/transfer, property registration prefill

### 4.8 Institution side (the other half of the marketplace)
- ✅ **Partner console**: register org, create a form from the canonical schema (pick fields, mark required, add custom fields), get an "Apply with Praman" button + verified JSON webhook
- ✅ **Verification requests**: institution asks applicant for a *fresh* verification of a specific fact (e.g., re-verify category certificate)
- ✅ **Application lifecycle push**: institution posts status events (received → under review → shortlisted → admitted / rejected → enrolled) that appear in the citizen's tracker
- 🔜 Bulk import of legacy applicants, fraud signals (document tamper, duplicate identity), analytics
- 🧭 Hosted forms (Praman Forms) for institutions with no dev team

## 5. Feature list (Phase 1 = shippable product)

### Citizen app
1. **Auth**: phone OTP + passkey (WebAuthn); device management; session list; recovery via secondary phone/email.
2. **Onboarding wizard** (≤ 6 min): mobile → name → DigiLocker connect (pull Aadhaar-seeded docs) → auto-populate identity & education → review → set passkey.
3. **Vault** with sections: Identity · Contact & Addresses · Family · Education · Category & Income · Employment · Health · Bank · Documents. Each *fact* has: value, source (`self_declared | document_extracted | issuer_verified`), verification status, evidence link, last-verified date, expiry.
4. **Documents**: DigiLocker-issued (fetched, hash-verified), uploaded (OCR-extracted → proposed facts you confirm), generated (Praman-signed profile summary PDF/QR).
5. **Verifications hub**: per-provider status, re-verify, mismatch warnings (name/DOB across sources), certificate expiry reminders.
6. **Connections & consent ledger**: every org that ever received data, what fields, purpose, timestamp, expiry; one-tap revoke; DPDP-style data-principal rights (export, delete).
7. **Apply with Praman**: consent screen → select profile (self/dependent) → field diff (what they ask vs what you have) → missing-field mini form → OTP/passkey → share. Returns to partner with signed payload.
8. **Autofill extension** (Chrome/Edge, MV3): detects known portal (NTA, JoSAA, NSP, generic) via field-mapping recipes; fills from vault after passkey; captures the application's reference number back into tracker.
9. **Applications tracker**: timeline per application; deadlines; documents attached; status updates from partners; reminders (push/SMS/email).
10. **Family**: dependents (minors, elders) with delegated scopes; switch-profile; handover at 18.
11. **Settings**: language (EN/HI first, then regional), notifications, privacy, export, delete, audit log.

### Partner console
12. Org onboarding (verification via CIN/UDISE/AISHE/GSTIN self-serve + manual review), API keys, sandbox/live.
13. Form builder mapped to canonical schema; embed snippet; webhook config; test with sandbox citizen.
14. Applicants table (verified badge per field), verification requests, status push, exports.

### Platform
15. Provider adapter layer (mock · sandbox · live) for: DigiLocker, Offline Aadhaar, PAN, ABHA, Account Aggregator, e-Sign, OCR.
16. Field-level encryption, per-user data keys, full audit log, rate limits, abuse detection.
17. Demo exam portal ("Bharat Test Agency — Sample Exam 2026") that consumes the partner SDK end to end — this is the judge/investor demo.

## 6. Non-goals (Phase 1)
Native mobile apps (PWA first) · storing biometrics · replacing DigiLocker/UMANG · being a consent manager under DEPA for financial data (we *use* AAs, we don't become one) · government-only distribution.

## 7. Success metrics
- Time to complete a 40-field exam form: **< 90 s** with Praman vs ~25 min baseline.
- Onboarding completion rate ≥ 60%; DigiLocker connect success ≥ 85%.
- Verified-fact coverage per active user ≥ 20 facts.
- Partner integration time ≤ 1 day (sandbox → first successful share).
- Zero unconsented shares (hard invariant, tested).

## 8. Risks & mitigations
| Risk | Mitigation |
|---|---|
| Regulatory (DPDP, Aadhaar Act) | Never store Aadhaar number in plain; store last-4 + reference key + offline-XML hash; purpose-bound consent; DPO role; data-principal rights built in |
| Provider access (API Setu ToS) | Adapter layer; ship with aggregator sandbox; org registration in parallel |
| Fraud (uploaded docs) | Prefer issuer-verified sources; mark self-declared clearly; partners see source per field |
| Chicken-and-egg (partners) | Extension autofill works with *zero* partner cooperation; demo portal proves SDK; target private universities & coaching institutes first |
| Digital exclusion | Delegation model; Hindi-first copy; low-bandwidth PWA; SMS fallbacks |
