# Graph Report - files (2)  (2026-09-02)

## Corpus Check
- 134 files · ~79,421 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 1238 nodes · 1554 edges · 107 communities (59 shown, 31 thin omitted)
- Extraction: 100% EXTRACTED · 0% INFERRED · 0% AMBIGUOUS
- Token cost: 0 input · 0 output

## Community Hubs (Navigation)
- facts.ts
- seed.ts
- api.ts
- core.ts
- dependencies
- devDependencies
- devDependencies
- devDependencies
- db/package.json
- devDependencies
- format.ts
- globalEnv
- compilerOptions
- scripts
- sdk/package.json
- 01 — Product Requirements Document: ApplyOnce
- Part B — HeroUI v3 integration notes (verified against the published npm packages, 2026-09-02)
- Stack Verified Notes (2026-09-02)
- 1. API surface (Next.js route handlers, `/api/v1`)
- providers/package.json
- enums.ts
- crypto/package.json
- schema/package.json
- 04 — Design system ("ApplyOnce Bright")
- jobs/package.json
- web/tsconfig.json
- 2. Phase prompts
- demo-exam-portal/tsconfig.json
- 1. Canonical Citizen Schema (`packages/schema`)
- 10 — PRD v2 (supersedes 01-PRD.md, kept consistent with it)
- India DPI & KYC Integration Landscape for ApplyOnce (2026)
- Part A — Life-stage use-case map (150+ application types)
- schema/src/index.ts
- registry.ts
- schema/src/types.ts
- 3. Life-stage catalogue
- field
- extension/tsconfig.json
- 09 — GTM and Business
- schema/auth.ts
- jobs/src/index.ts
- payload.ts
- src/app/layout.tsx
- 02 — Architecture
- dependencies
- ApplyOnce — Market, Competitors, Business Model & GTM Research
- compilerOptions
- config/package.json
- include
- ui/tsconfig.json
- worker/tsconfig.json
- crypto/tsconfig.json
- providers/tsconfig.json
- schema/tsconfig.json
- sdk/tsconfig.json
- ApplyOnce — agent instructions
- 08 — Integrations Plan
- jobs/tsconfig.json
- ApplyOnce — build kit
- proxy.ts
- demo-exam-portal/next.config.ts
- AGENTS.md
- web/next.config.ts
- next-env.d.ts
- @aws-sdk/s3-request-presigner
- better-auth
- @better-auth/drizzle-adapter
- @better-auth/passkey
- bullmq
- @heroui/react
- @heroui/styles
- @hookform/resolvers
- ioredis
- jose
- lucide-react
- motion
- next
- pino
- @applyonce/crypto
- @applyonce/db
- @applyonce/jobs
- @applyonce/providers
- @applyonce/schema
- @applyonce/ui
- react
- react-aria
- react-aria-components
- react-hook-form
- zod
- { useSession, signOut }

## God Nodes (most connected - your core abstractions)
1. `Stack Verified Notes (2026-09-02)` - 20 edges
2. `cx()` - 19 edges
3. `field()` - 18 edges
4. `putFact` - 17 edges
5. `compilerOptions` - 15 edges
6. `India DPI & KYC Integration Landscape for ApplyOnce (2026)` - 15 edges
7. `Db` - 12 edges
8. `scripts` - 11 edges
9. `getDek()` - 11 edges
10. `1. Canonical Citizen Schema (`packages/schema`)` - 11 edges

## Surprising Connections (you probably didn't know these)
- `log()` --calls--> `audit()`  [EXTRACTED]
  apps/web/src/lib/api.ts → packages/db/src/audit.ts
- `Auth` --calls--> `audit()`  [EXTRACTED]
  apps/web/src/lib/auth.ts → packages/db/src/audit.ts
- `partner()` --calls--> `sha256()`  [EXTRACTED]
  apps/web/src/lib/api.ts → packages/crypto/src/envelope.ts
- `Auth` --calls--> `putFact`  [EXTRACTED]
  apps/web/src/lib/auth.ts → packages/db/src/facts.ts
- `Auth` --calls--> `getDek()`  [EXTRACTED]
  apps/web/src/lib/auth.ts → packages/db/src/keys.ts

## Import Cycles
- None detected.

## Communities (107 total, 31 thin omitted)

### Community 0 - "facts.ts"
Cohesion: 0.06
Nodes (49): { POST, GET }, Auth, authClient, blindIndex(), canonicalHash(), decrypt(), decryptJson(), decryptString() (+41 more)

### Community 1 - "seed.ts"
Cohesion: 0.05
Nodes (37): days(), main(), req(), seedDependent(), seedPartner(), sysKey(), AARAV, byPhone() (+29 more)

### Community 2 - "api.ts"
Cohesion: 0.07
Nodes (35): AdminLayout(), AppLayout(), LoginForm(), LoginPage(), metadata, PartnerLayout(), CitizenShell(), IconName (+27 more)

### Community 3 - "core.ts"
Cohesion: 0.04
Nodes (43): appKind, applicationDocuments, applicationEvents, applications, appSource, appStatus, consents, dataRequestKind (+35 more)

### Community 4 - "dependencies"
Cohesion: 0.05
Nodes (41): dependencies, @aws-sdk/client-s3, @aws-sdk/s3-request-presigner, bullmq, ioredis, pino, pino-pretty, @applyonce/crypto (+33 more)

### Community 5 - "devDependencies"
Cohesion: 0.06
Nodes (39): dependencies, next, @applyonce/schema, devDependencies, @heroui/react, lucide-react, motion, next (+31 more)

### Community 6 - "devDependencies"
Cohesion: 0.05
Nodes (37): dependencies, next, @applyonce/schema, @applyonce/sdk, react, react-dom, zod, devDependencies (+29 more)

### Community 7 - "devDependencies"
Cohesion: 0.05
Nodes (37): dependencies, @applyonce/schema, react, react-dom, devDependencies, @crxjs/vite-plugin, tailwindcss, @tailwindcss/vite (+29 more)

### Community 8 - "db/package.json"
Cohesion: 0.05
Nodes (36): drizzle-kit, drizzle-orm, dependencies, drizzle-orm, postgres, @applyonce/crypto, @applyonce/providers, @applyonce/schema (+28 more)

### Community 9 - "devDependencies"
Cohesion: 0.06
Nodes (34): devDependencies, pino-pretty, @playwright/test, postcss, @applyonce/config, tailwindcss, @tailwindcss/postcss, @types/node (+26 more)

### Community 10 - "format.ts"
Cohesion: 0.12
Nodes (19): PURPOSE_LABELS, ENUM_LABELS, DocCard(), DocCardData, EmptyState(), cx(), daysUntil(), fmtDate() (+11 more)

### Community 11 - "globalEnv"
Cohesion: 0.07
Nodes (30): BETTER_AUTH_*, ^build, DATABASE_URL, !.next/cache/**, NEXT_PUBLIC_*, NODE_ENV, APPLYONCE_*, PROVIDER_* (+22 more)

### Community 12 - "compilerOptions"
Cohesion: 0.08
Nodes (24): compilerOptions, allowImportingTsExtensions, esModuleInterop, isolatedModules, jsx, lib, module, moduleResolution (+16 more)

### Community 13 - "scripts"
Cohesion: 0.09
Nodes (21): devDependencies, turbo, typescript, engines, node, turbo, typescript, name (+13 more)

### Community 14 - "sdk/package.json"
Cohesion: 0.09
Nodes (21): dependencies, jose, @applyonce/schema, description, devDependencies, @types/node, typescript, vitest (+13 more)

### Community 15 - "01 — Product Requirements Document: ApplyOnce"
Cohesion: 0.10
Nodes (20): 01 — Product Requirements Document: ApplyOnce, 1. Problem, 2. Vision, 3. Personas, 4.1 Education, 4.2 Identity & civic, 4.3 Financial & KYC, 4.4 Health (+12 more)

### Community 16 - "Part B — HeroUI v3 integration notes (verified against the published npm packages, 2026-09-02)"
Cohesion: 0.10
Nodes (20): Code snippets (verbatim from official docs, [heroui.com/docs/react/components](https://heroui.com/docs/react/components/button)), Component inventory (85 importable modules in `@heroui/react@3.2.4`), Context: the ground shifted twice in 2026, Font pairings (EN + Devanagari), Live data snapshot (pulled 2026-09-02, npm + GitHub APIs), Packages & install, Part A — Library comparison (2026 state), Part B — HeroUI v3 integration notes (verified against the published npm packages, 2026-09-02) (+12 more)

### Community 17 - "Stack Verified Notes (2026-09-02)"
Cohesion: 0.10
Nodes (20): 10. turbo 2.10 + pnpm workspaces, 11. motion 13, 12. @tanstack/react-query 5 (Next.js App Router), 13. vitest 4 + Playwright 1.62, 14. Chrome MV3 extension (Vite 6/7 + React), 15. Node crypto (AES-256-GCM, HKDF, argon2, HMAC), 16. react-hook-form 7.87 + zod resolver, 17. pino 10 + Sentry (@sentry/nextjs) (+12 more)

### Community 18 - "1. API surface (Next.js route handlers, `/api/v1`)"
Cohesion: 0.10
Nodes (19): 05 — API, user flows, partner protocol, extension, 1. API surface (Next.js route handlers, `/api/v1`), 2. End-to-end flows, 3. `@applyonce/sdk` (partner-facing, tiny), 4. Demo exam portal script (what judges see, ~3 min), Applications, Auth, Consent & share (citizen side) (+11 more)

### Community 19 - "providers/package.json"
Cohesion: 0.10
Nodes (19): dependencies, @applyonce/schema, devDependencies, @types/node, typescript, vitest, exports, ./fixtures (+11 more)

### Community 20 - "enums.ts"
Cohesion: 0.10
Nodes (19): ACCOUNT_TYPE, BLOOD_GROUP, BOARD, DEGREE_STATUS, EDU_LEVEL, EXAM, GENDER, INDIA_STATES (+11 more)

### Community 21 - "crypto/package.json"
Cohesion: 0.11
Nodes (18): dependencies, jose, devDependencies, @types/node, typescript, vitest, exports, jose (+10 more)

### Community 22 - "schema/package.json"
Cohesion: 0.11
Nodes (18): dependencies, zod, devDependencies, @types/node, typescript, vitest, exports, @types/node (+10 more)

### Community 23 - "04 — Design system ("ApplyOnce Bright")"
Cohesion: 0.11
Nodes (17): 04 — Design system ("ApplyOnce Bright"), 1. Personality, 2. Tokens (Tailwind v4 `@theme` + HeroUI theme), 3. Colour usage rules, 4. Motion, 5. Components (HeroUI v3 base → composed in `packages/ui`), 6. Layouts, 7. Complete page list (+9 more)

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

### Community 30 - "India DPI & KYC Integration Landscape for ApplyOnce (2026)"
Cohesion: 0.12
Nodes (15): 10. Exam & Admission Bodies, 11. KYC/Identity Aggregators (2026 comparison), 12. Legal — DPDP Act 2023 + DPDP Rules 2025, 13. Auth Tech for Citizens, 1. DigiLocker — API Setu, Entity Locker, MeriPehchaan, 2. Aadhaar — Offline XML, Online OTP eKYC, Vault, Legal Boundaries, 3. PAN Verification, 4. ABHA / ABDM (Ayushman Bharat Digital Mission) (+7 more)

### Community 31 - "Part A — Life-stage use-case map (150+ application types)"
Cohesion: 0.12
Nodes (15): A1. Birth to 5, A2. School (6–17), A3. 18–24 Higher Education, A4. 21–30 Jobs & Early Career, A5. 25–50 Adult Life, A6. 50+ / Senior Citizens, A7. Cross-cutting (all ages), B1. Field list per form (from official bulletins/portals) (+7 more)

### Community 32 - "schema/src/index.ts"
Cohesion: 0.20
Nodes (11): canShare(), scopeForPurpose(), fieldsInSection(), REGISTRY, REGISTRY_MAP, RE, registryJsonSchema(), validateFact() (+3 more)

### Community 33 - "registry.ts"
Cohesion: 0.17
Nodes (14): address(), ALL, eduLevel(), f(), FACT_KEYS, FactKey, higherEd(), Opt (+6 more)

### Community 34 - "schema/src/types.ts"
Cohesion: 0.19
Nodes (12): SECTION_META, SectionMeta, FACT_TYPES, FactType, FieldDef, Label, PURPOSES, Section (+4 more)

### Community 35 - "3. Life-stage catalogue"
Cohesion: 0.15
Nodes (12): 07 — Use-Case Catalog, 1. How to read this catalog, 2. Top-40 fields by cross-form frequency, 3.1 Birth to 5, 3.2 School (6–17), 3.3 Higher education (18–24), 3.4 Early career (21–30), 3.5 Adult life (25–50) (+4 more)

### Community 36 - "field"
Cohesion: 0.29
Nodes (11): field(), Fact, coerce(), FactRow(), FactRowProps, FieldDiff(), STATUS, fmtMoney() (+3 more)

### Community 37 - "extension/tsconfig.json"
Cohesion: 0.17
Nodes (11): compilerOptions, jsx, types, extends, include, node, ../../packages/config/tsconfig.base.json, src (+3 more)

### Community 38 - "09 — GTM and Business"
Cohesion: 0.17
Nodes (11): 09 — GTM and Business, 10. KPIs to track from day one, 1. Global analogs — what to copy, 2. India landscape, 3. Business model & pricing, 4. TAM / SAM / SOM, 5. Moats, 6. Risks (§F) (+3 more)

### Community 39 - "schema/auth.ts"
Cohesion: 0.23
Nodes (10): account, passkey, session, user, userKeys, verification, bytea, createdAt() (+2 more)

### Community 40 - "jobs/src/index.ts"
Cohesion: 0.23
Nodes (11): enqueue(), g, JobMap, JobName, queue(), QUEUE_OF, queueFor(), QueueName (+3 more)

### Community 41 - "payload.ts"
Cohesion: 0.26
Nodes (11): APPLICATION_STATUSES, ApplicationStatus, CustomField, FieldDiffRow, FormDef, ApplyOncePayload, SharedFact, WebhookEvent (+3 more)

### Community 42 - "src/app/layout.tsx"
Cohesion: 0.22
Nodes (7): bricolage, devanagari, inter, metadata, mono, viewport, Providers()

### Community 43 - "02 — Architecture"
Cohesion: 0.20
Nodes (9): 02 — Architecture, 1. Principles, 2. Stack (decided), 3. Monorepo layout, 4. Core domains (bounded contexts inside the monolith), 5. Provider adapter layer (`packages/providers`), 6. Security & privacy, 7. Scalability notes (+1 more)

### Community 44 - "dependencies"
Cohesion: 0.22
Nodes (9): dependencies, @aws-sdk/client-s3, react-dom, @tanstack/react-query, @tanstack/react-table, @aws-sdk/client-s3, react-dom, @tanstack/react-query (+1 more)

### Community 45 - "ApplyOnce — Market, Competitors, Business Model & GTM Research"
Cohesion: 0.22
Nodes (8): A. Global analogs, B. India landscape, C. Private competitors and adjacents, D. Business model options and TAM/SAM/SOM, E. Regulatory sequencing and GTM enablers, F. Risks and moats, G. Recommended 12-month GTM plan, ApplyOnce — Market, Competitors, Business Model & GTM Research

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

### Community 55 - "ApplyOnce — agent instructions"
Cohesion: 0.40
Nodes (4): Commands, ApplyOnce — agent instructions, Standing rules (stated once), Structure

### Community 56 - "08 — Integrations Plan"
Cohesion: 0.40
Nodes (4): 08 — Integrations Plan, 1. Provider-by-provider plan, 2. DPDP Act 2025 compliance checklist → product features, 3. 12-month provider roadmap

### Community 57 - "jobs/tsconfig.json"
Cohesion: 0.40
Nodes (4): extends, include, ../config/tsconfig.base.json, src

### Community 58 - "ApplyOnce — build kit"
Cohesion: 0.50
Nodes (3): Honest constraints baked into the plan, ApplyOnce — build kit, The one-paragraph pitch

## Knowledge Gaps
- **644 isolated node(s):** `config`, `name`, `version`, `private`, `type` (+639 more)
  These have ≤1 connection - possible missing edges or undocumented components. (Counts symbols only; 727 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **31 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `Source` connect `payload.ts` to `facts.ts`, `registry.ts`, `schema/src/types.ts`, `format.ts`?**
  _High betweenness centrality (0.008) - this node is a cross-community bridge._
- **Why does `BETTER_AUTH_*` connect `globalEnv` to `facts.ts`?**
  _High betweenness centrality (0.008) - this node is a cross-community bridge._
- **Why does `putFact` connect `facts.ts` to `schema/src/index.ts`, `payload.ts`, `field`, `seed.ts`?**
  _High betweenness centrality (0.008) - this node is a cross-community bridge._
- **What connects `config`, `name`, `version` to the rest of the system?**
  _644 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `facts.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.0594679186228482 - nodes in this community are weakly interconnected._
- **Should `seed.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.051587301587301584 - nodes in this community are weakly interconnected._
- **Should `api.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.07215686274509804 - nodes in this community are weakly interconnected._