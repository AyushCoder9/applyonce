# 05 — API, user flows, partner protocol, extension

## 1. API surface (Next.js route handlers, `/api/v1`)
All responses `{ ok, data | error: {code, message, fields?} }`. Auth: session cookie (citizen), `Authorization: Bearer pk_live_…` (partner). Every mutating endpoint requires `Idempotency-Key`.

### Auth
`POST /auth/otp/start` `{phone}` · `POST /auth/otp/verify` `{phone, code}` → session · `POST /auth/passkey/register/options|verify` · `POST /auth/passkey/login/options|verify` · `POST /auth/step-up` (passkey or OTP; marks `sessions.stepped_up_at`) · `GET /auth/sessions` · `DELETE /auth/sessions/:id`

### Profiles & facts
`GET /profiles` (self + wards) · `POST /profiles` (dependent) · `GET /profiles/:id/summary` (completion, sections)
`GET /profiles/:id/facts?section=` · `PUT /profiles/:id/facts/:key` `{value, repeat_index?}` (self-declared) · `GET /profiles/:id/facts/:key/history` · `GET /profiles/:id/mismatches` · `POST /profiles/:id/mismatches/:id/resolve`
`GET|POST|PUT|DELETE /profiles/:id/addresses`

### Documents
`POST /profiles/:id/documents/upload-url` `{filename, mime, size}` → signed PUT · `POST /profiles/:id/documents/:id/complete` (starts AV + OCR job) · `GET /profiles/:id/documents` · `GET /documents/:id` · `GET /documents/:id/download-url` (step-up) · `POST /documents/:id/extractions/:eid/apply` `{accept: string[]}` → facts

### Providers / verification
`POST /providers/digilocker/start` → `{url}` · `GET /providers/digilocker/callback` · `POST /providers/digilocker/sync` (job) · `POST /providers/pan/verify` `{pan}` · `POST /providers/abha/link` · `POST /providers/aa/consent` · `GET /verification/jobs/:id` · `GET /events` (SSE: job updates, notifications)

### Consent & share (citizen side)
`GET /share/:token` (partner + form + requested fields + diff for selected profile) · `POST /share/:token/consent` `{profile_id, accepted_fields, custom_answers}` (step-up required) → `{return_url}` · `GET /consents` · `POST /consents/:id/revoke`

### Applications
`GET|POST /applications` · `GET /applications/:id` · `POST /applications/:id/events` (citizen notes) · `POST /applications/:id/documents` · `PATCH /applications/:id` (withdraw, external_ref)

### Partner API (Bearer key)
`POST /partner/share-sessions` `{form_id, return_url, state}` → `{share_url, session_id}` (server-side; the button just opens `share_url`)
`POST /partner/share-sessions/:id/exchange` `{share_token}` → `{payload_jws, consent_id, application_id}` — single use, 10-min TTL
`GET /partner/jwks` (public keys) · `POST /partner/applications/:id/status` `{status, note, external_ref}` · `POST /partner/verification-requests` `{application_id, fact_keys, reason}` · `GET /partner/forms` · `POST /partner/forms` · `POST /partner/webhooks/test`
Webhook events (HMAC-SHA256 `X-ApplyOnce-Signature`, retried 5× exp backoff): `share.completed`, `consent.revoked`, `verification.updated`, `application.withdrawn`.

### Data principal
`POST /me/export` (job → signed ZIP: JSON + PDFs) · `POST /me/erase` (30-day grace, legal holds) · `GET /me/audit`

## 2. End-to-end flows

### F1 — Onboarding (target 6 min)
1. `/auth/register`: phone → OTP (rate-limited, 6 digits, 5 min). Create `user` + DEK.
2. Wizard step 1: name (as on Aadhaar) + language. Creates `profile(kind=self)`.
3. Step 2: "Connect DigiLocker" → `POST /providers/digilocker/start` → provider auth → callback links `provider_links` → `sync` job lists issued docs → fetches Aadhaar XML, PAN, marksheets → writes `documents(origin=digilocker)` + `facts(source=issuer_verified)`; SSE streams progress ("Found CBSE Class 12 · 2025").
4. Step 3–4: review screens show facts with green stamps; user can hide sections.
5. Step 5: family & category mini-form (self-declared, amber) with "upload certificate to verify" nudge.
6. Step 6: create passkey (WebAuthn, platform authenticator) → Home.
Mock mode: step 2 shows a fake DigiLocker consent screen and returns the seeded fixture in ~2 s with progress animation.

### F2 — Apply with ApplyOnce (partner-initiated)
1. Partner server: `POST /partner/share-sessions` → `share_url`. Button (from `@applyonce/sdk`) opens it (popup or redirect).
2. `/share/:token` (citizen, logged in or logs in): shows partner card (verified org badge), purpose, retention, then `FieldDiff`: 44 requested · 39 available (36 verified) · 5 missing.
3. Missing fields → inline mini-form (e.g., exam city choices); optional custom questions.
4. Step-up (passkey) → `POST /share/:token/consent`: creates `consents`, `applications(status=submitted, source=sdk)`, `shares` (payload JWS stored encrypted), returns `return_url?share_token=…&state=…`.
5. Partner server exchanges `share_token` → `payload_jws`; verifies with JWKS; stores; posts `application.status=received` back.
6. Citizen sees application in tracker with timeline; later partner pushes statuses.
Invariant tests: no consent → no share; scope ⊆ form fields; revoked consent blocks exchange; token single-use.

### F3 — Extension autofill (no partner integration)
1. User installs extension, logs in (passkey via web page handshake → short-lived extension token).
2. On a known portal (recipe matched by URL + DOM fingerprint): badge shows "ApplyOnce can fill 38 fields". Click → step-up in popup → `GET /extension/fill-plan?recipe=nta-jee&profile=…` returns field→value map (values decrypted server-side, sent over TLS, never cached on disk).
3. Content script fills inputs/selects/radios sequentially with highlight sweep; skips captcha/file inputs; documents show "attach from ApplyOnce" helper listing the right file (downloads on click).
4. After submit, recipe captures application number → `POST /applications` (source=extension) with external_ref + screenshot of confirmation (optional, user-approved).
Recipes live in `apps/extension/recipes/*.json` (`match`, `fields[] {selector, fact_key, transform}`); `generic` recipe uses label-text heuristics. Community-contributable.

### F4 — Upload → OCR → facts
Upload → AV scan → OCR job → `document_extractions.proposed_facts` → notification "6 facts found" → review screen (accept per fact) → facts `source=document_extracted`, confidence shown; issuer-verified never overwritten by extraction (creates mismatch instead).

### F5 — Family / delegation
Add minor: creates ward profile + `relations(basis=minor, scope=*)`; guardian acts fully; at 18 the ward gets an SMS to claim with their own phone/passkey; relation converts to `elder_consent`-style scoped access or ends. Add elder: invite by phone; elder OTP-consents to scope (e.g., health, pension only) with expiry.

### F6 — Expiry & mismatch
Nightly job scans `facts.expires_at` (OBC-NCL 1 yr, income cert, passport, DL) → reminders at 60/30/7 days with "re-fetch from DigiLocker" one-tap. Mismatch job compares name/DOB across sources with normalised comparison (transliteration-aware); severity high if partners commonly reject.

## 3. `@applyonce/sdk` (partner-facing, tiny)
```html
<script src="https://cdn.applyonce.in/sdk.js"></script>
<button data-applyonce-form="bta-jee-2026">Apply with ApplyOnce</button>
<script>ApplyOnce.init({ createSession: "/api/applyonce/session" })</script>
```
Server helper (Node): `applyonce.createShareSession({formId, returnUrl, state})`, `applyonce.exchange(shareToken)` → verified typed payload (`ApplyOncePayload` from `packages/schema`), `applyonce.verifyWebhook(req)`, `applyonce.pushStatus(applicationId, status)`.

## 4. Demo exam portal script (what judges see, ~3 min)
1. Open BTA form → click "Fill manually" → 6 steps, 48 fields, timer visible (they feel the pain for 20 s).
2. Back → "Apply with ApplyOnce" → ApplyOnce consent screen shows 44 fields, 36 verified by CBSE/UIDAI/NSDL, 5 missing → fill 5 → passkey → back to BTA with everything filled + verified badges + attached marksheet & category certificate → submit → application ref.
3. In ApplyOnce tracker the application appears. BTA admin pushes "Admit card released" → notification in ApplyOnce.
4. Open Connections → show exactly what BTA received; revoke → BTA webhook fires.
5. Open Family → switch to sister Riya's profile → same form filled as guardian.
