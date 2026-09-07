# External approval register

This is the action list for work that code generation cannot complete. No password, client secret, identity document or private contract belongs in this file.

## P0 — establish the applicant

- [ ] India legal entity name, type and registration number
- [ ] Authorized signatory and authority letter
- [ ] Organization PAN and GST certificate where applicable
- [ ] Domain-controlled email and website
- [ ] Privacy notice, terms, grievance contact and security contact
- [ ] Data inventory, purpose/retention table and vendor list
- [ ] Production architecture/data-flow diagram
- [ ] Security test plan and incident-response owner

Without this pack, most official production applications cannot be submitted truthfully.

## P1 — education launch

### DigiLocker Requester

- Owner: founder + engineering
- Portal: <https://partners.apisetu.gov.in/signup>
- Evidence: P0 pack, use case, callback, minimum document scopes, consent/retention screenshots
- Technical status: direct adapter implemented; credentials absent
- Exit: approved production client plus successful proof checklist in `DIGILOCKER-RUNBOOK.md`

### APAAR / ABC / NAD

- Owner: DigiLocker/API Setu application owner
- Contact: `abc.support@digitalindia.gov.in`, `nad.support@digitalindia.gov.in`
- Request: approved DigiLocker requester access to the relevant issued credentials/document types
- Technical status: use generic DigiLocker issued-document runtime; no separate direct APAAR API is claimed
- Exit: real approved credential visible in list/fetch tests for an authorized test citizen

### Transactional email and SMS

- Email: verify the sending domain with the selected deployment integration.
- SMS: obtain TRAI DLT Principal Entity ID, sender/header and exact template approvals before OTP/status messages.
- Exit: delivery, bounce/failure, rate-limit and redaction tests in staging.

## P2 — selective identity and signature

### UIDAI OVSE

- Portal: <https://ovse.uidai.gov.in/>
- Prepare: lawful purpose, organization details, SVG logo under the stated limit, verified domain, callback URL, two-year public certificate and Android/iOS app identifiers if using app-to-app intent.
- Sign the current registration form and terms using the authorized signatory and submit through UIDAI's current channel.
- Technical status: real Aadhaar offline/VC intake remains disabled until registration.
- Exit: OVSE registration confirmation, approved callback/app identifiers, consent/retention controls and signed-credential verification conformance tests.

### eSign ASP

- Select a currently empanelled ESP from <https://cca.gov.in/service-providers.html>.
- Submit ASP application and organization KYC; sign the ESP agreement; supply the application DSC/public key.
- Integrate the ESP-specific service URL and ASP ID in pre-production, pass audit/testing, then receive production access.
- Constraint: ApplyOnce may use eSign only for an application it owns or operates; it cannot sublet eSign to arbitrary third-party portals.
- Exit: signed document hash, callback signature validation, consent log, retry/idempotency and signed PDF verification pass.

### PAN

- Apply through the Income Tax Department external-agency process or contract with an approved production intermediary.
- Exit: official/contract approval, permitted-purpose record, production credentials and exact result-code tests.

## P3 — optional domain expansion

### MeriPehchaan

- Apply at <https://jppartners.meripehchaan.gov.in/> as an application owner.
- Register organization, receive approval, choose OAuth/SAML/Open API, configure the supplied proxy and pass login/logout/timeout/token-validation/handshake checks.
- Use only as SSO. Do not describe it as a document or scheme-data connector.

### ABDM

- Decide a narrow healthcare-administration use case first.
- Register the India entity in the ABDM sandbox; complete applicable milestone conformance, NHA-empanelled security audit, exit form/undertaking and production demonstration.
- Contact: `integration.support@nha.gov.in`.

### Account Aggregator

- Identify an RBI/SEBI/IRDAI/PFRDA-regulated FIU whose lawful purpose matches the application.
- Contract and certify through that role and an AA; do not use generic scholarship-income verification as a pretext for financial-data access.
- Exit: legal basis, purpose code, consent artifact, certified participant path and production registry presence.

### Direct transport data

- Prefer citizen-selected DigiLocker documents.
- If direct NTR access is necessary, apply to MoRTH with purpose, eligibility under DPDP, data-compliance MoU, security audit and logging controls; integrate through NAPIX with approved keys/whitelisting.

## Not actionable as ordinary API-key signup

- UMANG consumer services: department-led onboarding, not a general private-app data API.
- CPGRAMS citizen submission: no public third-party submission contract located.
- NTA/UPSC/SSC/IBPS/general admissions: no universal submission API.
- CKYC: reporting-entity perimeter.
- Online Aadhaar e-KYC: AUA/KUA/Sub-AUA or other explicit UIDAI-approved path.
- Direct APAAR: no public third-party API documentation found.
