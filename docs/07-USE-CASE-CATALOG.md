# 07 — Use-Case Catalog

Source: `docs/research/02-use-cases-and-forms.md` Parts A (150+ application types), B (14-form field analysis), D (special populations), E (v1 prioritisation). Registry keys are taken verbatim from `packages/schema/src/registry.ts` — nothing here invents a `fact_key`. Where a needed field does not yet exist in the registry it is flagged **[GAP]** with a proposed key, not treated as real.

## 1. How to read this catalog
- **Who fills** — `Self` (citizen, 18+) · `Guardian (minor)` (parent/guardian acting for a `profiles(kind='dependent')` under `relations.basis='minor'`) · `Delegate (elder)` (`relations.basis='elder_consent'|'poa'`) · `Self or guardian`.
- **Registry sections/keys** — the `packages/schema` sections (`identity, contact, address, family, category, education, employment, health, bank, prefs`) and the specific keys most load-bearing for that use case. Full field lists live in the registry; this column names the ones that differentiate the form.
- **Integration mode** — `SDK` (partner runs `@praman/sdk`'s "Apply with Praman" button, live consent+payload flow, `docs/05-API-AND-FLOWS.md` F2) · `Extension` (Chrome MV3 recipe autofills a legacy portal with no API, F3) · `Hosted form` (Praman Forms — a partner with no dev team picks fields, Praman hosts the form itself, P3) · `Manual tracker` (no integration exists; citizen applies elsewhere, Praman only tracks the `applications` row, deadline, and documents).
- **Phase** — ✅ P1 (v1 shippable) · 🔜 P2 · 🧭 P3, following the legend in `docs/01-PRD.md` §4.

## 2. Top-40 fields by cross-form frequency
Ranked from `docs/research/02-use-cases-and-forms.md` §B2 (counts are "out of the 14 forms analysed in Part B"; rows below that are marked *recurring* appear across the 150+ Part A application types but were not in the 14-form sample). Three fields the research flagged as **[GAP]** in Sept 2025 — `identity.place_of_birth`, `family.nominee.*`, `family.parent_govt_servant` — already exist in the current registry; they are listed here as resolved, not gaps.

| # | Field | Freq (of 14) | Registry key | Section |
|---|---|---|---|---|
| 1 | Full name | 14 | `identity.full_name` | identity |
| 2 | Date of birth | 14 | `identity.dob` | identity |
| 3 | Gender | 14 | `identity.gender` | identity |
| 4 | Mobile number | 14 | `contact.mobile_primary` | contact |
| 5 | Photograph | 13 | `identity.photo` | identity |
| 6 | Address (perm/current) | 13 | `address.permanent.*`, `address.current.*` | address |
| 7 | Email | 12 | `contact.email_primary` | contact |
| 8 | Signature | 11 | `identity.signature` | identity |
| 9 | Father's name | 11 | `family.father.name` | family |
| 10 | Aadhaar (masked) | 11 | `identity.aadhaar_last4` | identity |
| 11 | Social category | 10 | `category.social` | category |
| 12 | Nationality | 9 | `identity.nationality` | identity |
| 13 | PwD status | 9 | `category.pwd` | category |
| 14 | Mother's name | 8 | `family.mother.name` | family |
| 15 | Class 10 board/marks | 8 | `education.class10.*` | education |
| 16 | Class 12 board/marks/stream | 8 | `education.class12.*` | education |
| 17 | Parents' occupation | 7 | `family.father.occupation`, `family.mother.occupation` | family |
| 18 | Family annual income | 7 | `family.annual_income_total` | family |
| 19 | Exam-city preference | 6 | `prefs.exam_city_choices` | prefs |
| 20 | Domicile state | 6 | `category.domicile_state` | category |
| 21 | Marital status | 6 | `identity.marital_status` | identity |
| 22 | Bank account (masked) | 6 | `bank.primary.account_last4` | bank |
| 23 | IFSC | 6 | `bank.primary.ifsc` | bank |
| 24 | Category certificate no. | 6 | `category.certificate_no` | category |
| 25 | PAN | 6 | `identity.pan` | identity |
| 26 | Income certificate | 5 | `family.income_certificate` | family |
| 27 | Spouse's name | 4 | `family.spouse.name` | family |
| 28 | Religion | 4 | `category.religion` | category |
| 29 | Graduation degree/CGPA | 4 | `education.graduation[]` | education |
| 30 | Current employer | 3 | `employment.current.employer` | employment |
| 31 | Emergency contact | 3 | `health.emergency_contacts[]` | health |
| 32 | Guardian details | 3 | `family.guardian.*` | family |
| 33 | Blood group | 2 | `identity.blood_group` | identity |
| 34 | ABHA number | 1 (growing fast) | `identity.abha_id` | identity |
| 35 | Voter ID | recurring | `identity.voter_id` | identity |
| 36 | Driving licence no. | recurring | `identity.driving_licence_no` | identity |
| 37 | APAAR ID | recurring, optional | `identity.apaar_id` | identity |
| 38 | Passport number | recurring | `identity.passport_no` | identity |
| 39 | Exam scores/rank (JEE/NEET/CUET) | recurring | `education.exam_scores[]` | education |
| 40 | Account type (savings/current) | recurring | `bank.primary.account_type` | bank |

**Recommended schema additions (true gaps, not in `registry.ts` today — file under P2 before the passport/EPFO/NRI use cases below go live):**
- `identity.left_thumb : file_ref` — thumb impression required by NEET UG, IBPS, several state PSCs.
- `identity.citizenship_type : enum(birth, descent, registration, naturalisation)` — Passport Seva-specific.
- `identity.oci_no : string` — primary key for NRI/OCI applicants who have no Aadhaar.
- `family.ration_card_no : string` — feeds PDS/ONORC and several DBT-scheme eligibility checks.
Sibling-in-school/alumni-parent admission-points flags stay **out** of the canonical registry per the research recommendation — they are low-frequency and school-specific; model them as partner `customFields` on the `forms` table instead of new global keys.

## 3. Life-stage catalogue

### 3.1 Birth to 5
| Application type | Who fills | Registry keys | Mode | Phase |
|---|---|---|---|---|
| Birth certificate registration, Bal Aadhaar enrolment, ration-card newborn addition | Guardian (minor) | `identity.full_name`, `identity.dob`, `identity.gender`, `family.father.*`, `family.mother.*`, `address.permanent.*` | Manual tracker | 🔜 |
| Hospital discharge summary / immunisation (Mother & Child Protection) card, UIP vaccination schedule | Guardian (minor) | `health.*` (opt-in), `identity.dob` | Manual tracker | 🧭 |
| ABHA ID creation for infant | Guardian (minor) | `identity.abha_id`, `identity.blood_group` | Extension | 🔜 |
| PAN / passport for minor, minor bank account, Sukanya Samriddhi / child insurance proposal | Guardian (minor) | `identity.pan`, `identity.passport_no`, `bank.primary.*` | Extension | 🔜 |
| Nursery/play-school admission | Guardian (minor) | `identity.full_name`, `identity.dob`, `address.current.*`, `category.social` | Hosted form | 🔜 |
| Aadhaar address/mobile update on relocation | Self or guardian | `address.current.*`, `contact.mobile_primary` | Manual tracker | ✅ |

### 3.2 School (6–17)
| Application type | Who fills | Registry keys | Mode | Phase |
|---|---|---|---|---|
| Class 1 admission (KV, RTE 25% quota), school transfer/migration certificate | Guardian (minor) | `identity.*`, `address.current.*`, `category.social` | Hosted form | 🔜 |
| CBSE/ICSE/state board Class 10 & 12 exam registration | Guardian (minor)→Self at 12 | `education.class10.*`, `education.class12.*`, `identity.photo`, `identity.signature` | Extension | ✅ |
| Board re-evaluation/re-checking | Self or guardian | `education.class10.roll_no`, `education.class12.roll_no` | Manual tracker | 🔜 |
| NSP pre-matric scholarship (SC/ST/OBC/minority/disability), state pre-matric scholarships | Guardian (minor) | `category.social`, `family.annual_income_total`, `bank.primary.*`, `category.certificate_no` | Extension | ✅ |
| Olympiads (SOF/Silverzone), NTSE, INSPIRE-SHE, JNV Class 6/9, Sainik School AISSEE | Guardian (minor) | `identity.*`, `education.class10.school_name`, `category.social` | Extension | 🔜 |
| APAAR ID generation (DigiLocker + Aadhaar + parental consent) | Guardian (minor) | `identity.apaar_id`, `identity.aadhaar_last4` | SDK (issuer-side, P3) | 🧭 |
| UDID card for children with disabilities, CWSN exam/admission concessions | Guardian (minor) | `category.pwd`, `category.pwd_type`, `category.udid_no`, `category.scribe_required` | Manual tracker | 🔜 |
| Sports quota trials (SAI/Khelo India), school fee/EWS certificate renewal | Guardian (minor) | `category.social`, `category.certificate_no`, `category.valid_until` | Manual tracker | 🧭 |

### 3.3 Higher education (18–24)
| Application type | Who fills | Registry keys | Mode | Phase |
|---|---|---|---|---|
| Competitive exam cluster — JEE Main/Adv, NEET UG, CUET UG, GATE, CAT, CLAT, NDA, BITSAT, VITEEE, MHT-CET, KCET, WBJEE, EAMCET, COMEDK, NIFT/NID/UCEED/NATA, IPMAT | Self | `identity.*`, `family.father.*`, `family.mother.*`, `category.social`, `category.pwd`, `education.class10.*`, `education.class12.*`, `prefs.exam_city_choices` | SDK (P1 for BTA-style demo) + Extension | ✅ |
| JoSAA/CSAB counselling, NEET counselling (MCC), state engineering/medical counselling | Self | `education.exam_scores[]`, `category.certificate_no`, `category.valid_until`, `bank.primary.*` | Extension | 🔜 |
| Private university direct application (VIT/SRM/Manipal/Amity/LPU) | Self | `identity.*`, `family.father.occupation`, `education.class12.*` | SDK | ✅ |
| Study-abroad Common App, UCAS, TOEFL/IELTS/Duolingo, SAT/ACT, student visa (F-1/UK/Canada/Australia) | Self | `identity.passport_no`, `identity.nationality`, `education.graduation[]`, `bank.primary.*` | Manual tracker | 🧭 |
| NSP post-matric + state scholarships, Reliance/Tata/Aditya Birla/INSPIRE-SHE scholarships | Self | `category.social`, `family.annual_income_total`, `education.class12.percentage`, `bank.primary.*` | Extension | ✅ |
| Education loan (Vidya Lakshmi-style) | Self (+ co-applicant guardian) | `family.annual_income_total`, `family.income_certificate`, `education.graduation[]`, `bank.primary.*` | Extension | 🔜 |
| Hostel allotment, AICTE internship/apprenticeship | Self | `identity.*`, `address.current.*`, `education.graduation[]` | Manual tracker | 🔜 |
| Voter registration (Form 6, turning 18), first passport, first SIM KYC | Self | `identity.dob`, `identity.gender`, `address.permanent.*`, `identity.photo` | Extension | 🔜 |
| Driving licence — learner's + permanent | Self | `identity.dob`, `identity.blood_group`, `address.current.*` | Extension | 🔜 |
| First bank account, campus-placement PPT/application forms | Self | `bank.primary.*`, `education.graduation[]`, `employment.current.*` | SDK | ✅ |

### 3.4 Early career (21–30)
| Application type | Who fills | Registry keys | Mode | Phase |
|---|---|---|---|---|
| Campus placement, Naukri/LinkedIn/Indeed profile & applications | Self | `identity.*`, `education.graduation[]`, `employment.history[]` | Extension | ✅ |
| Government recruitment OTR cluster — UPSC CSE, SSC CGL/CHSL, IBPS PO/Clerk, SBI PO/Clerk, RRB, state PSCs, CDS, AFCAT, police recruitment | Self | `identity.*`, `category.social`, `category.pwd`, `education.*`, `prefs.exam_city_choices` | SDK/Extension | ✅ |
| CTET/state TET, GATE, CAT/XAT, GRE/GMAT | Self | `education.graduation[]`, `education.exam_scores[]` | Extension | 🔜 |
| Employee background verification, EPFO UAN generation (Form 11), ESIC registration | Self | `employment.current.uan`, `employment.history[]`, `bank.primary.*`, `identity.pan` | SDK | 🔜 |
| Employee onboarding packet (offer, Form 16, insurance nomination) | Self | `identity.*`, `bank.primary.*`, `family.nominee.*` | SDK | 🔜 |
| Professional body enrolment — Bar Council, NMC, ICAI articleship, ICSI | Self | `identity.*`, `education.graduation[]`, `education.postgrad[]` | Manual tracker | 🧭 |
| GST/Udyam/Startup-India-DPIIT/Shop & Establishment registration | Self | `identity.pan`, `address.current.*` | Manual tracker | 🧭 |

### 3.5 Adult life (25–50)
| Application type | Who fills | Registry keys | Mode | Phase |
|---|---|---|---|---|
| Bank/NBFC/fintech KYC, re-KYC, credit card, personal loan | Self | `identity.pan`, `identity.aadhaar_last4`, `address.*`, `bank.primary.*`, `family.nominee.*` | SDK | ✅ |
| Demat/trading account, mutual fund KYC (KRA) | Self | `identity.pan`, `bank.primary.*`, `employment.current.*` | SDK | 🔜 |
| Home/personal loan, ITR filing | Self | `family.annual_income_total`, `employment.current.ctc`, `bank.primary.*` | Manual tracker | 🔜 |
| Marriage registration, spouse name-change, passport for spouse/child | Self | `family.spouse.*`, `identity.marital_status`, `identity.passport_no` | Manual tracker | 🧭 |
| Rental agreement + tenant police verification | Self | `identity.*`, `address.current.*`, `address.permanent.*` | Extension | 🧭 |
| Property registration, vehicle registration/RC transfer, motor/life/health insurance proposal | Self | `identity.*`, `address.*`, `bank.primary.*`, `family.nominee.*` | Manual tracker | 🧭 |
| Passport renewal/reissue, Schengen/US/UK/Canada/Australia visas | Self | `identity.passport_no`, `identity.passport_expiry`, `identity.nationality` | Extension | 🔜 |
| Utility connections — electricity, LPG, water, broadband/DTH KYC, SIM re-KYC/porting | Self | `identity.*`, `address.current.*` | Extension | 🔜 |
| Hospital in-patient registration, health-insurance claim, ABHA-linked OPD | Self or guardian | `health.*`, `identity.abha_id`, `bank.primary.*` | SDK | 🔜 |
| PMAY, PM-Kisan, ration card, Ayushman Bharat (PMJAY), child's school admission/scholarship (as guardian) | Self/guardian | `family.annual_income_total`, `category.social`, `family.ration_card_no` **[GAP]** | Extension | 🔜 |

### 3.6 Senior citizens (50+/60+)
| Application type | Who fills | Registry keys | Mode | Phase |
|---|---|---|---|---|
| EPS monthly pension claim, NPS annuity/exit, state government pension | Delegate (elder) or self | `employment.current.uan`, `bank.primary.*`, `identity.dob` | Extension | 🔜 |
| Jeevan Pramaan (digital life certificate, annual) | Delegate (elder) or self | `identity.aadhaar_last4`, `identity.dob`, `bank.primary.*` | Extension | ✅ |
| Senior citizen ID card, railway senior-citizen concession | Self | `identity.dob`, `identity.photo` | Manual tracker | 🧭 |
| Ayushman Vay Vandana Card (70+ universal health cover) | Delegate (elder) or self | `identity.abha_id`, `identity.dob`, `health.*` | SDK | 🔜 |
| Senior Citizen Savings Scheme, reverse mortgage | Delegate (elder) or self | `bank.primary.*`, `family.nominee.*` | Manual tracker | 🧭 |
| Legal heir/succession certificate, will/nomination update across accounts | Delegate (elder or POA) | `family.nominee.*`, `bank.primary.*` | Manual tracker | 🧭 |

### 3.7 Cross-cutting (all ages) & DBT schemes
| Application type | Who fills | Registry keys | Mode | Phase |
|---|---|---|---|---|
| Disability certificate + UDID (any age) | Self or guardian | `category.pwd`, `category.pwd_type`, `category.pwd_percentage`, `category.udid_no` | Extension | 🔜 |
| Caste/income/domicile certificate issuance & renewal | Self or guardian | `category.certificate_no`, `category.valid_until`, `family.income_certificate_valid_until`, `category.domicile_certificate` | Manual tracker + expiry reminders | ✅ |
| Court affidavits (name-change, address, income, lost-document) | Self | `identity.full_name`, `address.*`, `family.annual_income_total` | Manual tracker | 🧭 |
| Gig-worker onboarding (Zomato/Swiggy/Uber/Ola/Urban Company), e-Shram card | Self | `identity.*`, `bank.primary.*` | Extension | 🔜 |
| NRI-specific — OCI card, NRE/NRO account, FATCA/CRS self-certification | Self | `identity.passport_no`, `identity.nationality` (`NRI/OCI`), `identity.oci_no` **[GAP]** | Manual tracker | 🧭 |
| 30 major DBT schemes (PM-KISAN, PMJAY, PMAY, MGNREGA, Ujjwala, PM-SVANidhi, Atal Pension, PM-YASASVI, IGNOAPS/IGNWPS/IGNDPS, PM Vishwakarma, ONORC, etc. — full list `docs/research/02-use-cases-and-forms.md` §Part A) | Self or guardian | `category.social`, `family.annual_income_total`, `bank.primary.*`, `family.ration_card_no` **[GAP]** | Extension + Manual tracker | 🔜/🧭 |
| Matrimonial profile, hackathon/event registration, co-working/gym/society KYC | Self | `identity.*`, `family.annual_income_total` | Extension | 🧭 |

## 4. Special-population product rules
These are binding product rules, not just data notes — they should show up as acceptance criteria in `docs/10-PRD-v2.md`.

- **Minors.** A guardian's consent-share scope for a ward must be *narrower than `*`* by default: allow `education.*`, `identity.*`, `category.*`, `address.*` for school/exam/scholarship purposes without extra friction, but require a fresh step-up + explicit purpose confirmation before a guardian can share `health.*` on a minor's behalf, even though `relations.scope` technically permits it. At 18, run the handover flow (`docs/05-API-AND-FLOWS.md` F5): the ward gets an SMS to claim the profile with their own phone/passkey before any further guardian-initiated share succeeds.
- **Seniors.** Default to `relations.basis IN ('elder_consent','poa')` with an explicit expiry (never open-ended) and a narrower default scope (`bank.*`, `health.*`, `category.*` — not the whole profile). Every senior-citizen use case above should also work through an assisted/CSC channel: a VLE can drive the same consent screen from a shared device as long as the elder still completes the OTP step personally — never accept a VLE's own OTP on the elder's behalf.
- **PwD.** Treat `category.udid_no` as the anchor credential; once verified, `category.pwd_type`/`pwd_percentage`/`scribe_required` should auto-populate every downstream exam/job form rather than being re-declared per application, mirroring the 2025 scribe-pool reform cited in research 02 §Part C. The UI itself must meet the accessibility bar in `docs/04-DESIGN-SYSTEM.md` §5 (screen-reader labels, 44px touch targets) — this is a product requirement, not just a data-model one.
- **Rural / low-bandwidth.** Every SDK/Extension flow needs a Manual-tracker-equivalent fallback: a Praman-generated, pre-filled PDF or a short share-code a CSC/VLE operator can use offline, so the CSC channel becomes a paid distribution partner (research 04 §C) rather than a bypass of Praman's consent guarantees.
- **NRI/OCI.** Identity resolution must not assume Aadhaar as the anchor. When `identity.aadhaar_last4` is absent, fall back to `identity.passport_no` + `identity.oci_no` (once added) as the primary verified identity source, matching the registry's existing multi-source model on `identity.full_name` (`aadhaar|pan|passport|self`).
- **Transgender citizens.** `identity.gender` already supports `T`; the partner form-builder should default every new institutional form to include the third-gender option rather than making it opt-in, since several state welfare forms still omit it (research 04 §C, Delhi's 2024 mandate).
- **Orphans / no-parent-data.** `family.father.name`/`family.mother.name` must support a `not_applicable` value with a reason code rather than blocking on a required field; the SDK's field-mapping layer should degrade gracefully for a partner form that hard-requires "father's name" (map to guardian's name or leave blank with an explanatory note attached to the payload) instead of refusing to submit.
