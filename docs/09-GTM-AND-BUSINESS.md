# 09 — GTM and Business

Source: `docs/research/04-market-competitors-gtm.md` (section refs §A–§G below). Figures are cited to the research doc rather than re-quoted from source URLs; treat anything not attributed as directional.

## 1. Global analogs — what to copy

**Myinfo (Singapore) is the closest analog and the template to copy** (§A). Sitting on top of Singpass (~97% adoption, 5M users, >41M transactions/month), Myinfo pre-fills >200,000 transactions/day across 800+ services, cutting application time up to 80% and lifting business approval rates ~15% through better data quality. The mechanic ApplyOnce should copy exactly: **the consent screen is dynamically generated from the API scope the requester asks for** — a business declares which data items it needs, Myinfo renders that exact list field-by-field for approve/decline, and the user can always fall back to filling manually. This is precisely `FieldDiff` + `ConsentSheet` in `docs/04-DESIGN-SYSTEM.md` §5. **Pricing template**: free up to 5,000 standard transactions/month per business (UEN), then metered, with a pricier tier for sensitive scopes, no onboarding fee — the best available anchor for ApplyOnce's own institution fee.

**Other analogs, one lesson each (§A):**
- **Estonia X-Road** — pure plumbing isn't monetisable by a private player; value capture happens one layer up, in the application experience.
- **EU EUDI Wallet / UK GOV.UK One Login / Apple Wallet mDL** — even wealthy, single-standard blocs take 4+ years and still aren't uniformly live; the fragmentation window is exactly what a private "verify once" layer can fill.
- **ID.me (US)** — proof a *private* company can become quasi-government identity infrastructure at scale and get paid: 156M+ users, live at 21 federal + 50 state agencies, $130M revenue (2023). Direct precedent for ApplyOnce's B2G ambitions.
- **Yoti** — architecturally closest of the Western players: consumer-free, B2B-paid, privacy-by-design, cannot monetise or access user data itself.
- **Plaid** — the direct financial analog to "verify once": integrate once, pull from 12,000+ institutions, $546M ARR (2025, +40% YoY). Confirms a connector layer monetised on the *consuming* side, not the citizen, can be large and profitable — ApplyOnce is structurally "Plaid for facts."
- **Common App (education)** — 1,097 member colleges, 10.8M applications in the 2025-26 season, a non-profit consortium charging colleges tiered annual fees, not per-application — the direct model CollegeDekho has already copied in India and one ApplyOnce should study for institution-fee design.
- **Job-autofill Chrome extensions (Autolin, FastApply, LazyApply)** — already-proven validation that citizens trust a browser extension to autofill sensitive applications; directly de-risks ApplyOnce's own extension mechanic.

## 2. India landscape

**DigiLocker** (§B) — 67.63 crore users (Mar 2026), ~4x growth since 2022, 950 crore+ documents issued. It is a document locker and pull-based sharing rail, **not** a structured-fact autofill engine — it hands over a PDF/XML, never pre-filled form fields. This is ApplyOnce's central wedge.

**UMANG** — 11.66 crore users, ~798 crore transactions, a services super-app/portal, again not an autofill layer.

**MeriPehchaan (NSSO)** — India's actual "single citizen profile" push (July 2022): unifies Jan Parichay/e-ApplyOnce/DigiLocker into one login across 1,992+ services. It solves *authentication* fragmentation, not *form-filling* fragmentation. **No current Indian government product auto-fills arbitrary third-party (exam/college/hospital) forms today** — this is the direct answer to "won't government just build this."

**Account Aggregator (Sahamati/DEPA)** — 2.88 billion accounts enabled, 780+ institutions, 269M+ consents processed. Proof India can run a working, RBI-recognised, consent-artefact intermediary at billion-scale — ApplyOnce's consent ledger should be architected the same way, not invented fresh.

**Haryana Parivar Pehchan Patra (PPP)** — the single most important domestic precedent: a verified, centralised family profile (names, ages, relationships, income, demographics) that gateways 650+ schemes and **actually auto-enrolls and auto-updates eligibility** for pensions, scholarships and subsidies without re-application. This is the only mechanism found in India today that genuinely auto-fills/auto-applies on a citizen's behalf — but it is state-government-only, welfare-scoped, and unusable for private exam/college/KYC forms. Rajasthan's Jan Aadhaar and UP's e-Sathi follow a similar logic. **Net finding**: PPP validates ApplyOnce's "family graph + one-tap apply" vision but leaves cross-institution exam/college/KYC use wide open.

**Meritto (formerly NoPaperForms)** — the admissions CRM behind enquiry-to-enrollment for 1,200+ institutions across India/UAE/SEA. Sits exactly at the point where colleges collect applicant data, making it a **natural distribution/integration partner, not a competitor** — a "Verified with ApplyOnce" widget inside Meritto's forms mirrors Myinfo plugging into a Singaporean business form.

**CSC/VLE network — the underrated channel.** 5.3–5.8 lakh operational Common Service Centres run by 500,000+ Village Level Entrepreneurs, each covering ~6 villages, already delivering G2C/B2C services and informally filling forms for a fee. A ready-made, government-endorsed last-mile channel with existing citizen trust and a commission-based business model — cheaper acquisition than paid digital marketing for the Bharat-market user (§C).

**KYC/verification API vendors (Signzy, HyperVerge, IDfy, Karza/Perfios, Digio, Setu, Zoop, Surepass, Gridlines, Decentro, Bureau)** — power most neobanks/brokers/lenders' backends. **Not competitors**: point-verification APIs called once per transaction, no persistent consumer-owned profile. ApplyOnce's posture: buy their APIs as suppliers, differentiate on the consumer-owned, reusable, consent-ledgered layer none of them offer.

**Who is closest to "profile autofill for exams" today? No one, cleanly.** CollegeDekho/Shiksha solve multi-college applications via lead-gen, not verified reusable data; Meritto solves the institution back-office, not consumer-facing; job-autofill extensions solve the mechanic for résumés, not verified government facts; Haryana PPP solves auto-enrollment but only for state welfare. ApplyOnce's opportunity is the union of all four.

## 3. Business model & pricing

**Pricing anchors** (§D): Myinfo — free to 5,000 tx/month per business, then metered, premium tier for sensitive scopes. Persona — $250/month base + $0.10–$0.45/verification. Setu AA — ₹10–25/successful fetch. India's KYC-software market is ~$45.9M (2025) → projected $496.1M by 2034 (30.8% CAGR), tiny against the global $6.73B→$16.31B market — evidence India is under-monetised and ripe for a domestic-first vertical player. **ApplyOnce's starting price: ₹15–40 per verified application pushed to an institution** — undercuts a manual document-verification clerk while sitting inside these per-check benchmarks.

**Revenue model menu, ranked by near-term viability (§D):**
1. **B2B2C per-verified-application fee** (₹15–40/application) — the primary engine.
2. **CSC/VLE channel commission** — VLEs earn a per-profile commission for onboarding citizens, turning the 500,000+ VLE network into distribution rather than a bypass.
3. **B2C premium** — family document vault, faster re-verification, priority support (Yoti/Clear-style upsell) — secondary, not the early engine.
4. **Government/DPI partnership or tender** — an Entity-Locker/API-Setu-style MoU with a state scholarship or single-window portal, ONDC-style network-participant positioning.
5. **Coaching-institute/university-CRM (Meritto) partnerships** — white-labelled "Verified Apply," revenue-shared rather than competing for the same institution relationship.

## 4. TAM / SAM / SOM

Volume anchors (§D): JEE Main 2026 ~15–17 lakh unique candidates; SSC CGL 2025 alone 28.15 lakh applicants, SSC CHSL 2025 3M+ (just two of SSC's dozen-plus annual exams, consistent with the commonly cited ~50 lakh/year SSC total); NEET UG ~24 lakh; CUET UG ~13–15 lakh; NSP disbursed ₹8,000 crore to 2 crore+ students in FY2024-25; Account Aggregator spans 2.88 billion linked accounts.

- **TAM** — every application in India requiring identity/eligibility proof per year: competitive exams (well over 1.5–2 crore applications/year across SSC/JEE/NEET/CUET/state PSCs/railways/banking), scholarships (NSP ~2 crore students/year), college admissions (aggregators already process tens of lakhs of applications/year), and KYC events across fintech/telecom (hundreds of millions of Aadhaar e-KYC transactions/year — 2.21 billion Aadhaar authentications in August 2025 alone).
- **SAM** — the subset reachable via legacy-portal autofill + institution partnerships in years 1–3: scholarships, SSC/state-PSC-style recruitment, Meritto-powered private colleges — on the order of **3–5 crore applications/year**.
- **SOM** (year one) — a few lakh verified profiles and tens of thousands of completed autofilled applications across 2–3 pilot exam bodies/institutions and one CSC-channel district. Deliberately narrow (§G).

## 5. Moats

1. **Consent ledger + structured facts** — a fine-grained, auditable record of what was shared with whom under which consent, independent of the underlying document; more portable across arbitrary forms than DigiLocker's document-sharing or AA's account-linking.
2. **Extension "recipes"** — a maintained field-mapping library for hundreds of legacy portals is laborious to replicate and compounds with usage (more users → more portal coverage → more useful to the next user).
3. **Institution network effects** — once an exam body or college integrates "Apply with ApplyOnce," switching cost is high, mirroring why Common App's college network (not its UI) is its real moat.
4. **Family graph** — a consented, PPP-style family linkage is powerful for dependent/co-applicant scholarships and income-linked benefits, and hard for point-solution KYC vendors to build since it needs durable multi-person trust, not a single transaction.

## 6. Risks (§F)

| Risk | Detail | Mitigation |
|---|---|---|
| Chicken-and-egg | Citizens won't build a profile until institutions accept it; institutions won't integrate until citizens exist | One narrow, high-frequency, low-competition wedge first (Common App/Myinfo/Plaid pattern) — extension autofill needs zero partner cooperation to start delivering value |
| Government builds it themselves | MeitY shipped DigiLocker, MeriPehchaan, APAAR, Entity Locker (Jan 2025) in four years — an accelerating appetite | Be complementary infrastructure consuming DigiLocker/AA/APAAR/ABDM as rails; win on what government moves slowly on (recipe library, polished UX), never compete on the rails |
| Trust/privacy backlash | DigiYatra's documented "defective consent" controversy (coerced enrollment, Section-8 structure partly outside RTI, third-party SDK data-sharing concerns) | Every rendered fact carries a `SourceChip`; every share carries a `consent_id`; consent screens are never nudged by an intermediary on the citizen's behalf |
| Aadhaar Act constraints | Only licensed AUAs/KUAs/Sub-AUAs can do online Aadhaar auth | Build the MVP around §8A offline verification (no licence); treat online auth as a v2+ Sub-AUA-partnership item |
| Data-breach liability | DPDP penalties up to ₹250 crore; identity+income+caste+health+family in one place is an attractive target | Architectural: store facts + a consent ledger, not raw source documents, to minimise blast radius |

## 7. 12-month GTM plan (§G)

**Phase 1 — Months 1–4, narrow wedge.** One Tier-2 city with high coaching-institute density and strong CSC penetration (Kota, Patna, Indore, or Lucknow) and one low-competition, high-repeat-application use case — **scholarships (NSP) or a state SSC/PSC-style exam**, deliberately not JEE/NEET (tightly NTA-controlled, low receptivity to overlays). Ship: DigiLocker requester integration, offline-Aadhaar-XML upload, an extension MVP covering 5–10 of the highest-volume legacy portals (NSP + one SSC/state portal). Partner with 2–3 coaching institutes as first distribution. **Metrics**: verified profiles created, successful autofills, time saved per application.

**Phase 2 — Months 5–8, institution pilot + CSC channel.** Sign 1–2 institutions or a scholarship/exam body for a live "Apply with ApplyOnce" button; onboard 20–50 CSC/VLE operators in one district as a paid channel. Start the Sub-AUA/KUA partner conversation and the Sahamati AA-FIU certification process in parallel. **Metrics**: institution partners live, CSC-driven signups, consent events logged, re-use rate (applications/profile ≥2).

**Phase 3 — Months 9–12, scale and regulatory maturity.** Expand the extension recipe library to 50+ portals, add family-graph and income/caste-certificate facts, pursue an Entity-Locker/API-Setu-style pilot MoU with one state government portal (NASSCOM/iSPIRT endorsement if possible). Explore ABDM HIU for hospital-OPD-registration only if traction supports it. **Metrics**: MAU/verified-profile ratio, B2B revenue per verified application, CSC network size, cost per application vs. the manual/clerk baseline.

**Ecosystem support**: iSPIRT (DEPA/OCEN/AA policy design, working groups, fastest route to credibility), Sahamati (AA onboarding/sandbox/Aikya/Labs), NASSCOM + MeitY Startup Hub (GENESIS, Samridh), NIDHI (DST pre-seed/seed grants), plus state startup policies (Maharashtra, Karnataka, Telangana, Gujarat, UP) for seed grants/GST reimbursement/co-working credits.

## 8. The pitch (one paragraph)

Every year, tens of millions of Indians re-type the same dozen facts about themselves — name, Aadhaar, category certificate, income, address, marks, bank details — into hundreds of different exam, college, scholarship, KYC and hospital forms, re-uploading the same documents and re-proving the same eligibility each time. Singapore solved this with Myinfo (200,000 prefilled transactions a day, 80% faster applications), and India has already built world-class rails to do the same — DigiLocker's 676 million users, the Account Aggregator's 2.88 billion linked accounts, APAAR's 263 million student IDs — but no one has built the consumer-owned, consent-ledgered "verify once" layer that sits on top and actually fills in the form. ApplyOnce is that layer: a verified citizen profile with one-tap consent, an "Apply with ApplyOnce" button for institutions, and a browser extension that autofills the legacy portals that will never get a native API — turning India's digital public infrastructure into the last-mile product experience it has been missing.

## 9. Investor objections, answered

1. **"DigiLocker/MeitY will just build this."** MeitY builds document lockers and SSO at multi-year cadence and has never shipped a third-party form-autofill layer; government rollout speed (the EU's multi-year EUDI struggle, Apple Wallet mDLs reaching only ~15 US states after years) is structurally slower than a startup's iteration loop. ApplyOnce is the last mile, consuming rather than competing with government rails.
2. **"Chicken-and-egg — no one builds a profile with no institutions live."** Common App, Myinfo and Plaid all solved this by seeding one narrow, high-frequency, low-competition wedge before broadening — Phase 1 is designed explicitly around that sequencing.
3. **"This is just another KYC vendor in a crowded field."** Those are point-verification APIs called once per transaction with no persistent, consumer-owned, cross-institution profile; ApplyOnce is structurally closer to Plaid or Myinfo, and can buy those vendors' APIs as suppliers rather than compete with them.
4. **"Privacy backlash risk (DigiYatra) kills trust."** Precisely because DigiYatra's failure was a *consent* failure, not a technology failure, ApplyOnce's architecture (`SourceChip` on every rendered fact, a `consent_id` on every share, a DEPA-pattern consent ledger) is built to make consent auditable and revocable by design — a differentiator investors and regulators can verify, not a claim.
5. **"No Aadhaar/AA/ABDM licence — how do you launch at all?"** The Day-1 path (DigiLocker requester registration, offline Aadhaar XML, a licence-free browser extension) gets a real, monetisable product live well before any Sub-AUA, AA-FIU, or Consent Manager registration is needed — those come in months 3–18 once there is traction and revenue to justify the compliance investment.

## 10. KPIs to track from day one
- Verified profiles created; verified-fact coverage per active profile (target ≥20 facts, per `docs/01-PRD.md` §7).
- Successful autofills (extension) and successful shares (SDK); time-to-complete a 40-field form vs. baseline (target <90s vs. ~25min, per PRD §7).
- Applications per profile (re-use rate, target ≥2 by Phase 2).
- Institution partners live; CSC/VLE-driven signups; partner integration time (target ≤1 day sandbox-to-first-share).
- Consent events logged and revocation rate; zero unconsented shares (hard invariant, tested).
- Revenue per verified application pushed; cost per application vs. the manual/clerk (CSC) baseline of ₹50–150/form.
