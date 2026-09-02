# Graph Report - files (2)  (2026-09-02)

## Corpus Check
- 393 files · ~175,841 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 2340 nodes · 5530 edges · 164 communities (117 shown, 29 thin omitted)
- Extraction: 99% EXTRACTED · 1% INFERRED · 0% AMBIGUOUS · INFERRED: 30 edges (avg confidence: 0.85)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `1594b1c4`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- signing.ts
- seed.ts
- citizen-shell.tsx
- core.ts
- dependencies
- devDependencies
- devDependencies
- devDependencies
- db/package.json
- devDependencies
- cx
- globalEnv
- compilerOptions
- scripts
- sdk/package.json
- 01 — Product Requirements Document: Praman
- Part B — HeroUI v3 integration notes (verified against the published npm packages, 2026-09-02)
- Stack Verified Notes (2026-09-02)
- 1. API surface (Next.js route handlers, `/api/v1`)
- providers/package.json
- fields.ts
- crypto/package.json
- schema/package.json
- 04 — Design system ("Praman Bright")
- jobs/package.json
- web/tsconfig.json
- 2. Phase prompts
- demo-exam-portal/tsconfig.json
- 1. Canonical Citizen Schema (`packages/schema`)
- 10 — PRD v2 (supersedes 01-PRD.md, kept consistent with it)
- India DPI & KYC Integration Landscape for Praman (2026)
- Part A — Life-stage use-case map (150+ application types)
- field
- registry.ts
- invite/route.ts
- 3. Life-stage catalogue
- handlers/data.ts
- include
- 09 — GTM and Business
- ok
- jobs/src/index.ts
- share-flow.tsx
- src/app/layout.tsx
- 02 — Architecture
- dependencies
- Praman — Market, Competitors, Business Model & GTM Research
- compilerOptions
- config/package.json
- include
- ui/tsconfig.json
- worker/tsconfig.json
- crypto/tsconfig.json
- providers/tsconfig.json
- schema/tsconfig.json
- sdk/tsconfig.json
- Praman — agent instructions
- 08 — Integrations Plan
- jobs/tsconfig.json
- Praman — build kit
- proxy.ts
- demo-exam-portal/next.config.ts
- AGENTS.md
- web/next.config.ts
- next-env.d.ts
- db/src/index.ts
- better-auth
- @better-auth/drizzle-adapter
- @better-auth/passkey
- ui/src/index.ts
- partner/actions.ts
- @heroui/styles
- @hookform/resolvers
- ioredis
- jose
- [token]/consent/route.ts
- store.ts
- lib/session.ts
- pino
- @praman/crypto
- ApiError
- document-detail.tsx
- @praman/providers
- getDek
- @praman/ui
- react
- react-aria
- react-aria-components
- react-hook-form
- zod
- admin/data.ts
- PageHeader
- [consentId]/page.tsx
- blocks.tsx
- { useSession, signOut }
- praman.ts
- browser.ts
- PramanPayload
- payload-map.ts
- log
- prefs.ts
- messages.ts
- putFact
- return/submit/route.ts
- _lib.ts
- fact-editor.tsx
- ManualWizard.tsx
- requirePartnerMember
- handlers/webhooks.ts
- recipes/index.ts
- fill.ts
- schema/src/index.ts
- verification.ts
- 2. Work packages (parallel, disjoint ownership)
- wizard.tsx
- mock-consent.tsx
- family-client.tsx
- web/package.json
- partners/page.tsx
- 11 — UX Flows
- background.ts
- fillField
- RUNBOOK
- Popup
- BTA-JEE 2026 — field map
- Bharat Test Agency — BTA-JEE 2026 Registration (demo exam portal)
- family/data.ts
- client.ts
- Praman — Verify once. Apply anywhere.
- jws-verify.ts
- select-match.ts
- ConnectExtension
- demo-exam-portal/src/app/layout.tsx
- Praman Autofill (Chrome MV3)
- @praman/sdk
- registerOrganisation
- WP1 — Citizen core (Home · Vault · Documents · Verify · Onboarding · APIs · SSE · step-up)
- WP4 — background worker (apps/worker)
- WP6 — Chrome MV3 autofill extension (2026-09-02)
- wp2-share.spec.ts
- WP2 plan — consent & share · partner API · console · SDK · tracker · connections (2026-09-02)
- WP5 — Family · Notifications · Settings & data rights · Admin · Public site (2026-09-02)
- handshake.ts
- share/layout.tsx
- welcome/layout.tsx
- @tanstack/react-query
- @tanstack/react-table

## God Nodes (most connected - your core abstractions)
1. `ok()` - 121 edges
2. `Db` - 112 edges
3. `citizen()` - 101 edges
4. `t` - 99 edges
5. `ApiError` - 92 edges
6. `log()` - 68 edges
7. `Handler` - 63 edges
8. `getDek()` - 58 edges
9. `body()` - 56 edges
10. `requireUser()` - 53 edges

## Surprising Connections (you probably didn't know these)
- `PartnersAdmin()` --calls--> `fmtDate()`  [EXTRACTED]
  apps/web/src/app/admin/partners/page.tsx → packages/ui/src/format.ts
- `CORE_KEYS` --calls--> `fieldsInSection()`  [EXTRACTED]
  apps/web/src/components/family/data.ts → packages/schema/src/registry.ts
- `requestVerificationAction()` --indirect_call--> `isFactKey()`  [INFERRED]
  apps/web/src/components/partner/actions.ts → packages/schema/src/registry.ts
- `fieldLabel()` --calls--> `field()`  [EXTRACTED]
  apps/web/src/components/partner/form-builder.tsx → packages/schema/src/registry.ts
- `FieldRow` --references--> `Source`  [EXTRACTED]
  apps/demo-exam-portal/src/lib/payload-map.ts → packages/schema/src/types.ts

## Import Cycles
- None detected.

## Communities (164 total, 29 thin omitted)

### Community 0 - "signing.ts"
Cohesion: 0.12
Nodes (26): GET, aad(), g, getSigningKey(), publicJwks(), signSharePayload(), payload, blindIndex() (+18 more)

### Community 1 - "seed.ts"
Cohesion: 0.05
Nodes (35): kekFromEnv(), days(), main(), req(), seedDependent(), seedPartner(), sysKey(), AARAV (+27 more)

### Community 2 - "citizen-shell.tsx"
Cohesion: 0.16
Nodes (12): AdminLayout(), PartnerLayout(), IconName, ADMIN_NAV, CITIZEN_NAV, MOBILE_TABS, PARTNER_NAV, NotificationsBell() (+4 more)

### Community 3 - "core.ts"
Cohesion: 0.06
Nodes (38): account, passkey, session, user, userKeys, verification, bytea, createdAt() (+30 more)

### Community 4 - "dependencies"
Cohesion: 0.05
Nodes (41): dependencies, @aws-sdk/client-s3, @aws-sdk/s3-request-presigner, bullmq, ioredis, pino, pino-pretty, @praman/crypto (+33 more)

### Community 5 - "devDependencies"
Cohesion: 0.06
Nodes (39): dependencies, next, @praman/schema, devDependencies, @heroui/react, lucide-react, motion, next (+31 more)

### Community 6 - "devDependencies"
Cohesion: 0.05
Nodes (37): dependencies, next, @praman/schema, @praman/sdk, react, react-dom, zod, devDependencies (+29 more)

### Community 7 - "devDependencies"
Cohesion: 0.05
Nodes (37): dependencies, @praman/schema, react, react-dom, devDependencies, @crxjs/vite-plugin, tailwindcss, @tailwindcss/vite (+29 more)

### Community 8 - "db/package.json"
Cohesion: 0.05
Nodes (36): drizzle-kit, drizzle-orm, dependencies, drizzle-orm, postgres, @praman/crypto, @praman/providers, @praman/schema (+28 more)

### Community 9 - "devDependencies"
Cohesion: 0.09
Nodes (23): devDependencies, pino-pretty, @playwright/test, postcss, @praman/config, tailwindcss, @tailwindcss/postcss, @types/node (+15 more)

### Community 10 - "cx"
Cohesion: 0.12
Nodes (29): HistoryDrawer(), Row, StepUpDialogProps, DocUpload(), DocUploadProps, Phase, putWithProgress(), sha256Hex() (+21 more)

### Community 11 - "globalEnv"
Cohesion: 0.07
Nodes (30): BETTER_AUTH_*, ^build, DATABASE_URL, !.next/cache/**, NEXT_PUBLIC_*, NODE_ENV, PRAMAN_*, PROVIDER_* (+22 more)

### Community 12 - "compilerOptions"
Cohesion: 0.08
Nodes (24): compilerOptions, allowImportingTsExtensions, esModuleInterop, isolatedModules, jsx, lib, module, moduleResolution (+16 more)

### Community 13 - "scripts"
Cohesion: 0.09
Nodes (21): devDependencies, turbo, typescript, engines, node, turbo, typescript, name (+13 more)

### Community 14 - "sdk/package.json"
Cohesion: 0.09
Nodes (21): dependencies, jose, @praman/schema, description, devDependencies, @types/node, typescript, vitest (+13 more)

### Community 15 - "01 — Product Requirements Document: Praman"
Cohesion: 0.10
Nodes (20): 01 — Product Requirements Document: Praman, 1. Problem, 2. Vision, 3. Personas, 4.1 Education, 4.2 Identity & civic, 4.3 Financial & KYC, 4.4 Health (+12 more)

### Community 16 - "Part B — HeroUI v3 integration notes (verified against the published npm packages, 2026-09-02)"
Cohesion: 0.10
Nodes (20): Code snippets (verbatim from official docs, [heroui.com/docs/react/components](https://heroui.com/docs/react/components/button)), Component inventory (85 importable modules in `@heroui/react@3.2.4`), Context: the ground shifted twice in 2026, Font pairings (EN + Devanagari), Live data snapshot (pulled 2026-09-02, npm + GitHub APIs), Packages & install, Part A — Library comparison (2026 state), Part B — HeroUI v3 integration notes (verified against the published npm packages, 2026-09-02) (+12 more)

### Community 17 - "Stack Verified Notes (2026-09-02)"
Cohesion: 0.10
Nodes (20): 10. turbo 2.10 + pnpm workspaces, 11. motion 13, 12. @tanstack/react-query 5 (Next.js App Router), 13. vitest 4 + Playwright 1.62, 14. Chrome MV3 extension (Vite 6/7 + React), 15. Node crypto (AES-256-GCM, HKDF, argon2, HMAC), 16. react-hook-form 7.87 + zod resolver, 17. pino 10 + Sentry (@sentry/nextjs) (+12 more)

### Community 18 - "1. API surface (Next.js route handlers, `/api/v1`)"
Cohesion: 0.10
Nodes (19): 05 — API, user flows, partner protocol, extension, 1. API surface (Next.js route handlers, `/api/v1`), 2. End-to-end flows, 3. `@praman/sdk` (partner-facing, tiny), 4. Demo exam portal script (what judges see, ~3 min), Applications, Auth, Consent & share (citizen side) (+11 more)

### Community 19 - "providers/package.json"
Cohesion: 0.10
Nodes (19): dependencies, @praman/schema, devDependencies, @types/node, typescript, vitest, exports, ./fixtures (+11 more)

### Community 20 - "fields.ts"
Cohesion: 0.09
Nodes (26): CITY_OPTIONS, FIELD_BY_ID, FieldKind, FieldOption, NATIONALITY_LABELS, opts(), StepDef, STREAM_LABELS (+18 more)

### Community 21 - "crypto/package.json"
Cohesion: 0.11
Nodes (18): dependencies, jose, devDependencies, @types/node, typescript, vitest, exports, jose (+10 more)

### Community 22 - "schema/package.json"
Cohesion: 0.11
Nodes (18): dependencies, zod, devDependencies, @types/node, typescript, vitest, exports, @types/node (+10 more)

### Community 23 - "04 — Design system ("Praman Bright")"
Cohesion: 0.11
Nodes (17): 04 — Design system ("Praman Bright"), 1. Personality, 2. Tokens (Tailwind v4 `@theme` + HeroUI theme), 3. Colour usage rules, 4. Motion, 5. Components (HeroUI v3 base → composed in `packages/ui`), 6. Layouts, 7. Complete page list (+9 more)

### Community 24 - "jobs/package.json"
Cohesion: 0.11
Nodes (17): dependencies, bullmq, ioredis, devDependencies, @types/node, typescript, exports, bullmq (+9 more)

### Community 25 - "web/tsconfig.json"
Cohesion: 0.12
Nodes (16): compilerOptions, baseUrl, paths, types, exclude, extends, include, .next (+8 more)

### Community 26 - "2. Phase prompts"
Cohesion: 0.12
Nodes (16): 06 — Claude Code playbook, 0. Setup (once), 1. Session rhythm (every phase), 2. Phase prompts, 3. Cost/quality guardrails, 4. Definition of done (product), P0 — Audit the current build (if a repo exists), P1 — Monorepo + schema (the foundation) (+8 more)

### Community 27 - "demo-exam-portal/tsconfig.json"
Cohesion: 0.12
Nodes (15): compilerOptions, baseUrl, paths, types, exclude, extends, include, .next (+7 more)

### Community 28 - "1. Canonical Citizen Schema (`packages/schema`)"
Cohesion: 0.12
Nodes (15): 03 — Data model, 1. Canonical Citizen Schema (`packages/schema`), 2. Purposes & scopes (consent vocabulary), 3. Postgres schema (Drizzle; abbreviated but complete in intent), 4. Seed data (mock env), address (repeating, role-tagged), bank, category & eligibility (+7 more)

### Community 29 - "10 — PRD v2 (supersedes 01-PRD.md, kept consistent with it)"
Cohesion: 0.12
Nodes (15): 10 — PRD v2 (supersedes 01-PRD.md, kept consistent with it), 1. Problem, 2. Vision, 3. Personas & jobs-to-be-done, 4.1 Citizen web/PWA, 4.2 Partner console, 4.3 Admin, 4.4 Demo exam portal (`apps/demo-exam-portal`) (+7 more)

### Community 30 - "India DPI & KYC Integration Landscape for Praman (2026)"
Cohesion: 0.12
Nodes (15): 10. Exam & Admission Bodies, 11. KYC/Identity Aggregators (2026 comparison), 12. Legal — DPDP Act 2023 + DPDP Rules 2025, 13. Auth Tech for Citizens, 1. DigiLocker — API Setu, Entity Locker, MeriPehchaan, 2. Aadhaar — Offline XML, Online OTP eKYC, Vault, Legal Boundaries, 3. PAN Verification, 4. ABHA / ABDM (Ayushman Bharat Digital Mission) (+7 more)

### Community 31 - "Part A — Life-stage use-case map (150+ application types)"
Cohesion: 0.12
Nodes (15): A1. Birth to 5, A2. School (6–17), A3. 18–24 Higher Education, A4. 21–30 Jobs & Early Career, A5. 25–50 Adult Life, A6. 50+ / Senior Citizens, A7. Cross-cutting (all ages), B1. Field list per form (from official bulletins/portals) (+7 more)

### Community 32 - "field"
Cohesion: 0.16
Nodes (21): FactSheet(), FactSheetProps, Mismatch, ApiErr, editable(), FactOut, SUB, subLabel() (+13 more)

### Community 33 - "registry.ts"
Cohesion: 0.10
Nodes (24): address(), ALL, eduLevel(), f(), FACT_KEYS, FactKey, higherEd(), Opt (+16 more)

### Community 34 - "invite/route.ts"
Cohesion: 0.14
Nodes (26): POST, Invite, POST, Minor, POST, DELETE, own(), Patch (+18 more)

### Community 35 - "3. Life-stage catalogue"
Cohesion: 0.15
Nodes (12): 07 — Use-Case Catalog, 1. How to read this catalog, 2. Top-40 fields by cross-form frequency, 3.1 Birth to 5, 3.2 School (6–17), 3.3 Higher education (18–24), 3.4 Early career (21–30), 3.5 Adult life (25–50) (+4 more)

### Community 36 - "handlers/data.ts"
Cohesion: 0.17
Nodes (17): dataErase(), dataExport(), HOLD_STATUSES, ALLOWED_MIME, documentProcess(), BUCKET(), g, getObject() (+9 more)

### Community 37 - "include"
Cohesion: 0.17
Nodes (11): compilerOptions, jsx, types, extends, include, ../../packages/config/tsconfig.base.json, src, test (+3 more)

### Community 38 - "09 — GTM and Business"
Cohesion: 0.17
Nodes (11): 09 — GTM and Business, 10. KPIs to track from day one, 1. Global analogs — what to copy, 2. India landscape, 3. Business model & pricing, 4. TAM / SAM / SOM, 5. Moats, 6. Risks (§F) (+3 more)

### Community 39 - "ok"
Cohesion: 0.09
Nodes (44): adminApi(), PUT, GET, POST, GET, POST, POST, GET (+36 more)

### Community 40 - "jobs/src/index.ts"
Cohesion: 0.17
Nodes (20): dedupe(), normalizeName(), registerSchedulers(), scanDeadlines(), scanExpiries(), scanHandover18(), scanMismatches(), CONCURRENCY (+12 more)

### Community 41 - "share-flow.tsx"
Cohesion: 0.11
Nodes (26): BuilderInitial, CustomInput(), Profile, ShareFlow(), ShareFlowProps, Summary, T(), FormLike (+18 more)

### Community 42 - "src/app/layout.tsx"
Cohesion: 0.22
Nodes (7): bricolage, devanagari, inter, metadata, mono, viewport, Providers()

### Community 43 - "02 — Architecture"
Cohesion: 0.20
Nodes (9): 02 — Architecture, 1. Principles, 2. Stack (decided), 3. Monorepo layout, 4. Core domains (bounded contexts inside the monolith), 5. Provider adapter layer (`packages/providers`), 6. Security & privacy, 7. Scalability notes (+1 more)

### Community 44 - "dependencies"
Cohesion: 0.09
Nodes (23): dependencies, @aws-sdk/client-s3, @aws-sdk/s3-request-presigner, bullmq, @heroui/react, lucide-react, motion, next (+15 more)

### Community 45 - "Praman — Market, Competitors, Business Model & GTM Research"
Cohesion: 0.22
Nodes (8): A. Global analogs, B. India landscape, C. Private competitors and adjacents, D. Business model options and TAM/SAM/SOM, E. Regulatory sequencing and GTM enablers, F. Risks and moats, G. Recommended 12-month GTM plan, Praman — Market, Competitors, Business Model & GTM Research

### Community 46 - "compilerOptions"
Cohesion: 0.25
Nodes (7): compilerOptions, allowJs, incremental, jsx, plugins, extends, ./tsconfig.base.json

### Community 47 - "config/package.json"
Cohesion: 0.29
Nodes (6): files, tsconfig.base.json, name, private, version, tsconfig.next.json

### Community 48 - "include"
Cohesion: 0.29
Nodes (6): extends, include, ../config/tsconfig.base.json, src, test, drizzle.config.ts

### Community 49 - "ui/tsconfig.json"
Cohesion: 0.29
Nodes (6): compilerOptions, jsx, extends, include, ../config/tsconfig.base.json, src

### Community 50 - "worker/tsconfig.json"
Cohesion: 0.33
Nodes (5): extends, include, ../../packages/config/tsconfig.base.json, src, test

### Community 51 - "crypto/tsconfig.json"
Cohesion: 0.33
Nodes (5): extends, include, ../config/tsconfig.base.json, src, test

### Community 52 - "providers/tsconfig.json"
Cohesion: 0.33
Nodes (5): extends, include, ../config/tsconfig.base.json, src, test

### Community 53 - "schema/tsconfig.json"
Cohesion: 0.33
Nodes (5): extends, include, ../config/tsconfig.base.json, src, test

### Community 54 - "sdk/tsconfig.json"
Cohesion: 0.33
Nodes (5): extends, include, ../config/tsconfig.base.json, src, test

### Community 55 - "Praman — agent instructions"
Cohesion: 0.40
Nodes (4): Commands, Praman — agent instructions, Standing rules, Structure

### Community 56 - "08 — Integrations Plan"
Cohesion: 0.40
Nodes (4): 08 — Integrations Plan, 1. Provider-by-provider plan, 2. DPDP Act 2025 compliance checklist → product features, 3. 12-month provider roadmap

### Community 57 - "jobs/tsconfig.json"
Cohesion: 0.40
Nodes (4): extends, include, ../config/tsconfig.base.json, src

### Community 58 - "Praman — build kit"
Cohesion: 0.50
Nodes (3): Honest constraints baked into the plan, Praman — build kit, The one-paragraph pitch

### Community 64 - "db/src/index.ts"
Cohesion: 0.15
Nodes (14): dynamic, updateRequest(), COLOR, dynamic, dynamic, GET, Body, Matrix (+6 more)

### Community 68 - "ui/src/index.ts"
Cohesion: 0.09
Nodes (26): ApplicationPage(), ApplyPage(), metadata, FormPage(), metadata, FormsPage(), metadata, DetailActions() (+18 more)

### Community 69 - "partner/actions.ts"
Cohesion: 0.13
Nodes (35): StartApply(), addMember(), createApiKey(), createTestSession(), createWebhook(), deleteWebhook(), EVENTS, manager() (+27 more)

### Community 74 - "[token]/consent/route.ts"
Cohesion: 0.12
Nodes (25): POST, isUuid(), POST, isUuid(), POST, POST, POST, schema (+17 more)

### Community 75 - "store.ts"
Cohesion: 0.09
Nodes (29): dynamic, metadata, WebhooksAdminPage(), firstString(), POST(), safeParse(), STATUS_BADGE, StatusPage() (+21 more)

### Community 76 - "lib/session.ts"
Cohesion: 0.10
Nodes (25): verifyFamilyToken(), ApplicationsPage(), ConnectionsPage(), metadata, ExtensionPage(), metadata, PORTALS, AcceptPage() (+17 more)

### Community 79 - "ApiError"
Cohesion: 0.15
Nodes (20): extensionUser(), GET, appUrl(), GET, GET, GET, tinyPdf(), GET (+12 more)

### Community 80 - "document-detail.tsx"
Cohesion: 0.13
Nodes (23): DOC_TYPE_LABELS, docTypeLabel(), UPLOAD_TYPES, Current, DocDetail, DocumentDetail(), DocItem, DocumentsView() (+15 more)

### Community 82 - "getDek"
Cohesion: 0.15
Nodes (24): register(), aaIncome(), abhaLink(), digilockerSync(), documentProcess(), FILE_KEY, HANDLERS, linkProvider() (+16 more)

### Community 89 - "admin/data.ts"
Cohesion: 0.14
Nodes (19): AdminHome(), dynamic, dynamic, JOB, ProvidersAdmin(), dynamic, KEYS, QueuesAdmin() (+11 more)

### Community 90 - "PageHeader"
Cohesion: 0.18
Nodes (22): DocumentPage(), DocumentsPage(), metadata, CORE, DONE, Home(), metadata, metadata (+14 more)

### Community 91 - "[consentId]/page.tsx"
Cohesion: 0.22
Nodes (14): ConsentPage(), ApplicantsPage(), metadata, metadata, PartnerOverview(), RevealButton(), RevokeButton(), getApplicantPayload() (+6 more)

### Community 93 - "blocks.tsx"
Cohesion: 0.07
Nodes (31): LoginForm(), LoginPage(), metadata, metadata, DpoState, submitDpoRequest(), Dpo(), dynamic (+23 more)

### Community 99 - "praman.ts"
Cohesion: 0.17
Nodes (21): POST(), POST(), buildFacts(), buildOfflinePayload(), inDays(), selfDeclared(), sha256(), verified() (+13 more)

### Community 105 - "browser.ts"
Cohesion: 0.47
Nodes (5): init(), Praman, PramanInit, q(), start()

### Community 106 - "PramanPayload"
Cohesion: 0.15
Nodes (12): ExchangeResult, ApplicationStatus, PramanPayload, createPraman(), call(), Exchange, Praman, PramanError (+4 more)

### Community 107 - "payload-map.ts"
Cohesion: 0.14
Nodes (18): ApplyReturnPage(), metadata, ReturnForm(), FieldInput(), formatVerifier(), SourceBadge(), VERIFIER_LABELS, CUSTOM_FIELDS (+10 more)

### Community 108 - "log"
Cohesion: 0.26
Nodes (18): POST, POST, appUrl(), createJob(), providerRef(), withJob(), GET, POST (+10 more)

### Community 109 - "prefs.ts"
Cohesion: 0.14
Nodes (19): metadata, PrefsPage(), CAT, COLOR, Notif, NotificationsList(), rel(), CATEGORIES (+11 more)

### Community 110 - "messages.ts"
Cohesion: 0.11
Nodes (18): ApplyFillMsg, AuthChangedMsg, AuthStatusMsg, CreateApplicationMsg, DisconnectMsg, DocumentsMsg, DocumentUrlMsg, FillPlanMsg (+10 more)

### Community 111 - "putFact"
Cohesion: 0.15
Nodes (15): WelcomePage(), aaIncome(), abhaLink(), panVerify(), aad(), derive(), display(), getFacts() (+7 more)

### Community 112 - "return/submit/route.ts"
Cohesion: 0.25
Nodes (16): POST(), POST(), FIELDS, generateApplicationNumber(), generateIdempotencyKey(), randomRef(), applicationExists(), ApplicationRecord (+8 more)

### Community 113 - "_lib.ts"
Cohesion: 0.26
Nodes (14): GET, GET, DELETE, guard(), PUT, GET, GET, Access (+6 more)

### Community 114 - "fact-editor.tsx"
Cohesion: 0.18
Nodes (15): formatSse(), SSE_HEADERS, SseEvent, coerceInput(), enumGroup(), FactEditor(), NUMERIC, optionLabel() (+7 more)

### Community 115 - "ManualWizard.tsx"
Cohesion: 0.18
Nodes (13): formatElapsed(), ManualWizard(), buildReview(), goNext(), onFileChange(), onSubmit(), validateStep(), readField() (+5 more)

### Community 116 - "requirePartnerMember"
Cohesion: 0.21
Nodes (13): DevelopersPage(), metadata, NewFormPage(), metadata, PartnerOnboarding(), metadata, PartnerSettings(), metadata (+5 more)

### Community 117 - "handlers/webhooks.ts"
Cohesion: 0.16
Nodes (12): handlers, webhookDeliver(), InlineRunner, runInline(), signWebhook(), documents, facts, partners (+4 more)

### Community 118 - "recipes/index.ts"
Cohesion: 0.23
Nodes (11): ResolvedGenericField, globToRegExp(), matchGenericLabel(), matchRecipe(), RECIPES, resolveFields(), DocLike, LabelRule (+3 more)

### Community 119 - "fill.ts"
Cohesion: 0.26
Nodes (14): activeFields, boot(), detect(), doc(), ghostLabel(), injectStyles(), labelTextFor(), niceIssuer() (+6 more)

### Community 120 - "schema/src/index.ts"
Cohesion: 0.26
Nodes (8): metadata, AppDto, KIND_LABEL, STATUS_META, TrackDrawer(), APPLICATION_STATUSES, DataColumn, DataTable()

### Community 121 - "verification.ts"
Cohesion: 0.18
Nodes (12): notify(), digilockerSync(), failJob(), FILE_FACT_KEY, finishJob(), setProgress(), logger, mismatches (+4 more)

### Community 122 - "2. Work packages (parallel, disjoint ownership)"
Cohesion: 0.13
Nodes (14): 0. Decisions already made (do not re-litigate), 1. Conventions, 2. Work packages (parallel, disjoint ownership), 3. API surface (from docs/05, authoritative) — implement exactly these paths under `/api/v1`, 4. Definition of done (v0.9 demo), 5. Dependency requests (append here; do not install), Build plan — Praman v0.9 (2026-09-02), WP1 — Citizen core: Home · Vault · Documents · Verify · Onboarding (+6 more)

### Community 123 - "wizard.tsx"
Cohesion: 0.21
Nodes (9): { POST, GET }, saveNameAndLocale(), EDU_SECTIONS, FAMILY_KEYS, ID_SECTIONS, OnboardingWizard(), STEPS(), Auth (+1 more)

### Community 124 - "mock-consent.tsx"
Cohesion: 0.19
Nodes (6): metadata, metadata, metadata, BRAND, MockConsent(), PEOPLE

### Community 125 - "family-client.tsx"
Cohesion: 0.22
Nodes (12): FamilyMember, AddDrawer(), api(), ClaimModal(), EditModal(), FamilyClient(), REL, secLabel() (+4 more)

### Community 126 - "web/package.json"
Cohesion: 0.17
Nodes (11): name, private, scripts, build, dev, start, test, test:e2e (+3 more)

### Community 127 - "partners/page.tsx"
Cohesion: 0.26
Nodes (8): dynamic, COLOR, dynamic, PartnersAdmin(), call(), FlagToggle(), NewFlag(), PartnerStatus()

### Community 128 - "11 — UX Flows"
Cohesion: 0.17
Nodes (11): 11 — UX Flows, F10 — Partner onboarding → form builder → first share → status push, F1 — Onboarding, F2 — DigiLocker connect, F3 — Upload → OCR review, F4 — Apply with Praman (partner-initiated), F5 — Extension autofill, F6 — Family: add minor / add elder / handover at 18 (+3 more)

### Community 129 - "background.ts"
Cohesion: 0.33
Nodes (10): apiFetch(), broadcastAuthChanged(), getStoredAuth(), handle(), setStoredAuth(), StoredAuth, toAuthState(), ApiEnvelope (+2 more)

### Community 130 - "fillField"
Cohesion: 0.29
Nodes (9): fillField(), optionsFor(), setNativeValue(), sweep(), applyMap(), applyTransform(), isIsoDate(), pickArrayIndex() (+1 more)

### Community 131 - "RUNBOOK"
Cohesion: 0.18
Nodes (10): Backups & retention, Breach runbook (DPDP Rules 2025), Common ops, Deploy, Env matrix (see `.env.example`), Environments, Key rotation, Observability (+2 more)

### Community 132 - "Popup"
Cohesion: 0.22
Nodes (5): sendToBackground(), el, Popup(), disconnect(), switchProfile()

### Community 133 - "BTA-JEE 2026 — field map"
Cohesion: 0.22
Nodes (8): BTA-JEE 2026 — field map, Notes for the `bta-demo` extension recipe, Step 1 — Personal Details, Step 2 — Contact & Address, Step 3 — Parents & Income, Step 4 — Category & Eligibility, Step 5 — Education (Class 10 / 12), Step 6 — Exam Preferences & Declaration (BTA-only custom questions)

### Community 134 - "Bharat Test Agency — BTA-JEE 2026 Registration (demo exam portal)"
Cohesion: 0.22
Nodes (8): Bharat Test Agency — BTA-JEE 2026 Registration (demo exam portal), DEMO_OFFLINE mode, Env vars (from root `.env`), Routes, Run it, Storage, The 3-minute demo script (docs/05-API-AND-FLOWS.md §4), What depends on WP2

### Community 135 - "family/data.ts"
Cohesion: 0.31
Nodes (6): FamilyPage(), metadata, AddButton(), CORE_KEYS, CORE_SECTIONS, familyList()

### Community 136 - "client.ts"
Cohesion: 0.31
Nodes (4): AuditInput, g, sql, auditLog

### Community 137 - "Praman — Verify once. Apply anywhere."
Cohesion: 0.22
Nodes (8): Commands, Docs, Praman — Verify once. Apply anywhere., Principles, Run it (5 minutes), Status, The 3-minute demo, What’s inside

### Community 138 - "jws-verify.ts"
Cohesion: 0.39
Nodes (7): base64urlToBytes(), base64urlToJson(), Jwk, Jwks, JwsHeader, JwsVerifyError, verifyEs256Jws()

### Community 139 - "select-match.ts"
Cohesion: 0.46
Nodes (6): containsWord(), matchBoolOption(), matchOption(), norm(), SelectOption, socialCategoryOptions

### Community 141 - "demo-exam-portal/src/app/layout.tsx"
Cohesion: 0.38
Nodes (3): metadata, GovFooter(), GovHeader()

### Community 142 - "Praman Autofill (Chrome MV3)"
Cohesion: 0.29
Nodes (6): Adding a recipe, Connect flow, How a page gets filled, Load unpacked, Praman Autofill (Chrome MV3), What's verified vs. not

### Community 143 - "@praman/sdk"
Cohesion: 0.29
Nodes (6): Browser button, Errors, Payload (`PramanPayload`, from `@praman/schema`), @praman/sdk, Server (Node 20+), Webhooks

### Community 144 - "registerOrganisation"
Cohesion: 0.50
Nodes (4): registerOrganisation(), KINDS, OnboardingForm(), REG

### Community 145 - "WP1 — Citizen core (Home · Vault · Documents · Verify · Onboarding · APIs · SSE · step-up)"
Cohesion: 0.40
Nodes (4): Decisions, Files, Verify, WP1 — Citizen core (Home · Vault · Documents · Verify · Onboarding · APIs · SSE · step-up)

### Community 146 - "WP4 — background worker (apps/worker)"
Cohesion: 0.40
Nodes (4): Files, Tests (`test/*.test.ts`, vitest, real local DB+redis via `test/setup.ts`), Verify, WP4 — background worker (apps/worker)

### Community 147 - "WP6 — Chrome MV3 autofill extension (2026-09-02)"
Cohesion: 0.40
Nodes (4): Extension (`apps/extension`), Verify, Web endpoints (`apps/web/src/app/api/v1/extension`), WP6 — Chrome MV3 autofill extension (2026-09-02)

### Community 149 - "WP2 plan — consent & share · partner API · console · SDK · tracker · connections (2026-09-02)"
Cohesion: 0.50
Nodes (3): Decisions, Files, WP2 plan — consent & share · partner API · console · SDK · tracker · connections (2026-09-02)

### Community 150 - "WP5 — Family · Notifications · Settings & data rights · Admin · Public site (2026-09-02)"
Cohesion: 0.50
Nodes (3): Approach (ponytail), Files, WP5 — Family · Notifications · Settings & data rights · Admin · Public site (2026-09-02)

## Knowledge Gaps
- **878 isolated node(s):** `config`, `name`, `version`, `private`, `type` (+873 more)
  These have ≤1 connection - possible missing edges or undocumented components. (Counts symbols only; 1014 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **29 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `Db` connect `db/src/index.ts` to `signing.ts`, `seed.ts`, `citizen-shell.tsx`, `family/data.ts`, `client.ts`, `invite/route.ts`, `handlers/data.ts`, `ok`, `jobs/src/index.ts`, `ui/src/index.ts`, `partner/actions.ts`, `[token]/consent/route.ts`, `lib/session.ts`, `ApiError`, `getDek`, `admin/data.ts`, `PageHeader`, `[consentId]/page.tsx`, `blocks.tsx`, `log`, `prefs.ts`, `putFact`, `_lib.ts`, `requirePartnerMember`, `handlers/webhooks.ts`, `schema/src/index.ts`, `verification.ts`, `wizard.tsx`, `partners/page.tsx`?**
  _High betweenness centrality (0.033) - this node is a cross-community bridge._
- **Why does `t` connect `db/src/index.ts` to `signing.ts`, `citizen-shell.tsx`, `family/data.ts`, `invite/route.ts`, `ok`, `ui/src/index.ts`, `partner/actions.ts`, `[token]/consent/route.ts`, `lib/session.ts`, `ApiError`, `getDek`, `admin/data.ts`, `PageHeader`, `[consentId]/page.tsx`, `blocks.tsx`, `log`, `prefs.ts`, `putFact`, `_lib.ts`, `requirePartnerMember`, `schema/src/index.ts`, `wizard.tsx`, `partners/page.tsx`?**
  _High betweenness centrality (0.019) - this node is a cross-community bridge._
- **Why does `isFactKey()` connect `ApiError` to `db/src/index.ts`, `field`, `seed.ts`, `registry.ts`, `handlers/data.ts`, `partner/actions.ts`, `ok`, `jobs/src/index.ts`, `[token]/consent/route.ts`, `putFact`, `_lib.ts`, `getDek`, `recipes/index.ts`?**
  _High betweenness centrality (0.014) - this node is a cross-community bridge._
- **What connects `config`, `name`, `version` to the rest of the system?**
  _878 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `signing.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.12100840336134454 - nodes in this community are weakly interconnected._
- **Should `seed.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.05288207297726071 - nodes in this community are weakly interconnected._
- **Should `core.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.059233449477351915 - nodes in this community are weakly interconnected._