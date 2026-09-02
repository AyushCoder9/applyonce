# 11 — UX Flows

Screen names are taken from the page list in `docs/04-DESIGN-SYSTEM.md` §7. Events logged reference real tables/enums in `docs/03-DATA-MODEL.md` §3 (`audit_log`, `application_events`, `notifications`, `webhook_deliveries`, `verification_jobs`, `data_requests`). Copy follows the voice rule in `docs/04-DESIGN-SYSTEM.md` §8: short, direct, Hindi-friendly English; every empty state names the next action.

## F1 — Onboarding
**Happy path**
1. `/auth/register` — phone number → OTP (6-digit, 5-min expiry) → `POST /auth/otp/verify` creates `user` + DEK.
2. `/welcome` step 1 — name (as on Aadhaar) + language (EN/HI). Creates `profile(kind='self')`.
3. `/welcome` step 2 — "Connect DigiLocker" (see F2 below) or "Skip, upload later."
4. `/welcome` step 3 — review auto-filled identity, green `SourceChip`s, hide-section option.
5. `/welcome` step 4 — review auto-filled education (Class 10/12).
6. `/welcome` step 5 — family & category mini-form (self-declared, amber chips) with "upload certificate to verify" nudge.
7. `/welcome` step 6 — create passkey (WebAuthn, platform authenticator).
8. Done screen — completion %, "Try the demo exam form" CTA → `/app`.

**Failure/edge paths**
- OTP fails 3× → 15-min lockout, fallback to "Call me" voice OTP; screen shows retry countdown, never a bare error.
- DigiLocker connect fails/times out at step 3 → wizard doesn't block; "Skip, upload later" always visible, F3 (upload→OCR) becomes the recovery path.
- Passkey unsupported on device (old browser) → falls back to "Set up later" and OTP remains the login method until a passkey is added from `/app/settings`.

**Copy**
- Step 2 title — EN: "Connect DigiLocker to verify your identity in seconds." HI: "सेकंडों में पहचान सत्यापित करने के लिए डिजिलॉकर जोड़ें।"
- Done screen — EN: "Your profile is 62% complete. Add your category certificate to unlock scholarships." HI: "आपकी प्रोफ़ाइल 62% पूरी है। छात्रवृत्ति के लिए श्रेणी प्रमाण पत्र जोड़ें।"

**Events logged**: `audit_log(action='user.registered')`, `audit_log(action='profile.created')`, `audit_log(action='passkey.registered')`, `notifications(category='system', title='Welcome to Praman')`.

## F2 — DigiLocker connect
**Happy path**
1. From `/welcome` step 2 or `/app/verify` (reconnect) — tap "Connect DigiLocker."
2. `POST /providers/digilocker/start` → provider consent screen (mock: a fake DigiLocker screen returns the seeded fixture in ~2s; live: real OAuth redirect).
3. Callback links `provider_links(provider='digilocker')`.
4. `sync` job lists issued docs, fetches Aadhaar XML + PAN + marksheets; SSE streams progress on-screen: "Found Aadhaar," "Found CBSE Class 12 · 2025."
5. Writes `documents(origin='digilocker')` + `facts(source='issuer_verified')`; wizard/verify-hub shows green stamps as each fact lands.

**Failure/edge paths**
- Partial fixture failure (e.g., PAN service down) → the facts that did sync show green, the rest show "Couldn't fetch — try again" per-item, not a full-flow failure.
- User revokes DigiLocker consent mid-sync → job marked `failed`, existing already-written facts are kept (never rolled back), a banner explains "Some documents couldn't be verified."
- Re-connect after account is already linked → `provider_links` upsert on `(user_id, provider)` unique key; last_sync_at updates, no duplicate documents created.

**Copy**
- Progress toast — EN: "Found your Class 12 marksheet · CBSE 2025." HI: "आपकी कक्षा 12 मार्कशीट मिली · सीबीएसई 2025।"
- Partial failure — EN: "We couldn't verify your PAN right now. You can add it manually or try again later." HI: "हम अभी आपका पैन सत्यापित नहीं कर सके। आप इसे मैन्युअल रूप से जोड़ सकते हैं या बाद में पुनः प्रयास करें।"

**Events logged**: `verification_jobs(provider='digilocker', kind='sync', status)` transitions queued→running→succeeded/failed, `document_extractions` rows where applicable, `audit_log(action='provider.linked')`.

## F3 — Upload → OCR review
**Happy path**
1. `/app/documents` — drag-drop upload → `POST .../documents/upload-url` (signed PUT) → `POST .../documents/:id/complete` starts AV scan + OCR job.
2. Notification: "We found 6 facts in your document. Review?"
3. Review screen lists each `document_extractions.proposed_facts` entry with confidence; accept/reject per fact.
4. Accepted facts land as `source='document_extracted'`; issuer-verified facts are never overwritten by an extraction — a conflicting value creates a `mismatches` row instead.

**Failure/edge paths**
- AV scan flags the file → document stays `status='rejected'`, user sees "This file looks unsafe — try a different scan" with no OCR attempted.
- OCR confidence very low on all fields → review screen shows "We couldn't read this clearly — add these facts yourself" and opens the section's manual edit sheet instead of a review list.
- Extraction conflicts with an issuer-verified fact (e.g., OCR reads a different DOB from marksheet than Aadhaar) → a `mismatches` row is created with severity, shown in `/app/verify`; the issuer-verified value stays authoritative in the vault.

**Copy**
- Review screen — EN: "We found 6 facts. Confirm the ones that look right." HI: "हमें 6 जानकारियाँ मिलीं। जो सही लगें उन्हें स्वीकार करें।"
- Mismatch banner — EN: "Your marksheet shows a different date of birth than Aadhaar. Which is correct?" HI: "आपकी मार्कशीट में जन्मतिथि आधार से अलग है। कौन सी सही है?"

**Events logged**: `documents(status)` transitions pending→ready/rejected, `document_extractions(reviewed_at, reviewed_by)`, `mismatches` insert, `notifications(category='verification')`.

## F4 — Apply with Praman (partner-initiated)
**Happy path**
1. Partner site: citizen clicks the `@praman/sdk` button → partner server calls `POST /partner/share-sessions` → opens `share_url`.
2. `/share/[token]` — partner identity card (verified-org badge) → purpose statement → profile selector (self or a dependent) → `FieldDiff`: "44 requested · 39 available (36 verified) · 5 missing."
3. Missing fields shown as an inline mini-form; optional custom questions from the partner's `customFields`.
4. Step-up (passkey) → `POST /share/:token/consent` writes `consents` → `applications(status='submitted', source='sdk')` → `shares` (JWS stored encrypted) → returns `return_url?share_token=…`.
5. Partner server exchanges the token for the signed payload, verifies against `GET /partner/jwks`, posts `application.status='received'` back.
6. Citizen sees the application appear in `/app/applications` with a live timeline.

**Failure/edge paths**
- Citizen declines consent → `share_sessions.status='cancelled'`; partner's return URL fires with a decline state, no `consents`/`shares` row is ever created (the DB trigger enforces this — a share cannot exist without a valid consent).
- Share token used twice (replay) → second exchange attempt fails; `shares.share_token_hash` is unique and single-use.
- Consent revoked between grant and partner's exchange call → exchange fails with a clear error; partner is expected to show "This application's consent was withdrawn."

**Copy**
- Consent screen title — EN: "Bharat Test Agency wants to verify 44 fields for your JEE application." HI: "भारत टेस्ट एजेंसी आपके जेईई आवेदन के लिए 44 जानकारियाँ सत्यापित करना चाहती है।"
- FieldDiff summary — EN: "36 already verified · 5 need your input." HI: "36 पहले से सत्यापित · 5 के लिए आपकी जानकारी चाहिए।"

**Events logged**: `webhook_deliveries(event='share.completed')`, `application_events(type='created', actor='citizen')`, `audit_log(action='consent.granted')`, `audit_log(action='share.exchanged')`.

## F5 — Extension autofill
**Happy path**
1. Extension installed, logged in via web-page handshake (short-lived extension token, passkey confirmed on the web page — never re-entered in the popup).
2. On a recipe-matched portal (URL + DOM fingerprint) — badge: "Praman can fill 38 fields."
3. Click → step-up in the popup → `GET /extension/fill-plan?recipe=nta-jee&profile=…` returns a field→value map (decrypted server-side, sent over TLS, never cached to disk).
4. Content script fills inputs/selects/radios sequentially with a highlight sweep (40ms/field, <2s for 40 fields); skips captcha/file inputs; shows an "attach from Praman" helper for document uploads.
5. After submit, the recipe captures the application/reference number → `POST /applications(source='extension')`.

**Failure/edge paths**
- No recipe for this portal → falls back to the `generic` label-text-heuristic recipe; badge reads "Praman can fill some fields (best guess)" rather than an exact count.
- A field's stored value fails the portal's own validation (e.g., a stricter PIN-code format) → that single field is skipped and highlighted red with a tooltip, the rest of the fill continues.
- Extension token expired mid-session → fill is blocked, popup re-prompts the web-page handshake rather than silently failing.

**Copy**
- Badge — EN: "Praman can fill 38 of 48 fields here." HI: "प्रामाण यहाँ 48 में से 38 जानकारियाँ भर सकता है।"
- Post-fill toast — EN: "Filled in 1.8 seconds. Review before you submit." HI: "1.8 सेकंड में भरा गया। सबमिट करने से पहले जाँच लें।"

**Events logged**: `applications(source='extension', external_ref)`, `audit_log(action='extension.fill_completed', meta={fields_filled, portal})`.

## F6 — Family: add minor / add elder / handover at 18
**Add minor — happy path**
1. `/app/family` → "Add a child" → name + DOB → creates ward `profile(kind='dependent')` + `relations(basis='minor', scope=['*'])` by default, narrowed per `docs/07-USE-CASE-CATALOG.md` §4 (health.* requires extra step-up even under `scope='*'`).
2. Guardian fills/imports facts for the ward exactly as for themselves; `ProfileSwitcher` lets them flip between self and ward.

**Add elder — happy path**
1. `/app/family` → "Add a family member" → invite by phone → elder receives OTP, consents to a scope (e.g., `health, category` only) with an explicit `valid_until`.
2. `relations(basis='elder_consent', scope=[...], valid_until=...)` created only after the elder's own OTP approval — never accepted from the inviting delegate's device alone.

**Handover at 18 — happy path**
1. Nightly job finds wards approaching 18 → SMS: "You're turning 18 — claim your Praman profile."
2. Ward sets up their own phone/passkey → `profiles.claimed_by_user_id` set → `relations` for that pair either ends or converts to a narrower `elder_consent`-style scope if the (former) guardian still needs limited access.

**Failure/edge paths**
- Elder never completes their own OTP step → relation stays in a `pending` state, delegate sees "Waiting for [name] to approve," never gets implicit access.
- Ward ignores the 18th-birthday claim SMS → guardian access continues unchanged until claimed, but a persistent banner in `/app/family` reminds the guardian this is time-limited (product decision: define a hard cutoff in a later phase; open question, see `docs/10-PRD-v2.md` §8).
- Guardian tries to share a ward's `health.*` fact without step-up → the share flow blocks with "This needs your fresh approval" rather than silently degrading the request.

**Copy**
- Add elder invite — EN: "Ask Kamla Devi to approve this from her own phone." HI: "कमला देवी से अपने फ़ोन से इसे स्वीकृत करने के लिए कहें।"
- Handover SMS — EN: "You're turning 18 soon. Claim your Praman profile before your parent's access ends." HI: "आप जल्द ही 18 के होने वाले हैं। अपने माता-पिता की पहुँच समाप्त होने से पहले अपनी प्रामाण प्रोफ़ाइल पर दावा करें।"

**Events logged**: `audit_log(action='relation.created', meta={basis})`, `audit_log(action='profile.claimed')`, `notifications(category='family')`.

## F7 — Revoke consent
**Happy path**
1. `/app/connections` — list of every partner ever consented to, with scope/date. Tap a partner → `/app/connections/[consentId]` shows the exact payload shared (decrypted view, step-up required).
2. "Revoke" → `POST /consents/:id/revoke` sets `revoked_at` → fires `webhook_deliveries(event='consent.revoked')` to the partner.

**Failure/edge paths**
- Partner webhook endpoint is down → delivery retried 5× exponential backoff; consent is revoked on Praman's side immediately regardless of webhook delivery success (revocation is never gated on the partner acknowledging it).
- Revoking a consent tied to an in-progress application → the application stays visible in the tracker (history is never deleted) but is flagged "Consent withdrawn — the institution has been notified."

**Copy**
- Revoke confirm — EN: "Bharat Test Agency will no longer receive updates to these 44 fields." HI: "भारत टेस्ट एजेंसी को अब इन 44 जानकारियों के अपडेट नहीं मिलेंगे।"

**Events logged**: `audit_log(action='consent.revoked')`, `webhook_deliveries(event='consent.revoked')`.

## F8 — Expiry reminder → re-fetch
**Happy path**
1. Nightly job scans `facts.expires_at` (OBC-NCL certificate ~1yr, income certificate, passport, DL).
2. Reminders fire at 60/30/7 days via the citizen's enabled channels (`notification_prefs`) — in-app + SMS/email/push.
3. Notification includes a one-tap "Re-fetch from DigiLocker" action → re-runs F2's sync for that specific document type.

**Failure/edge paths**
- Re-fetch finds the certificate hasn't actually been renewed at source yet → shows "Still showing the old certificate — try again closer to your renewal date," not a false "verified" stamp.
- Citizen has disabled all reminder channels → the fact still shows an "Expiring soon" `SourceChip` state in the vault itself (in-app is never fully suppressible for expiry, since it blocks downstream shares).

**Copy**
- Reminder (30-day) — EN: "Your OBC-NCL certificate expires in 30 days. Re-verify now to avoid rejected applications." HI: "आपका ओबीसी-एनसीएल प्रमाण पत्र 30 दिनों में समाप्त हो रहा है। आवेदन अस्वीकार होने से बचने के लिए अभी पुनः सत्यापित करें।"

**Events logged**: `notifications(category='expiry')`, `verification_jobs(kind='sync')` re-triggered, `audit_log(action='fact.reverified')`.

## F9 — Data export / erase
**Happy path (export)**
1. `/app/settings` → "Export my data" → `POST /me/export` queues a job → signed ZIP (JSON + PDFs) → download link emailed/notified when ready.

**Happy path (erase)**
1. `/app/settings` → "Delete my account" → `POST /me/erase` → confirmation screen states the 30-day grace period and any legal-hold exceptions (e.g., an active, unexpired consent share) → `data_requests(kind='erase', status='pending')`.
2. After 30 days with no cancellation and no blocking legal hold, erasure executes; `data_requests.status='fulfilled'`.

**Failure/edge paths**
- An active consent/application is mid-flight (e.g., a scholarship still under review) → erase request is accepted but flagged "will complete after [date/condition]," not silently blocked without explanation.
- Citizen cancels the erase request within the 30-day grace window → `data_requests.status` reverts, no data was touched.
- Export job fails (large document set) → retried automatically; citizen sees a status page, not a silent timeout.

**Copy**
- Erase confirm — EN: "Your data will be deleted in 30 days unless you cancel. Any active applications you've shared data with will keep their copy per that institution's own retention rules." HI: "जब तक आप रद्द नहीं करते, आपका डेटा 30 दिनों में हटा दिया जाएगा। जिन संस्थानों के साथ आपने डेटा साझा किया है, वे अपने प्रतिधारण नियमों के अनुसार अपनी प्रति रखेंगे।"

**Events logged**: `data_requests(kind, status, requested_at, fulfilled_at)`, `audit_log(action='data.exported'|'data.erase_requested'|'data.erased')`.

## F10 — Partner onboarding → form builder → first share → status push
**Happy path**
1. `/partner/onboarding` — org verification wizard (CIN/UDISE/AISHE/GSTIN self-serve + manual review) → `partners(status='pending')` → approved → `status='verified'`.
2. `/partner/developers` — sandbox API key issued immediately on registration; live key gated on verification.
3. `/partner/forms/new` — form builder: pick purpose, select fields from the schema tree (only `SHAREABLE_KEYS`, auto-filtered by `canShare(key, purpose)`), add custom fields, set retention/redirect/webhook, preview.
4. `/partner/forms/[id]` — embed snippet (`@praman/sdk` button) and a "test with sandbox citizen" button.
5. First real share completes via F4 → appears in `/partner/applicants` with per-field verified badges.
6. `/partner/applicants` → drawer → "Push status" → `POST /partner/applications/:id/status` → appears in the citizen's tracker live (F4 step 6).

**Failure/edge paths**
- Org verification fails automated checks (CIN/GSTIN mismatch) → routed to manual review queue in `/admin`, partner sees "Under review, usually 1–2 business days," not a bare rejection.
- Form builder selects a sensitive key incompatible with the chosen purpose (e.g., `health.*` under `exam_application`) → the field simply doesn't appear in the picker for that purpose, so this class of mistake is structurally prevented rather than caught at review time.
- Webhook test fails (`POST /partner/webhooks/test`) → form can still go live, but a persistent warning shows in `/partner/developers` until a successful delivery is recorded.

**Copy**
- Onboarding pending — EN: "We're verifying Bharat Test Agency. This usually takes 1–2 business days." HI: "हम भारत टेस्ट एजेंसी को सत्यापित कर रहे हैं। इसमें आमतौर पर 1–2 कार्यदिवस लगते हैं।"
- First live share — EN: "Your first verified applicant just came in." HI: "आपका पहला सत्यापित आवेदक अभी आया है।"

**Events logged**: `audit_log(action='partner.approved')`, `partner_api_keys(created_at)`, `forms(status, version)`, `webhook_deliveries(event='share.completed')`, `partner_status_pushes(idempotency_key)`, `application_events(actor='partner')`.
