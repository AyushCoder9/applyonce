# India DPI & KYC Integration Landscape for Praman (2026)

Research snapshot as of 2026-09-02. Praman's core promise — "verify once, apply anywhere" — depends on stitching together India's DPI (Digital Public Infrastructure) rails: DigiLocker, Aadhaar, PAN, ABHA, Account Aggregator, APAAR/NAD, CKYC, and dozens of exam/scheme portals, plus commercial KYC aggregators and the DPDP legal regime. Each section below follows: **What it is · What data it yields · Who can access it & how · Aggregator/vendor options & pricing · Auth flow shape · Field list · Gotchas.**

## 1. DigiLocker — API Setu, Entity Locker, MeriPehchaan

**What it is.** India's national document wallet (MeitY/NeGD). Three roles: **Issuer** (govt/private orgs push signed docs), **Requester/Partner** (apps pull docs with consent), **citizen** (stores/shares). **Entity Locker** is the same architecture for organizations (PAN/CIN-verified businesses). **MeriPehchaan** (launched 4 July 2022) is the National Single Sign-On that now actually hosts DigiLocker's OAuth endpoints, unifying Jan Parichay/e-Pramaan/DigiLocker into one citizen IdP.

**What data it yields.** 70+ document types: Aadhaar (only doc with full structured JSON+XML), PAN, driving licence, RC, Class X/XII marksheets (CBSE + several state boards), voter ID, EPFO/UAN card, ABHA card, CoWIN certificate, state e-District income/caste/domicile certificates, university degrees via NAD, passport verification record (added Dec 2025).

**Access & registration.** Partner onboarding via `https://partners.digitallocker.gov.in/` (prod) and `https://devpartners.digitallocker.gov.in/` (dev/sandbox): apply → get client id/secret → build against sandbox → security audit → go-live approval. Becoming a **Requester** is comparatively easy; becoming an **Issuer** (pushing Praman-verified facts back into a citizen's locker) requires a formal use-case submission and department-level approval — a much longer path. Full spec: [Authorized Partner API Specification v2.2](https://cf-media.api-setu.in/resources/DigitalLocker-AuthorizedPartnerAPI-Specificationv2.2.pdf); Entity Locker spec: [Requester–Entity Locker API v1, Oct 2024](https://entity.digilocker.gov.in/assets/img/Requester%20-%20Entity%20Locker%20API%20Specification_07_10_24.pdf).

**Vendor path (faster than direct empanelment).** Setu wraps the OAuth dance behind a simpler header-auth API — sandbox `dg-sandbox.setu.co`, prod `dg.setu.co` ([docs.setu.co/data/digilocker](https://docs.setu.co/data/digilocker/quickstart)): `POST /api/digilocker/`, `GET /:id/status`, `GET /:id/aadhaar` (JSON+XML), `POST /:id/document`, `/:id/revoke`.

**Auth flow (actual endpoints, all on `digilocker.meripehchaan.gov.in`):**
- Authorize: `GET /public/oauth2/1/authorize` (params: `response_type`, `client_id`, `redirect_uri`, `state`, PKCE `code_challenge`/`S256`, `dl_flow=signup`, `verified_mobile`, `scope=openid`, `acr=pan|aadhaar|driving_licence`)
- Token (OIDC v2): `POST /public/oauth2/2/token` → `access_token`, `id_token` (JWT), `refresh_token`, `consent_valid_till`; legacy v1 token/revoke also exist.
- User: `GET /public/oauth2/1/user` → `digilockerid`, `name`, `dob`, `gender`, `eaadhaar` (Y/N), `mobile`, `email`.
- Issued docs list: `GET /public/oauth2/2/files/issued` → `{name, type, size, date, mime, uri, doctype, issuerid, issuer}`.
- File fetch: `GET /public/oauth2/1/file/{uri}` (binary + `hmac` header for integrity).
- e-Aadhaar XML direct: `GET /public/oauth2/3/xml/eaadhaar`.
- **Pull Document** (issuer-initiated fetch, e.g. marksheet by roll number): `POST /public/oauth2/1/pull/pulldocument` with `orgid`, `doctype`, `consent=Y` + issuer search params; non-exact match returns `pull_response_pending` (manual queue).
- Server-side signup via Aadhaar demographic match (no OTP if `verification=N`): `POST /public/signup/2/demoauth`.

**Gotchas.** Pull flow needs exact-match search params or it queues for manual verification, not instant. `hmac` file-integrity check is optional, not enforced — Praman should verify it anyway. Issuer onboarding is far slower than Requester onboarding. Only Aadhaar returns rich structured data; almost everything else comes back as a signed PDF/XML *file*, not parseable field-level JSON — critical for Praman's fact-extraction pipeline design.

## 2. Aadhaar — Offline XML, Online OTP eKYC, Vault, Legal Boundaries

**Offline Paperless e-KYC XML.** Downloaded from `myaadhaar.uidai.gov.in`/mAadhaar as a password-protected ZIP (password = resident-chosen "Share Code"), containing one UIDAI-signed XML with Name, structured Address, embedded photo, Gender, DOB, a `ReferenceId` (last 4 Aadhaar digits + timestamp — never the full number), and **hashed** mobile/email. Hash = `SHA256(SHA256(Mobile+ShareCode))` repeated N times where N = last digit of the Aadhaar number. **Verification is fully offline**: validate the XML signature against UIDAI's published public certificate — no UIDAI server call needed. Source: [UIDAI FAQ](https://uidai.gov.in/en/307-faqs/aadhaar-online-services/aadhaar-paperless-offline-e-kyc/10733-how-to-share-the-xml-file-with-the-service-provider.html). This is Praman's **cheapest, zero-license path** — no AUA/KUA registration needed to accept a citizen-generated XML.

**Online OTP eKYC — AUA/KUA/Sub-AUA.** **AUA** (Authentication User Agency) triggers auth (yes/no ± eKYC); **KUA** (KYC User Agency) receives full demographic+photo data back. **Sub-AUA/Sub-KUA** rides on a licensed parent's infrastructure via a joint undertaking, requiring prior UIDAI approval ([Circular 2 of 2025](https://uidai.gov.in/en/ecosystem/authentication-devices-documents/authentication-document/18632-circular-2-of-2025-amended-sub-aua-and-sub-kua-application-form-joint-undertaking.html)). Eligible primary categories: govt bodies, RBI/SEBI/IRDAI-regulated entities, academic/research institutions — a generic startup does **not** qualify directly and must go Sub-AUA/Sub-KUA or via the 2025 private-entity route below. **License fees** (tiered by volume, [Circular 04 of 2023](https://uidai.gov.in/en/ecosystem/authentication-devices-documents/authentication-document-2/16301-circular-no-04-of-2023-dated-05-04-2023-revising-of-license-fee-for-aua-kua-based-on-their-transaction-volume.html)): ≤5 lakh txns/yr ₹5 lakh/2yr; 5–20 lakh ₹10 lakh/2yr; >20 lakh ₹20 lakh/2yr.

**Aadhaar Data Vault.** Mandatory for every AUA/KUA/Sub-AUA ("Requesting Entity"): Aadhaar numbers live only in an encrypted, HSM-keyed vault; everywhere else only a **Reference Key** token is stored ([Circular No. 14 of 2025](https://uidai.gov.in/images/Circular-No.14_of-2025.pdf)). Vault rules apply only to REs, not to pure offline-verification users. Praman must architect around reference-key tokenization the moment it does any online Aadhaar auth.

**Legal boundaries.** §57 of the Aadhaar Act (allowing any private contract to use Aadhaar auth) was **struck down** in *Justice K.S. Puttaswamy v. Union of India* (2018) 1 SCC 809; §29 (anti-profiling, restricted sharing) was upheld. The **Aadhaar and Other Laws (Amendment) Act, 2019** then added **§4A** (voluntary use as identity proof) and **§8A** (**offline verification** — consent-based, via Secure QR/e-Aadhaar/PVC card, **no storage of the Aadhaar number or biometrics**, only the verification outcome) — this is the legally safest path for Praman, formalized in [The Aadhaar (Authentication and Offline Verification) Regulations, 2021](https://uidai.gov.in/images/4_The_Aadhaar_Authentication_and_Offline_Verifications_Regulations_2021.pdf). Mandatory Aadhaar linkage for a private service requires an Act of Parliament; otherwise use must be voluntary. **New in 2025**: the [Aadhaar Authentication for Good Governance (...) Amendment Rules, 2025](https://www.pib.gov.in/PressReleaseIframePage.aspx?PRID=2098223) (notified 31 Jan 2025) opens a path for **private entities** to request online-authentication permission for good-governance/social-welfare/innovation purposes (e-commerce, travel, hospitality, health named as examples) — but it's a discretionary, ministry-by-ministry approval, not a self-serve registration, with no published SLA.

**Gotcha for Praman:** design the MVP around §8A offline verification (no license needed); treat AUA/KUA/2025-Rules online auth as a v2+ item requiring either a Sub-AUA partnership or a bespoke ministry approval.

## 3. PAN Verification

**What it is.** Two official channels: **Protean eGov Technologies** (formerly NSDL e-Gov) runs the IT-Department-authorized bulk/API "Online PAN Verification" service; the **Income Tax e-filing portal** offers free self-service "Verify Your PAN" and PAN-Aadhaar link-status checks (also via SMS to 567678/56161).

**Access.** Protean endpoints observed: `https://opvapi.egov-nsdl.com/TIN/PanInquiryAPIBackEnd` ([overview](https://tinpan.proteantech.in/services/online-pan-verification/pan-verification-overview.html)), JSON over HTTPS. Eligible registrants are AIR/SFT-filing entities (banks, mutual funds, exchanges) — not generic startups. Onboarding needs signed T&Cs, an NDA, and an authorization letter on company letterhead; a free daily quota exists, beyond which a **prepaid deposit** is required ([registration page](https://tinpan.proteantech.in/services/online-pan-verification/pan-verification-register.html)). **Praman's realistic path is via a KYC aggregator** (Signzy/Digio/IDfy/Setu/Cashfree) that already holds Protean access.

**Field list / auth shape.** No public fuzzy name-match scoring API exists from government — UIDAI/ITD return pass/fail flags on individual fields (name, DOB), not a match score; fuzzy logic (Levenshtein/Jaro-Winkler) must be built or licensed by Praman itself. PAN-Aadhaar link status has no documented public API — only the portal + SMS shortcodes; any aggregator "API" for this is likely a wrapped portal check, a fragility risk.

## 4. ABHA / ABDM (Ayushman Bharat Digital Mission)

**What it is.** India's federated health data-exchange stack. **ABHA** = 14-digit health ID + UPI-style "ABHA address." NHA's Gateway is the **Consent Manager (CM)**; actual data moves peer-to-peer between **HIP** (Health Information Provider) and **HIU** (Health Information User) as encrypted FHIR bundles.

**Data yielded.** FHIR R4 Document Bundles across 7 HI-type profiles ([NRCeS IG v6.5.0](https://nrces.in/ndhm/fhir/r4/)): OPConsultRecord, PrescriptionRecord, DiagnosticReportRecord, DischargeSummaryRecord, ImmunizationRecord, WellnessRecord, HealthDocumentRecord (unstructured upload), plus InvoiceRecord.

**Access & sandbox.** Register on abdm.gov.in as HIP/HIU/PHR app → sandbox (`sandbox.abdm.gov.in`, ABHA sandbox base `https://abhasbx.abdm.gov.in/abha/api`, gateway `https://dev.abdm.gov.in/api/hiecm/gateway/v3/`) → **milestone certification M1→M4**, each gated by a CERT-IN/STQC-empaneled agency's OWASP-10 security audit ("Safe-to-Host" certificate, ~₹50K+ per assessment). M1 = ABHA identity (~3–6 wks); M2 = HIP (~8–14 wks); M3 = HIU (~4–6 wks); M4 = NHCX insurance claims (not needed for Praman). Realistic greenfield timeline: **6–9 months** ([Nirmitee guide](https://nirmitee.io/blog/abdm-integration-milestones-m1-m2-m3-m4-multi-software-guide/)). A PHR app that only *displays* linked records needs M1-level integration; one that *stores* records needs separate NHA "Health Locker" registration.

**Auth flow.** Aadhaar-linked-mobile OTP (or mobile-only OTP for non-Aadhaar ABHA) for identity; data-sharing consent is a signed, expiring **consent artifact** validated by the HIP for scope/purpose/expiry. Payload encryption uses **Fidelius**: ECDH (Curve25519) keypairs, AES-256-GCM with HKDF-SHA256-derived keys — the gateway itself never sees plaintext.

**Gotchas.** FHIR profile slicing is strict per HI-type — a generic "attach a PDF" won't pass conformance. Header casing (`X-token`) and 5-second callback SLAs are unforgiving. Security audit cost/timeline is real, not a formality.

## 5. Account Aggregator (Sahamati / ReBIT / RBI)

**What it is.** RBI-regulated, consent-mediated data pipe between **FIPs** (banks, insurers, mutual funds, GSTN — data holders) and **FIUs** (lenders, wealth managers — data consumers) via licensed **NBFC-AA** intermediaries. Sahamati is now the recognized Self-Regulatory Organisation (5 June 2026).

**Data yielded.** 23 FI types ([Setu docs](https://docs.setu.co/data/account-aggregator/fi-data-types)): bank deposits/RD/FD, insurance/ULIP, EPF/PPF, mutual funds/bonds/ETF/NPS/equities, and **GST** (GSTR1/3B — GSTN was onboarded as an FIP specifically for MSME cash-flow lending, [Sahamati](https://sahamati.org.in/gstn-as-financial-information-provider/)). **ITR data does not yet flow via AA** — CBDT-as-FIP is only "expected soon"; income verification today should use AA bank/GST pulls plus the citizen's self-downloaded **AIS (Annual Information Statement)**, not a promised CBDT API.

**Access — the real gate.** To become an **FIU**, an entity must **already be regulated by RBI/SEBI/IRDAI/PFRDA** ([Sahamati FIU page](https://sahamati.org.in/financial-information-user-fiu/)) — a pure-play startup like Praman cannot register directly and must partner with/white-label under an already-licensed FIU. Path: implement FIU module → test against an AA sandbox → UAT-Central-Registry enrollment → Sahamati-empaneled audit → live Central Registry → go live. NBFC-AA license itself needs ₹2 Cr Net Owned Funds; ~17 operational AAs and 653 certified ecosystem entities exist as of 31 Aug 2026 ([Sahamati registry](https://sahamati.org.in/certified-entities/)).

**Vendors/sandboxes.** **Setu AA**: free sandbox, prod ₹0.01–₹25/fetch ([pricing](https://setu-aa.com/pricing-policy)). **Finvu**: sandbox `aauat.finvu.in/API/V1`, manual email onboarding, JWS-signed requests ([integration guide](https://finvu.github.io/sandbox/finvu_aa_integration)). **OneMoney**: `developer.onemoney.in`, SDK + raw API, sales-quoted pricing.

**Auth flow shape.** Not OAuth — a bespoke **consent-artifact** model: signed JSON consent object (`consentDuration`, `consentTypes`, `fiTypes`, `purpose` code 101–105, `redirectUrl`) → redirect to the AA's own consent UI → mobile-OTP approval → AA hands signed artifact to FIP → FIU polls/receives webhook → fetches encrypted FI bundle ([ReBIT spec v2.0.0](https://specifications.rebit.org.in/artefacts/NBFC-AA_API_Specification_v2.0.0.pdf)).

**Gotchas.** FIU eligibility is the real blocker — plan for a partner/white-label FIU relationship. Per-fetch pricing punishes high-frequency polling; design one-time or long-frequency periodic consent. Consent UX is largely controlled by the AA, not fully white-labelable.

## 6. APAAR ID / ABC / NAD / DigiLocker Education Documents

**What it is.** A layered academic-identity stack: **APAAR** (12-digit lifelong ID, successor/superset of the older ABC ID) is auto-generated from UDISE+ (school data) once parental consent is given, name-matched to Aadhaar, and pushed to the student's DigiLocker; **ABC** is UGC's credit-bank repository under NEP 2020; **NAD** is where boards/universities deposit digitized marksheets/degrees; DigiLocker is the citizen-facing retrieval wallet.

**Critical finding — structured vs. PDF.** **Only Aadhaar returns genuinely structured field-level JSON+XML** through DigiLocker. Academic marksheets come back as signed **PDF/XML files**, not parsed field-level data, and this is issuer-dependent, not universal. **CBSE** issues Class X/XII marksheets via `cbse.digilocker.gov.in` (pre-activated accounts pushed via a school-provided 6-digit code); state boards (Maharashtra, UP) issue results into DigiLocker but retrieval is credential-based (roll number + DOB/Aadhaar), not a documented partner API for structured extraction. UGC-NAD covers university degrees; AICTE covers diplomas; NCVET covers ITI/NSDC skill certificates.

**Access.** Issuer-side integration uses the DigiLocker **Issuer API** ([spec v1.13](https://cf-media.api-setu.in/resources/DigiLocker-Issuer-APISpecification-v1-13.pdf)) under API Setu (`apisetu.gov.in/digilocker`); third-party pull access is the same DigiLocker OAuth/consent flow as Section 1, keyed by `(docType, orgId)`.

**Legal risk — active as of today.** CBSE made APAAR mandatory for board-exam LOC registration from the **2026–27 session**. But in Dec 2025 the **Orissa High Court** (*Rohit Anand Das v. State of Odisha*) struck down APAAR's consent form for only allowing post-hoc withdrawal rather than upfront opt-out, invoking Puttaswamy's heightened-privacy-for-children standard. On **20 July 2026 the Supreme Court** indicated it will direct CBSE to implement this **nationwide** with a mandatory opt-out option ([MediaNama](https://www.medianama.com/2026/07/223-sc-direct-cbse-opt-out-aadhaar-linked-apaar-id-consent-forms/), [Internet Freedom Foundation](https://internetfreedom.in/supreme-court-orders-pan-india-implementation-of-odisha-high-courts-ruling-on-apaar-ids-consent-form/)).

**Gotchas.** Treat APAAR/education-fact ingestion as legally voluntary with mandatory opt-out, not compulsory. Do not assume field-level marks extraction is available nationally — plan for OCR fallback or scope "education fact" to document-authenticity + coarse metadata. Adoption is uneven and politically contested state-by-state (West Bengal 9% penetration for Class 9, Gujarat 27.6%, per Careers360).

## 7. e-Sign (Aadhaar-based Digital Signature)

**What it is.** A CCA (Controller of Certifying Authorities)-governed API letting a citizen instantly sign a document via Aadhaar eKYC-based authentication, legally valid under **IT Act 2000 §3A** and the **Second Schedule**, via the **Electronic Signature or Electronic Authentication Technique and Procedure Rules, 2015**.

**Roles.** **ASP** (Praman, the app initiating signing) → **ESP** (a "Trusted Third Party" CA — NSDL/Protean, CDAC e-Hastakshar, eMudhra, Digio) → **CA** issues a short-lived, single-use DSC.

**Auth flow (v3.0 spec, async).** ASP POSTs a signed XML `<Esign>` request with a SHA-256 **document hash** (not the document), `signerid` (`id@id-type.esp-id`), `txn`, `responseUrl`, `signingAlgorithm` (ECDSA/RSA) → ESP acks → shows its own auth page → signer completes Aadhaar **OTP or biometric** → ESP generates keypair+DSC via CA → signs the hash → POSTs signed XML back to `responseUrl` ([eSign API Spec v3.0](https://cca.gov.in/sites/files/pdf/ACT/eSign-APIv3.0.pdf)).

**Pricing.** Setu: ₹12/successful eSign up to 1,000/month ([setu.co/data/esign](https://setu.co/data/esign/)); Digio's broader KYC+eSign bundles run ₹80–150/document.

**Gotchas.** The DSC is single-use, not reusable — every signing event is a fresh call. v2.x (sync) vs v3.x (async) differ meaningfully; pick a provider SDK matching the version. `signerid`'s id-type must match what's registered with the ESP or auth fails.

## 8. CKYC (CERSAI)

**What it is.** CERSAI operates the **Central KYC Records Registry** under **Rule 9A, PMLA (Maintenance of Records) Rules, 2005**, requiring every RBI/SEBI/IRDAI/PFRDA-regulated "reporting entity" to upload client KYC. A verified record earns a unique **14-digit KIN (KYC Identification Number)**; any other reporting entity can then search/download instead of re-collecting documents.

**Access.** Gated by **regulatory status**, not commercial agreement — only PMLA "reporting entities" can register directly with CERSAI (regulator authorization → CERSAI application with entity KYC docs → bulk-upload credentials). **Praman cannot register directly**; it must go through a licensed reporting entity or a CKYC vendor (Protean, Signzy, Decentro, CloudBankin) that already holds access.

**Data & mechanics.** Individual record: name, parent/spouse name, DOB, gender, photo, current+permanent address, list of OVDs used, timestamps. Searches are generally free; downloads are charged on a prepaid basis (exact ₹ not publicly disclosed). **CKYCRR 2.0** (rolling out through 2026) shifts from legacy batch upload to real-time/STP submission — factor this into any vendor selection to avoid building against soon-deprecated batch APIs ([Surepass CKYCRR guide](https://surepass.io/blog/what-is-ckycrr-full-form-function-and-benefits/)).

**Gotcha.** CKYC's KIN mechanic is architecturally almost identical to what Praman wants to do for the whole of Indian civic life — but it sits entirely inside the regulated financial perimeter and is not open to a non-RE platform except via a partner.

## 9. Government Portals — API vs. DigiLocker-only vs. Manual

| Portal | Access reality |
|---|---|
| **NSP** (scholarships.gov.in) | A documented XML-based API exists ([spec PDF](https://socialjustice.gov.in/writereaddata/UploadFile/NSP%20API%20Specifications%20Document-1.pdf)) but it's built for institutions/state nodal agencies pushing data *into* NSP — no consumer-facing "check my scholarship status" API. Praman should treat NSP as a **write target** (auto-filling applications), not a read source. |
| **UMANG** | Closed consumer app; department-to-UMANG onboarding happens via API Setu, but a private platform cannot register as a UMANG "consumer" the way it can with a commercial DigiLocker vendor. Not a viable direct integration point for Praman. |
| **e-District** (income/caste/domicile) | State-dependent, no national API. **Confirmed DigiLocker-integrated**: Maharashtra (Aaple Sarkar), Karnataka (Nadakacheri/SevaSindhu), Tamil Nadu (eSevai). Reportedly weak/partial in several northern states. Even where integrated, retrieval often needs an Aadhaar number + transaction ID, and pre-integration legacy certificates are often simply unavailable digitally. |
| **Parivahan/Sarathi (DL/RC)** | One of the most reliable DigiLocker pulls — fetched directly from the national Sarathi/Vahan databases via the standard DigiLocker/Setu partner flow, no separate Parivahan API. |
| **Passport Seva** | DigiLocker integration launched for the **Passport Verification Record (PVR)** on 3 Dec 2025; Passport Seva Portal 2.0 also pulls the *other direction* (imports Aadhaar/PAN/education docs from DigiLocker into the application). No open API for raw passport data — only the PVR via consent-pull. |
| **EPFO/UAN** | No public API. Access via Member e-Sewa portal or UMANG passbook view. DigiLocker pull works reliably **only when the UAN is Aadhaar-seeded**; since Aug 2025, UAN activation itself moved to Aadhaar Face Authentication via UMANG. |
| **CoWIN** | Historically ran genuinely public read-only slot-availability APIs plus OTP-gated "Protected" APIs for personal data (never a way to pull someone's certificate without their live OTP). Portal reportedly went non-functional from ~Aug 2025 for an extended period ([IFF](https://internetfreedom.in/cowin-has-been-down-for-a-month-rights-are-at-risk-these-are-our-fixes/)) — verify live status before depending on it as a health fact source. |
| **UDID** | Linked to DigiLocker since Oct 2020 in principle, but flagged as one of the **least reliable** pulls ("record not found" despite valid IDs) — build a manual-upload + human-review fallback for PwD-category facts. |
| **Income/caste/domicile** | See e-District row — model as a per-state issuer-availability flag in the schema, not a uniform national capability. |

## 10. Exam & Admission Bodies

**NTA (JEE Main, NEET-UG, CUET).** No public API. **APAAR ID is explicitly optional** across all three 2026 forms per NTA's own FAQs — a "Yes/No" field, not a hard requirement (though CUET sources are conflicting on whether omission risks later rejection). Once entered and fee paid, APAAR becomes **non-editable**. Common form fields: name, gender, mobile, email, parents' names, DOB, category (certificate number/date/issuing authority — not the document itself for JEE Main), EWS certificate (current-year), PwD/UDID certificate upload, APAAR ID (optional), Class 10 certificate, Class 10/12 marksheets, photograph/signature per strict spec, Aadhaar (fetched/preferred, alternate govt ID for exempted states). Users can pull their own APAAR ID from DigiLocker's Issued Documents.

**JoSAA/CSAB.** No API; online document verification via Reporting Centres. Verifies JEE rank card, Class 10/12 certificates, category certificate (must postdate 1 April of allocation year for OBC-NCL/EWS), PwD certificate, photo ID, seat-acceptance receipt. Zero-tolerance on format errors — seat cancellation risk.

**UPSC.** Two-stage model: **OTR (One Time Registration)** collects only baseline identity (name, gender, DOB, parents' names, mobile/email as login, Class X roll number, minority status) — category/PwD/education are captured later at the exam-specific application stage. UPSC has announced DigiLocker-based verification of caste/income/disability certificates to curb forgery, but this happens downstream, not at OTR.

**SSC.** Similar OTR-then-Document-Verification pattern; DV-stage certificate bundle required only after shortlisting (45–60 day typical timeline). Claims of "mandatory DigiLocker integration since 2023" and "blockchain verification" appear only in secondary/marketing sources and are unconfirmed against official SSC documentation.

**IBPS.** No API/DigiLocker; manual scan-upload. Requires a hand-written declaration (scanned), category/EWS certificates in **IBPS's own prescribed template** (not generic state format), strict file-size limits.

**State CETs.** **MHT-CET 2026 is the strongest precedent in this whole survey**: DigiLocker linkage is **mandatory**, and the account must contain both Aadhaar and APAAR ID — registration flow is register → "Proceed to DigiLocker" → consent → auto-fill Aadhaar+APAAR → manual entry of domicile/category ([official user manual](https://mhcet-prod-2026-public-bucket.s3.ap-south-1.amazonaws.com/Registartion+User+Manual+2026+v1.1.pdf)). This is functionally the exact consent-redirect UX Praman wants to generalize. KCET remains manual/in-person, keyed off Karnataka's Nadakacheri "RD number."

**NEET Counselling (MCC).** No API. Document verification authority sits with the **allotted college, not MCC** — MCC allocates the seat, the college verifies the right to keep it — so there's no single canonical national document list. Core MCC-portal set: admit card, scorecard, Class 10/12 certificates, photo ID, category certificate (OBC-NCL must state "Non-Creamy Layer," current-year), PwD certificate, domicile proof (state quota only), migration/conduct certificate (added at college level).

## 11. KYC/Identity Aggregators (2026 comparison)

| Vendor | Core offering | Sandbox | Pricing signal |
|---|---|---|---|
| **Setu** | DigiLocker (70+ docs), Aadhaar eSign, AA gateway, PAN, KYC bundle. Aadhaar **OTP eKYC discontinued** — redirects devs to DigiLocker. | Yes, free early usage | ₹10–25/AA fetch (aggregator-estimated), ₹12/eSign |
| **Surepass** | 300+ APIs: Aadhaar, PAN+link status, DigiLocker, CKYC search/download/upload, bank verify, face match, EPFO/ITR income checks | No public sandbox; demo-gated | Not disclosed |
| **Signzy** | Video KYC (RBI/PMLA-compliant), liveness/face match, PAN/GST/sanctions, KYB | Yes, full sandbox; ₹5,000 startup credit | Not disclosed |
| **Digio** | DigiKYC (Aadhaar offline XML/QR, DigiLocker pull, OCR), Video KYC, DigiSign eSign, DigiCKYC | Yes, "try first, subscribe later" | eSign ~₹15–20/sign low-volume, ₹25–45 blended (est.) |
| **Cashfree Verification** | Broadest single-vendor doc coverage: Aadhaar/PAN/DL/Voter/Passport, reverse penny-drop, face match, GST/CIN/RC checks | Free trial CTA | Custom/sales-quoted |
| **Karza (Perfios)** | PAN/Aadhaar/GST/DL, CKYC (flagship strength), bureau pulls (CIBIL etc.), MCA/adverse-media | Enterprise sales-led | ~₹20–60/bureau report (est.) |
| **HyperVerge** | Passive liveness (ISO 30107-3 L2, single-selfie), face match, OCR+verify | 1-month free sandbox trial | $0.50–1.50/check (est.) |
| **IDfy** | Profile Gateway, Video KYC (agent + self-serve), background checks | Yes, explicit no-card-needed sandbox | Consumption-based, no rate card |
| **Zoop** | Multi-backend fallback KYC, CKYC, DigiLocker, dynamic data retrieval, PAN 206AB | No public sandbox | Not disclosed |
| **Bureau** | Fraud/device-risk layer (fingerprinting, behavioral biometrics, mule-account graph), not primarily document-KYC | No | Not disclosed |
| **Gridlines** | DigiLocker workflows, Aadhaar offline XML, face match/liveness, deepfake detection | Yes, explicit sandbox | Not disclosed |
| **Decentro** | AA, KYC + bureau in one call, banking/lending APIs | Yes, ₹5–10K free credits | **Most concrete published figure: ₹2/call floor**, failed calls at 50% rate |

Pattern: almost none publish real rate cards — budget for a sales conversation with 2–3 shortlisted vendors. IDfy, HyperVerge, and Decentro have the clearest no-friction sandbox paths for an early integration spike.

## 12. Legal — DPDP Act 2023 + DPDP Rules 2025

**Status.** Rules notified via Gazette **G.S.R. 846(E), 13–14 Nov 2025** ([PIB PDF](https://static.pib.gov.in/WriteReadData/specificdocs/documents/2025/nov/doc20251117695301.pdf)), with the Data Protection Board constituted alongside. **Phased commencement**: Phase 1 (Nov 2025) — Board established, RTI/TRAI Act amendments. **Phase 2 (14 Nov 2026, ~10 weeks from today)** — Consent Manager registration framework opens. **Phase 3 (14 May 2027)** — bulk of substantive obligations (consent mechanics, breach reporting, DP rights, cross-border transfer, full enforcement) activate. Praman should build to Phase-3 spec now, not treat the interim as a compliance grace period.

**Consent Manager.** Must be India-incorporated, **₹2 crore minimum net worth**, structurally independent from any Data Fiduciary/Processor role for the same individual, **7-year** consent-record retention, registration window opens Nov 2026, penalty exposure up to ₹50 crore. Praman should explicitly decide whether it registers as a CM itself or positions as a Data Fiduciary integrating with a registered CM.

**Consent notice (Rule 3).** Must be itemized by data category, state specific purpose per item, use plain language, stand alone (not buried in T&Cs), and give an equally-easy withdrawal mechanism.

**Data Principal rights.** Access, correction/erasure, grievance redressal + Board escalation, and nomination of another individual on death/incapacity.

**Breach notification (Rule 7).** Two-stage: notify the Board "without delay" with known facts, then a detailed report within **72 hours**. This stacks on top of — not instead of — **CERT-In's existing 6-hour reporting mandate**; assume dual-track reporting applies to Praman.

**Children's data.** Child = under **18**. Verifiable parental consent required; no behavioural monitoring/targeted ads directed at children. Rule 10 explicitly names **DigiLocker-based identity verification** as an acceptable mechanism for confirming the parent is an identifiable adult with a valid parent-child relationship — Praman should directly reuse this pattern for any minor-touching flow (education facts especially) rather than building a bespoke age-gate.

**Significant Data Fiduciary.** Designated by volume/sensitivity/security-risk criteria; obligations include an India-based DPO reporting to the Board of Directors, an independent data auditor, and annual DPIA/audit. Given Praman's breadth (identity+education+income+health+bank), assume SDF-grade governance should be built pre-emptively.

**Adjacent regimes.** RBI's KYC Master Direction 2016 (amended 2023) still governs downstream banks/NBFCs' own CDD obligations independent of DPDP — Praman is a facts *provider*, not a substitute for a regulated entity's CDD. IT Act §43A + SPDI Rules 2011 remain in force until repealed at Phase 3 (14 May 2027).

## 13. Auth Tech for Citizens

**Passkeys/WebAuthn.** RBI's Authentication Directions, 2025 require two independent factors (one dynamic) for digital payments by **1 April 2026**, pushing adoption. **Visa Payment Passkey Service** went live in India 2 July 2026 (IDFC FIRST Bank first issuer, via Razorpay/PayU/Juspay); **Mastercard** chose India for its global Payment Passkey launch (Axis Bank, Juspay, PayU). Realistic expectation: SMS OTP remains dominant for **3–5 more years** even as passkeys grow — design OTP-first, passkey fast-follow.

**SMS OTP + DLT.** TRAI's **DLT registration** is mandatory for any Principal Entity sending bulk/transactional SMS: register with KYC docs (PAN/CIN/GSTIN) → get a **PE-ID**, plus separate registration of Header/Sender ID and each message Template. Transactional/OTP headers can bypass DND. Indicative per-SMS pricing (2026, aggregator-sourced): **MSG91 ~₹0.15**, **Kaleyra ~₹0.18**, **Exotel ~₹0.18**, **Twilio ~₹0.45** (USD-billed, forex surcharge) — INR-billed providers avoid the forex markup Twilio carries.

**WhatsApp Business API OTP.** Compliant and increasingly common; Meta's own India "Authentication" category rate ≈ **₹0.115/message** effective 1 Jan 2026, conversation-based (one 24-hr session = one charge). BSPs (Gupshup, Interakt) add a platform fee + 10–30% markup on top. Cheaper per-message than SMS but needs a BSP relationship and template pre-approval — good candidate as primary channel with SMS as fallback for delivery failures or WhatsApp-less users.

## Recommended integration path for Praman v1 (2026)

1. **Mock everything first.** Per the "Providers: code against `packages/providers` interfaces only, default env mock" rule — build every adapter (DigiLocker, Aadhaar, PAN, ABHA, AA, CKYC) against a stable interface with a mock backend before any live credential exists. This lets `pnpm test`/Playwright golden flows run with zero external dependency.
2. **Sandbox — go direct to Setu first.** Setu covers DigiLocker, Aadhaar offline XML, PAN, and eSign under one commercial relationship with a genuinely usable sandbox and no license prerequisite — this should be Praman's first live-provider integration, replacing the mock for identity/education/document facts.
3. **Sandbox — pick one KYC aggregator for anything Setu doesn't cover well.** IDfy or Decentro for their friction-free sandboxes (no card, real free credits) — use for CKYC search/download and bank-account (penny-drop) verification, which Setu doesn't clearly offer.
4. **Org registration track (start now, lands in 6–9+ months).** ABDM HIP/HIU certification (M1→M3, ~6–9 months, CERT-IN audit cost) if Praman commits to health facts; a Sub-AUA/Sub-KUA partnership (not a direct AUA/KUA license) if online Aadhaar OTP auth becomes necessary; FIU status only via a white-label/partner arrangement with an already-licensed entity, since direct FIU registration requires pre-existing RBI/SEBI/IRDAI/PFRDA regulation.
5. **Legal track (parallel, deadline-driven).** Build to DPDP Phase-3 spec (14 May 2027) now: itemized consent notices, 72-hour breach playbook (plus CERT-In's 6-hour track), and the DigiLocker-based verifiable-parental-consent pattern for any minor-touching flow, given the live Supreme Court direction on APAAR consent forms. Decide the Consent-Manager-vs-Data-Fiduciary posture before Phase 2 registration opens (14 Nov 2026).
6. **Do not depend on:** CKYC direct access (regulatory gate), CBDT-as-AA-FIP for ITR (not live), UMANG as a third-party API (closed), or UDID/CoWIN DigiLocker pulls as a sole source (documented reliability problems) — build manual-upload+OCR fallbacks for all four.

| Fact domain | Provider (v1) | Adapter path | Fields returned | Verification strength |
|---|---|---|---|---|
| Identity (name/DOB/address/photo) | Aadhaar Offline XML (direct, §8A) | Mock → Setu/direct | Name, address, DOB, gender, photo, hashed mobile | High — UIDAI-signed, offline-verifiable |
| Identity (document pull) | DigiLocker via Setu | Mock → Setu sandbox → prod | Aadhaar (structured), PAN/DL/RC (file) | High for Aadhaar; medium (file-only) for others |
| PAN | Aggregator (Signzy/Digio/Setu) reselling Protean | Mock → aggregator sandbox | PAN status, name/DOB match flags | Medium-high, no scored fuzzy match from source |
| Education | DigiLocker (CBSE/state boards/NAD) + APAAR (optional) | Mock → Setu, OCR fallback | Signed PDF/XML file, coarse metadata | Medium — file-based, patchy structured extraction |
| Income | Account Aggregator (via white-label FIU) or AIS self-upload | Mock → partner FIU sandbox | Bank statements, GST turnover | Medium — no ITR-via-AA yet |
| Health | ABHA/ABDM (HIU role) | Mock → ABDM sandbox → M1-M3 cert | FHIR bundles (7 HI-types) | High post-certification, heavy lift |
| Bank/KYC | CKYC via partner RE, or penny-drop via aggregator | Mock → IDfy/Decentro sandbox | Name, address, OVD list, account validity | High but access-gated |
| Category/domicile/caste | State e-District via DigiLocker (MH/KA/TN confirmed) | Mock → DigiLocker, manual upload fallback | Signed certificate file + reference number | Variable by state — flag per-state in schema |
| Signature/consent artifact | Aadhaar e-Sign via ESP (Digio/NSDL) | Mock → Digio sandbox | Signed XML, single-use DSC | High, IT Act §3A legal validity |
