# ApplyOnce government integration register

Verified: 8 September 2026. This folder is the canonical integration source for the repository. Older research notes are historical and must not be used to label a connector live.

## State contract

| State | Meaning |
|---|---|
| `demo` | Deterministic synthetic records only. |
| `sandbox` | A provider's test environment; no production citizen assertion. |
| `approval_pending` | The interface is known, but an agreement, registration, approved scope or credentials are absent. |
| `configured_unverified` | Credentials exist, but the approved production journey has not passed an end-to-end proof. |
| `live` | Approval and credentials exist and an approved-scope production journey has passed. |
| `unavailable` | No lawful/public integration path is available for ApplyOnce's current role. |
| `misconfigured` | The selected mode is unsupported or required configuration is missing. |

The runtime derives these states in `packages/providers/src/readiness.ts`. It never silently falls back from a failed or unknown production mode to mock data.

## What is buildable now

- ApplyOnce-hosted forms, partner REST APIs, signed payloads/webhooks, consent receipts, documents, applications and status tracking.
- Synthetic end-to-end demo source.
- Manual document upload and citizen-reviewed extraction proposals. Uploaded claims are not issuer-verified merely because OCR read them.
- Direct DigiLocker Requester implementation: OAuth 2.0 authorization code, S256 PKCE, state binding, token exchange/refresh/revocation, issued-document retrieval, eAadhaar XML retrieval and response-HMAC verification. Production use remains approval-gated.
- Autofill assistance for unintegrated portals, with explicit user review and manual OTP/CAPTCHA/file/payment/final submission.
- A provider readiness register that exposes approval and configuration truth without exposing secrets.

## Government and regulated service matrix

| Service | What ApplyOnce can use it for | Official access path | Current ApplyOnce state | Genuine blocker / next action |
|---|---|---|---|---|
| DigiLocker Requester | Consent-based issued documents and approved identity attributes | Register in [API Setu Partner](https://partners.apisetu.gov.in/signup), configure Requester client/scopes/callback, sign terms, test and receive go-live approval | Adapter implemented; demo is active | Legal entity and authorized signatory; organization evidence; approved OAuth client and scopes |
| API Setu service APIs | Publisher-specific government datasets/services | API Setu consumer account, subscribe, obtain separate publisher approval | Framework-ready | Each API publisher independently approves use and gives its schema/credentials |
| Aadhaar App VC / Offline e-KYC | Voluntary selective offline identity verification | Register as an OVSE through [UIDAI](https://ovse.uidai.gov.in/) | Approval pending; no real upload enabled | UIDAI OVSE registration, lawful purpose, callback/domain/certificate and signed registration pack |
| Aadhaar online auth/e-KYC | Online OTP/face/biometric authentication | Direct AUA/KUA appointment or approved Sub-AUA/Sub-KUA arrangement | Unavailable | UIDAI approval, eligible legal role, audit, agreement, fees/guarantee, pre-production and production migration |
| MeriPehchaan / JanParichay | Government SSO and authentication | Register application owner, organization approval, choose OAuth/SAML/Open API, configure proxy and pass checklist | Approval pending | Organization and service approval; it is SSO, not a universal document source |
| APAAR | Academic identifier/credential | Student/school creates it; approved requesters retrieve the issued credential through DigiLocker | Via future DigiLocker scope | No public direct third-party APAAR API was found; request credential scope through DigiLocker |
| ABC / NAD academic records | Degrees, marksheets and academic credits/documents | DigiLocker requester scopes and issuer-dependent search parameters | Via future DigiLocker scope | Publisher/issuer coverage and approved scopes; structured fields vary by issuer |
| CCA eSign | Legally valid single-use document signature | ApplyOnce onboards as ASP with a current [empanelled ESP](https://cca.gov.in/service-providers.html) | Approval pending | India legal entity, ASP agreement, DSC/public key, pre-production integration, audit and production approval |
| PAN verification | PAN status and approved match result | Income Tax Department external-agency approval or approved Protean/intermediary contract | Setu sandbox adapter only | ITD/Protean approval or approved intermediary production contract |
| Account Aggregator | Purpose-bound financial data | Participate through an eligible regulated FIU and certified AA ecosystem | Unavailable for generic income verification | ApplyOnce is not an RBI/SEBI/IRDAI/PFRDA-regulated FIU; secure a lawful FIU partner and narrow purpose |
| ABHA / ABDM | Health-administration identity and, for certified roles, consented health exchange | India entity registers for ABDM sandbox, completes milestone tests, security audit and production exit | Demo only | Entity setup, use-case decision, NHA sandbox approval and certification; not needed for education launch |
| myScheme | Scheme discovery/eligibility content | API Setu consumer subscription if publisher approves; otherwise link to official site under its hosting terms | External link/discovery only | No anonymous public bulk/API right confirmed; contact publisher through API Setu or myScheme support |
| UMANG | Government service aggregation | Departments onboard services to UMANG; assisted-mode onboarding is government-led | Not a private aggregation API | ApplyOnce is not a department. Deep-link users or pursue an institutional NeGD partnership; do not scrape/embed |
| CPGRAMS | Lodge and track public grievances | Citizen portal/UMANG; department officers use role-based portal | Manual link/autofill only | No public third-party submission API located; CAPTCHA/final submit remain with citizen |
| Parivahan / Sarathi / Vahan | DL/RC documents and, for approved recipients, transport data | Prefer DigiLocker consent pull; separate NTR data access uses MoRTH request, NAPIX/API keys, whitelisting, MoU and audit | Future DigiLocker scope | Direct NTR access is purpose/eligibility/security-audit gated; PII is masked except specially approved recipients |
| Passport Seva | Application evidence / records made available in DigiLocker | DigiLocker requester where the document type is available | Future DigiLocker scope | No public personal passport-data API; never scrape Passport Seva |
| EPFO / UAN | Issued pension/UAN documents where available | DigiLocker for supported issued records; citizen portal/UMANG for other services | Future DigiLocker scope or manual | No general public member-data API located |
| Election / voter services | Voter credentials where officially issued | DigiLocker scope if available; official voter portal otherwise | Future scope/manual | No public personal-voter-data API should be assumed |
| e-District certificates | Income, caste, domicile and other state certificates | State issuer through DigiLocker where integrated; manual verified upload elsewhere | Future DigiLocker scope/manual | Coverage, search parameters and document structure differ by state and issuer |
| National Scholarship Portal | Scholarship applications/status | Institution/state integrations exist; citizen-facing submission remains portal-controlled | Hosted form/autofill assistance only | No general citizen submission API; never bypass portal OTP/CAPTCHA |
| NTA/UPSC/SSC/IBPS/state CET | Exam and recruitment applications | Partner-hosted form/API if body integrates; otherwise user-controlled autofill | ApplyOnce form + extension rail | No broad public submission API; external receipt exists only when portal/partner confirms it |
| GSTN | GST data for lawful use cases | Publisher API or Account Aggregator FIP data through an eligible FIU | Unavailable for citizen profile reuse | Publisher/regulated-purpose approval required |
| CKYC/CERSAI | Regulated KYC record | PMLA reporting entity or approved partner | Unavailable | ApplyOnce is not a reporting entity; do not present aggregator access as ApplyOnce-issued verification |
| Jeevan Pramaan | Pension life-certificate journey | Official app/approved ecosystem; some access via UMANG | Link/manual evidence only | No public third-party enrolment API established for this product |
| Entity Locker | Organization documents | Separate Entity Locker requester/issuer onboarding | Backlog | Only needed for partner KYB; separate approval and contracts |

## Official source set

- [DigiLocker requester resources and terms](https://apisetu.gov.in/digilocker)
- [DigiLocker implementation model](https://www.digilocker.gov.in/web/implementation-model)
- [API Setu overview](https://docs.apisetu.gov.in/document-central/explore-apisetu/Overview.html)
- [API Setu access SOP](https://cdn.apisetu.gov.in/portal/assets/sop-apisetu-v1.pdf)
- [API Setu contacts](https://apisetu.gov.in/contact)
- [JanParichay partner onboarding](https://jppartners.meripehchaan.gov.in/)
- [UIDAI OVSE registration portal](https://ovse.uidai.gov.in/)
- [UIDAI Aadhaar App/OVSE FAQ](https://www.uidai.gov.in/en/contact-support/have-any-question/1474-english-uk/faqs/your-aadhaar/aadhaar-app.html)
- [UIDAI authentication/offline verification regulations](https://www.uidai.gov.in/images/The_Aadhaar_Authentication_and_Offline_Verifications_Regulations_2021-_Clean_copy-30122025.pdf)
- [CCA eSign](https://cca.gov.in/eSign.html) and [empanelled providers](https://cca.gov.in/service-providers.html)
- [Income Tax PAN verification access](https://www.incometax.gov.in/iec/foportal/central-state-government-approved-undertaking-agency)
- [ABDM FAQ](https://abdm.gov.in/faqs)
- [UMANG department onboarding](https://web.umang.gov.in/landing/partners)
- [myScheme URL-hosting terms](https://www.myscheme.gov.in/url-hosting-tc)
- [CPGRAMS](https://www.pgportal.gov.in/)

## Product rule

An official web page, API specification or sandbox is not permission to process real citizen data. A connector becomes `live` only after the required agreement/registration, exact production credentials, approved purposes/scopes, privacy controls and an end-to-end evidence run are all present.
