# Build plan — Praman v0.9 (2026-09-02)

Status: foundation DONE (schema · crypto · db+migrations+seed · providers mock/setu · jobs · ui core · web shell + auth). This file is the contract for the parallel work packages below. Read it fully before touching code.

## 0. Decisions already made (do not re-litigate)
| Area | Decision | Why |
|---|---|---|
| Ports | web **3300**, demo portal **3301**, postgres 5434, redis 6380, minio 9002 | 3000/3001/5432/6379/9000 are taken on the dev machine |
| Auth | better-auth 1.7: `phoneNumber` (OTP; mock accepts **123456**) + `@better-auth/passkey`. Session extra fields `steppedUpAt`, `activeProfileId`. | see `apps/web/src/lib/auth.ts` |
| Step-up | `POST /api/v1/auth/step-up` (passkey or OTP re-verify) sets `session.steppedUpAt`; `citizen(req,{stepUp:true})` enforces ≤5 min freshness | required before share / reveal / export / download |
| Addresses | stored as facts (`address.permanent.pincode` …), no separate table | one FactRow UI, one share path |
| Facts | only via `putFact()` in `@praman/db` (validates against registry, encrypts sensitive, never downgrades issuer-verified → creates `mismatches` row) | invariant |
| Consent | DB trigger `shares_consent_guard` (tested in `packages/db/test`) | invariant |
| Providers | `getProviders()` from `@praman/providers`; env `PROVIDER_*=mock|setu`; fixtures in `@praman/providers/fixtures` | mock → sandbox → live with zero UI change |
| Jobs | `@praman/jobs` `enqueue(name, data)`; queues: verification, documents, webhooks, notifications, scheduled, data | worker consumes |
| UI | HeroUI v3 (`@heroui/react`, no provider, `toast.success()` etc.), Tailwind v4 tokens in `apps/web/src/app/globals.css`, composed components in `@praman/ui` | docs/04 + research 03 |
| Fonts | Inter (sans) · Bricolage Grotesque (display) · Noto Sans Devanagari · JetBrains Mono via `next/font` | already wired in root layout |
| i18n | `locale` on user (`en`/`hi`); labels via `field(key).label[locale]`; copy objects `{en,hi}` inline. No i18n library. | ponytail |
| Errors | route handlers wrapped with `handler()`; `{ok,data}` / `{ok:false,error:{code,message,fields}}` | docs/05 |

## 1. Conventions
- Route handlers live in `apps/web/src/app/api/v1/**/route.ts`, use `handler`, `citizen()`, `partner()`, `body(req, zodSchema)`, `ok()`, `ApiError` from `@/lib/api`.
- Server components read DB directly via `@praman/db` + `requireUser()`/`requireProfileAccess()` from `@/lib/session`. Client components mutate through `/api/v1/*` with `fetch` + TanStack Query, then `router.refresh()`.
- Active profile: `session.activeProfileId` (switcher posts to `/api/v1/profiles/active`). Every page that shows profile data resolves the profile via `requireProfileAccess(session)`.
- DEK: `getDek(ownerUserId)` — for wards use the **owner's** user id (`access.ownerUserId`).
- Every fact value rendered → `<FactRow>` or `<SourceChip>` (test asserts `data-testid="source-chip"` count ≥ fact count on vault pages).
- Sensitive facts: server returns `mask()`-ed value unless session is stepped-up and `?reveal=1`.
- Audit: `log(session, "action", "targetType", id, meta)` on every mutation.
- Copy: short, direct, Hindi-friendly. Every empty state → `<EmptyState>` with one action.
- Ponytail rules apply: no new deps without a one-line reason in this file's §5; native inputs where HeroUI lacks a primitive.
- Do NOT run `pnpm install` / edit lockfile / edit `pnpm-workspace.yaml`. Deps are pre-installed. If you truly need a dep, write it in §5 and stop.
- Do NOT edit files owned by another WP. Shared files: only **append** an export line to `packages/ui/src/index.ts`; never rewrite it.
- Keep `pnpm typecheck` green for the packages you touch. Add one vitest per non-trivial module; Playwright specs go in `apps/web/e2e/`.

## 2. Work packages (parallel, disjoint ownership)
### WP1 — Citizen core: Home · Vault · Documents · Verify · Onboarding
Owns: `apps/web/src/app/app/{page.tsx,vault/**,documents/**,verify/**}`, `apps/web/src/app/welcome/**`, `apps/web/src/app/mock/**` (fake DigiLocker/ABHA/AA consent pages), `apps/web/src/app/api/v1/{profiles,facts,documents,providers,verification,events,auth/step-up}/**`, `apps/web/src/lib/{storage.ts,sse.ts}`, `packages/ui/src/{wizard-shell,fact-editor,inputs-india,doc-upload}.tsx`, `apps/web/src/components/vault/**`.
Deliver: docs/04 §7 pages 6–10; F1, F4, F6(UI side); dynamic add/edit sheet generated from the registry; masking + reveal; history drawer; mismatch fix flow; expiry calendar; provider cards; SSE `/api/v1/events` streaming `verification_jobs.progress` + notifications; `/api/v1/profiles/active`; `/api/v1/auth/step-up`.
### WP2 — Consent & share · Partner console · Partner API · SDK · Tracker · Connections
Owns: `apps/web/src/app/share/**`, `apps/web/src/app/partner/**` (except layout), `apps/web/src/app/app/{apply,applications,connections}/**`, `apps/web/src/app/api/v1/{partner,share,consents,applications,jwks}/**`, `apps/web/src/lib/{signing.ts,webhooks.ts,share.ts}`, `packages/sdk/**`, `packages/ui/src/{consent-sheet,data-table}.tsx`, `apps/web/src/components/{share,partner}/**`.
Deliver: docs/05 §1 partner API + §3 SDK + F2; JWS ES256 signing with key in `system_keys` (generated on first use, private JWK encrypted with `systemDek()`), `/api/v1/jwks`; form builder from `REGISTRY`/`SECTION_META`; applicants table with per-field source; status push → `application_events` + `notify` job; verification requests; API keys (hash only; show once); webhooks (HMAC via `signWebhook`, `webhook_deliveries` rows + `enqueue("webhook.deliver")`); catalog `/app/apply` (forms with `status='live'`), tracker + timeline, consent ledger with revoke (→ `consent.revoked` webhook).
### WP3 — Demo exam portal (Bharat Test Agency)
Owns: `apps/demo-exam-portal/**`. Deliver docs/04 §7 #19 + docs/05 §4: 6-step 48-field manual form with timer, "Apply with Praman" via `@praman/sdk` (server route creates share session against `PRAMAN_API_URL` with `BTA_PRAMAN_API_KEY`), return page that exchanges `share_token`, verifies JWS via `/api/v1/jwks`, renders the filled form with per-field SourceChip-like badges + attached docs, submit → application ref; `/status/[ref]` + admin "push status" button (calls partner status API); webhook receiver `/api/praman/webhook` verifying HMAC. Own tiny Tailwind theme (deliberately government-looking, not Praman's). Until WP2 lands, code against docs/05 contracts and `packages/sdk` types; stub with fixtures.
### WP4 — Worker
Owns: `apps/worker/**`. Deliver BullMQ workers for every `JobMap` entry: `digilocker.sync` (list docs → store bytes to S3/MinIO via `@aws-sdk/client-s3` → `documents` rows → `docToFacts` → `putFact(issuer_verified)` with `verification_jobs.progress` updates), `pan.verify`, `aa.income`, `abha.link`, `document.process` (AV stub + `providers.ocr` → `document_extractions.proposed_facts`), `webhook.deliver` (POST with `signWebhook`, retries, `webhook_deliveries` status), `notify` (insert `notifications` + channels via providers.sms/email), schedulers via `upsertJobScheduler` (expiries 60/30/7d, mismatches, handover-at-18, deadlines), `data.export` (ZIP JSON+docs to S3, signed URL) and `data.erase` (30-day grace → hard delete, legal-hold check). Graceful shutdown, pino logs, `PRAMAN_INLINE_JOBS` inline runner export for tests. Shared S3 helper: `apps/worker/src/s3.ts` (web has its own in `lib/storage.ts`).
### WP5 — Family · Notifications · Settings · Data rights · Admin · Public site
Owns: `apps/web/src/app/app/{family,notifications,settings,extension}/**`, `apps/web/src/app/admin/**` (except layout), `apps/web/src/app/(public)/**`, `apps/web/src/app/api/v1/{family,notifications,me,admin}/**`, `apps/web/src/components/{family,public}/**`.
Deliver: F5 (add minor → ward profile + relation; add elder → invite by phone + OTP consent + scope + expiry; handover banner), notifications list/prefs, settings (profile, language EN/HI toggle stored on user, passkeys list/add/remove via authClient, sessions list/revoke, privacy: export/erase requests → `enqueue("data.export"/"data.erase")`, audit log viewer), `/app/extension` page, admin pages (partner approvals, provider health from env + last job stats, queues via BullMQ counts, flags, data-request queue, audit search), public pages (landing with animated autofill hero, /for-institutions, /security, /privacy, /terms, /dpo form, /status, /demo).
### WP6 — Chrome extension
Owns: `apps/extension/**`, `apps/web/src/app/api/v1/extension/**`, `apps/web/src/app/app/extension/connect/**`. Deliver docs/05 F3: MV3 with `@crxjs/vite-plugin`; web handshake (`/app/extension/connect` page mints a 30-day extension token bound to the user via `/api/v1/extension/token`, stored in `chrome.storage.session`/local); recipes JSON (`nta-jee`, `nsp`, `bta-demo` (the demo portal's manual form), `generic` label-heuristics); popup shows "Praman can fill N fields", step-up (OTP in popup), `GET /api/v1/extension/fill-plan?recipe=&profile=` returns key→value map (server decrypts, marks sensitive), sequential fill with highlight sweep (40 ms stagger), skip captcha/file, "attach from Praman" helper listing right documents (signed download URLs), application-ref capture → `POST /api/v1/applications` (source=extension).
### WP7 — QA & ship (after WP1–6)
Playwright golden flows in `apps/web/e2e/`: (1) register → onboarding → add facts; (2) F2 through demo portal; (3) extension fill on demo portal (Playwright with extension loaded). Lighthouse ≥ 90 on Home/Vault/Share. `README.md`, `docs/RUNBOOK.md`, `docker compose up` demo (web+worker+portal images), CI workflow.

## 3. API surface (from docs/05, authoritative) — implement exactly these paths under `/api/v1`
Auth: `POST auth/step-up {method:'passkey'|'otp', code?}` · `GET auth/sessions` · `DELETE auth/sessions/:id`
Profiles: `GET profiles` · `POST profiles` · `POST profiles/active {profileId}` · `GET profiles/:id/summary` · `GET profiles/:id/facts?section=&reveal=` · `PUT profiles/:id/facts/:key {value, repeatIndex?}` · `DELETE profiles/:id/facts/:key?repeatIndex=` · `GET profiles/:id/facts/:key/history` · `GET profiles/:id/mismatches` · `POST profiles/:id/mismatches/:mid/resolve {keep:'a'|'b'}`
Documents: `POST profiles/:id/documents/upload-url {filename,mime,size,docType}` → `{documentId, url}` (S3 presigned PUT) · `POST documents/:id/complete` · `GET profiles/:id/documents` · `GET documents/:id` · `GET documents/:id/download-url` (step-up) · `POST documents/:id/extractions/:eid/apply {accept:string[]}`
Providers: `POST providers/digilocker/start` → `{url}` · `GET providers/digilocker/callback?state&code` (redirects to /welcome or /app/verify) · `POST providers/digilocker/sync` · `POST providers/pan/verify {pan}` · `POST providers/abha/link` · `POST providers/aa/consent` · `GET verification/jobs/:id` · `GET events` (SSE)
Share (citizen): `GET share/:token` · `POST share/:token/consent {profileId, acceptedFields, customAnswers}` (step-up) · `GET consents` · `POST consents/:id/revoke`
Applications: `GET|POST applications` · `GET applications/:id` · `POST applications/:id/events` · `POST applications/:id/documents` · `PATCH applications/:id`
Partner (Bearer key): `POST partner/share-sessions {form_id|form_slug, return_url, state}` → `{share_url, session_id}` · `POST partner/share-sessions/:id/exchange {share_token}` → `{payload_jws, consent_id, application_id}` · `GET jwks` · `POST partner/applications/:id/status {status,note,external_ref}` · `POST partner/verification-requests` · `GET|POST partner/forms` · `POST partner/webhooks/test`
Family: `GET family` · `POST family/minor` · `POST family/elder/invite` · `POST family/elder/accept` · `PATCH family/:relationId` · `DELETE family/:relationId`
Me: `POST me/export` · `POST me/erase` · `GET me/audit` · `PATCH me {locale,name}` · Notifications: `GET notifications` · `POST notifications/read` · `GET|PUT notifications/prefs`
Extension: `POST extension/token` · `GET extension/fill-plan` · `GET extension/documents`
Admin: `GET admin/overview` · `POST admin/partners/:id/status` · `GET admin/queues` · `PUT admin/flags/:key`

## 4. Definition of done (v0.9 demo)
`docker compose up` + `pnpm db:reset` + `pnpm dev` → login 9876543210/123456 → Home shows completion + attention items → Vault shows verified stamps → demo portal "Apply with Praman" fills 44 fields → tracker shows application → BTA pushes "Admit card released" → notification → Connections shows exact payload → revoke fires webhook → Family switch to Riya → same form as guardian. Three Playwright flows green. Every fact shows a SourceChip. Zero unconsented shares (DB test).

## 5. Dependency requests (append here; do not install)
- (none)
