# ApplyOnce audit and implementation report

Audit date: 6 September 2026, with final local release follow-up on 7 September 2026. Baseline: `bd3dc84218110d04fd917e6ad363d75c560b3bbb`. Scope: the full monorepo, current and historical Markdown, configuration, application routes, shared packages, worker, SDK and extension.

## 7 September release follow-up

### Public deployment verification

The submitted ApplyOnce alias and the independent BTA portal were deployed as separate Vercel projects and tested together from a clean Chromium session. The portal's former localhost-only JSON store was replaced with authenticated, TTL-bounded Redis state; ApplyOnce remains the authority for the consent, signed exchange, application and citizen timeline.

| Public check | Result |
|---|---|
| `https://applyonce-silk.vercel.app/demo` | Opens without access approval and links to the public BTA portal |
| `https://applyonce-bta-demo.vercel.app` | Opens without access approval; manual and ApplyOnce paths render |
| BTA → ApplyOnce handshake | Fresh partner session returns HTTP 303 to a one-time ApplyOnce share URL |
| Complete SDK journey | Consent, OTP, signed exchange, BTA review reload, edited submission, external reference and status callback passed |
| Backend persistence | Profile edit survived reload and was restored; BTA review/application survived reload; partner form, feature flag and preferences survived reload |
| Route/control browser sweep | **17/17 passed** across public, citizen, partner, operations and BTA pages |
| Automated package tests | **109/109 passed** across crypto, schema, providers, SDK, extension, database, web and worker suites |
| Production health | ApplyOnce Postgres operational; BTA Redis and upstream ApplyOnce checks operational |
| Public backend proof | Demo page refreshes sanitized ApplyOnce/Postgres/BTA/Redis status and deployed commit |
| Consent evidence | Authenticated JSON download verifies with ES256/JWKS, matches the exchanged payload hash and contains no citizen values |

All issuer, SMS, email, OCR and government-provider adapters remain explicitly labelled `mock`. This green result applies to the public synthetic sandbox, not to unapproved government connectivity or a real-data launch.

The final localhost release pass repeated the complete citizen, partner, operations and BTA workflows in both development and optimized production mode. It corrected additional issues found only through broad browser rendering and manual state progression:

| Finding | Correction and proof |
|---|---|
| Demo seed duplicated records on repeated setup | Seed now reuses profiles, documents, partners, forms, memberships, keys, flags and demo records. Two consecutive seeds produce unchanged counts. |
| A development database reset could leave process-cached encryption keys stale | Development rereads wrapped keys; production retains the process cache. Database and crypto suites pass after a clean reset. |
| Masked annual income rendered as `₹NaN` in consent | Formatting preserves sensitive masked placeholders. The consent screen was rechecked in the browser. |
| Notifications could hydrate with a different relative minute | Server supplies one render timestamp for grouping and relative labels. The all-page browser sweep now reports no hydration errors. |
| Operations audit table widened the entire desktop shell | The shell grid now uses `minmax(0,1fr)` and a `min-width: 0` content column; the table scrolls inside its card. |
| Sandbox controls allowed contradictory terminal status changes | A shared forward-only status state machine now protects both partner APIs and the BTA simulator. A rejected application returns 409 for a later acceptance, remains rejected, and displays no invalid action. |
| Authenticated pages repeated session/profile work and dashboard queries ran serially | Request-level React caching and parallel independent database reads remove the avoidable waterfalls. |
| Route-only checks could miss hydration, labels and viewport defects | A permanent Playwright sweep covers every public, citizen, partner, operations and BTA page plus seeded detail pages. A source gate rejects placeholder links, handlerless buttons and empty event handlers across 117 TSX files. |

Final release evidence on 7 September 2026:

| Check | Result |
|---|---|
| Unit and database integration suites | **109/109 passed** across eight package tasks |
| TypeScript | **11/11 tasks passed** |
| Optimized production build | **3/3 passed** in 1m 14.81s: web, BTA and extension |
| Browser workflows in production mode | **17/17 passed** in 1.3m |
| API, authorization, persistence and route audit in production mode | **83/83 passed** |
| ESLint and interaction source gates | **Passed with zero warnings**; 118 TSX files checked for stale controls |
| Production dependency audit | **0 known vulnerabilities** |
| Warm localhost response sample | Authenticated pages **16–26ms total**; BTA homepage **1.5–2.5ms total** |
| Runtime health | Public status page reports web, Postgres, Redis and worker heartbeat operational |

Production-mode package commands must be launched through `node scripts/run.mjs ...` so the root environment is loaded, exactly as documented in `RUNBOOK.md`. Direct package starts intentionally do not discover a repository-root `.env` from a nested workspace. The final browser run used the documented wrapper commands.

## Method and environment

Graphify was used to query the existing dependency graph before code changes and to extract a refreshed code graph afterward. The source inventory reads text files and records hashes, line counts, headings and exported symbols. Graph navigation and source review were followed by TypeScript checks, unit/database tests, production builds, authenticated HTTP checks and native browser workflows.

Validation used a separate worktree, database `applyonce_audit_20260906`, Redis database 6, S3 bucket `applyonce-audit-20260906`, web port 3400 and BTA port 3401. Existing servers on 3300/3301 were left running. Provider/SMS/OCR data was mocked; database, object storage, worker queues, SDK exchange and application callbacks were real local services.

Reading/inventory coverage is not the same as executing every state combination. This report distinguishes executable checks from source review and external validation. It is an engineering audit, not an independent penetration test, accessibility certification or production-readiness certification.

## Findings corrected

| Area | Observed gap | Implemented correction |
|---|---|---|
| Interactive controls | Partner checkboxes and unlabeled admin/preference switches lacked the required HeroUI clickable content | Correct component anatomy across form builder, re-verification selection, webhooks, flags, preferences and fact editors |
| Production build | Citizen loading screen imported a client-only HeroUI module from a server component | Explicit client boundaries across pages and shared UI components |
| Navigation performance | Dynamic namespace lookups imported the full icon catalog | Explicit icon maps for citizen/partner/admin/vault navigation |
| Environment | Direct workspace processes could miss root `.env`; development mode leaked into builds | Root environment loader and explicit production build/start mode |
| Docker context | Environment files and local records could enter image build context | `.dockerignore` excludes secrets, caches and demo application data |
| Family authorization | Ownership of a dependent record bypassed delegated scope | Shared database resolver uses current relationship scope and validity |
| Expired delegation | Active-profile session could point to a no-longer-accessible profile | Resolve/fall back to an accessible profile |
| Adult consent | Guardian could widen adult scope or extend it unilaterally | Reject scope increases and expiry extensions |
| Provider identity | A guardian could initiate its own provider import into a ward | Provider connections require the user's own self profile |
| Empty scope | Empty key filter returned the entire vault | Empty key request returns no facts |
| System fields | System-only references could leak through ordinary fact/history/extension reads | Explicit system-field exclusions |
| Browser mutations | Cookie APIs lacked a consistent cross-origin mutation guard | Origin validation for citizen mutation requests |
| Passkey step-up | A fresh ordinary login could be mistaken for a verified passkey step-up | Require the timestamp set after the actual authentication assertion |
| Documents | File references were not consistently checked for ownership/type/readiness | Shared `putFact` validation plus endpoint scope enforcement |
| Document scope | Listing, extraction and download paths differed in scope handling | Shared document-type/scope checks across UI and API |
| Upload contract | Client/server/worker size and MIME rules differed | Shared 15 MB PDF/JPEG/PNG/WebP contract; worker verifies size, header and hash |
| Upload completion | Completion could be reused for non-upload or invalid-state documents | Origin/state checks and idempotent completion of ready files |
| Sample evidence | Seeded files had no working preview; photo/signature selection lacked suitable fixtures | Deterministic sample attachments with correct hashes and document types |
| Preview tokens | Extension document URLs could expose a long-lived bearer token | Five-minute document/session-bound preview tickets; tamper and access re-checks |
| Extension access | Query-string token and OTP paths exposed sensitive authorization material | Authorization bearer and step-up header; dedicated extension sessions |
| Consent permissions | Share flows could select fields/documents beyond a delegated profile's access | Validate scope on page, preview, new facts, required facts and document choices |
| Consent quality | Required expired/conflicting facts could be submitted | Block required unusable evidence and expose readiness repair steps |
| Custom answers | Choice/date/number/boolean/file inputs were not uniformly validated | Shared typed, bounded validation and file ownership/scope checks |
| Consent race | An open share session could be submitted more than once | Atomic transactional claim before consent/share/application writes; exchange serializes with revocation on the consent row |
| Denial | Decline navigation did not invalidate the server session | Cancellation endpoint marks the link unusable |
| Redirects | Partner return URLs could lead to arbitrary origins | Match registered redirect origins; sandbox exception limited to ApplyOnce origin |
| Dead catalog links | Seeded non-BTA institutions redirected to `.example` pages | Complete hosted sandbox submissions with ApplyOnce tracker returns |
| Expired/revoked access | Payload access and status handling did not consistently reject ended consent | Explicit expiry/revocation checks and “Access ended” applicant UI |
| Dependency advisory | Transitive esbuild 0.18.20 had a moderate development-server advisory | Targeted core-utils override to 0.25.12; Drizzle configuration checks and production dependency scan pass |
| Concurrent fact updates | Provider refresh and self edits could race on provenance | Row-locked transaction covering the fact, derived values and history; concurrent-write regression |
| Verified refresh | Equal-value provider refresh could retain stale expiry | Refresh verification metadata even when a verified value is unchanged |
| Mismatch resolution | Keeping a weaker proposed value could appear to clear verification conflict | Preserve verified evidence and require re-verification |
| Partner operations | Multi-organization account had no usable organization switcher | Membership-validated switcher across all three seeded institutions |
| Partner ownership | Team actions could remove/demote the organization owner | Owner protection |
| Live keys | Pending organizations could create live credentials | Verified organization required |
| BTA exchange | Review reload re-used single-use exchange material | Cookie-bound callback and persisted, expiring review draft |
| BTA trust | Browser-hidden identifiers could substitute application/consent/documents | Server draft supplies trusted identifiers and attachments |
| BTA edits | Switching review modes could discard edits | Persistent controlled form values and tested edit/review/submit path |
| BTA dates | ISO review dates could fail display-oriented date validation | Calendar-valid ISO and day/month/year normalization |
| BTA submission | Duplicate submit and lost-response retry could produce inconsistent access | Completed draft points to the existing local record; retry restores access cookie |
| BTA privacy | Reference-only status URLs exposed applications | Browser-bound access cookie required |
| BTA fallback | Failed configured integration could silently become offline success | Explicit `DEMO_OFFLINE=1` required; normal mode rejects offline tokens |
| BTA simulator | Sample administration behavior was not gated for production mode | Explicit flag plus application access cookie and status validation |
| BTA persistence | Bad JSON could be silently replaced | Atomic file replacement and visible corruption failure |
| e-Sign placeholder | Disabled feature offered no working alternative | OTP-confirmed full-text declaration receipt stored in Documents |
| Mobile pages | Five tabs omitted several core destinations | Full mobile menu for all citizen navigation entries; compact header and constrained document grids on narrow screens |
| Worker health | Reachable Redis was treated as proof a worker was alive | Worker TTL heartbeat and status check |
| Data export | Delegated export handling could exceed current access or use the wrong owner key | Scoped accessible profiles, correct key and omitted internal document metadata |
| Erasure | Pending deletion could not be cancelled; claimed adult profiles risked owner cascade | Cancel action, worker cancellation checks and key-transfer hold |
| Public claims | UI/docs asserted unbuilt compliance, production infrastructure and numerical benefits | Accurate sandbox language, current runbook and explicit integration boundaries |

## New feature: evidence readiness and explanation

A read-only form page assesses required facts by source, presence, expiry, unresolved conflicts and scope. It shows a reproducible percentage, ordered repairs, approaching expiries and the evidence behind the score. Visiting/prefetching this page does not create an application session.

The explanation layer works locally in English/Hindi. When configured, OpenAI Responses receives only derived guidance, with strict structured output, output validation, timeout, rate limit and local fallback. It cannot change facts, eligibility, consent or the deterministic score. No live paid model request was made; adapter behavior was tested using controlled responses.

## Validation results

Final local results on 6 September 2026:

| Check | Result | Evidence / practical scope |
|---|---|---|
| Unit and integration suites | **106 passed**, eight package tasks | Crypto 6, schema 13, providers 3, SDK 4, extension 41, database 6, web 30, worker 3; all rerun after the dependency patch |
| TypeScript | **11/11 tasks passed** | No cache hits; final production builds also complete application type checks |
| Production build | **3/3 passed** | Web, BTA and extension; no cache hits, root build completed in 6m 41.9s on the audit workstation |
| Production API / route audit | **83/83 passed** | Individual assertions in `audit-results.json`; local database, queue, worker, object storage and both apps |
| Chromium browser workflows | **11/11 passed in 25.9s** | Final rebuilt applications; full workflow list below |
| Production dependency audit | **0 known advisories** | 398 dependencies; targeted esbuild patch plus successful Drizzle configuration check |
| Mobile layout | **390px and 320px checks passed** | Full mobile navigation and document-page overflow regression |

The eleven browser cases cover readiness/guide/mobile navigation; BTA consent/refresh/edit/submit/status; organization switching; all six manual application steps; partner form create/edit/publish/archive; admin flag persistence; notification preference persistence; vault edit/source/step-up; signed exchange/replay/revocation; blocked partner fields; and family profile creation/switch/Hindi. The seven newly added workflow cases also assert no uncaught browser errors.

Saved screenshots show [readiness](screenshots/readiness-desktop.png), [mobile documents](screenshots/documents-mobile.png) and [the submitted BTA application](screenshots/bta-submitted.png). Earlier interrupted runs and failures are retained in validation notes and are not counted as passes. CI now runs these checks on pushes, but a successful remote CI run is not claimed by this local audit.

## Coverage map

| Surface | Validation approach |
|---|---|
| Public pages, login, status, legal/rights notices | Source review and production HTTP route sweep; visual inspection of main surfaces |
| Citizen home and ten vault sections | HTTP route sweep; browser edit, source badges and OTP unmasking |
| Apply catalog/readiness/share | Schema and API tests; browser guidance, consent and receipt |
| BTA | Production build, state/draft/date tests, tamper tests, full browser exchange/review/edit/submit/status flow and six-step manual application |
| Documents and declaration | Scoped ownership/type tests; real MinIO upload/worker processing/download; full-text receipt download |
| Family/settings | Scope regressions, hostile API checks, native family/language flow and saved notification preferences |
| Connections/tracking | Receipt/detail routes, revocation and status API behavior |
| Partner portal | Route sweep, organization switch, form create/edit/publish/archive browser workflow and access checks |
| Admin portal | Anonymous/citizen denial, route sweep and persisted feature-flag browser workflow |
| SDK/crypto/database | Signing, HMAC, provenance/encryption, consent-trigger and replay tests |
| Extension | Recipe/mapping/runner unit tests and API boundary tests; unpacked live Chrome is a separate requirement |
| AI | Privacy/request-shape, local fallback and malformed output tests |

## Dependency check

`pnpm audit --prod --json` initially reported one moderate advisory through better-auth → drizzle-kit → esbuild-kit → esbuild 0.18.20. The affected esbuild development-server behavior and patched range are documented by the [esbuild maintainer](https://github.com/evanw/esbuild/security/advisories/GHSA-67mh-4wv8-2f99). A targeted override uses the already-present patched 0.25.12 release for that dependency path. `drizzle-kit check` passes, and the repeated production scan reports zero known advisories across 398 dependencies. This is a point-in-time registry result, not proof that dependencies have no undiscovered flaws.

## Remaining limitations and production work

1. **External providers:** government, financial and health credentials/approvals are unavailable. Mock adapters support the visible local flows. Setu support is partial and requires live contract tests. Licensed e-Sign is represented by an explicitly different declaration receipt.
2. **AI quality:** no live-model quality, cost or latency evaluation has been completed. Local guidance is the dependable demo path. Real document understanding remains a proposal, not the mock OCR behavior.
3. **Storage/data lifecycle:** sensitive canonical facts are encrypted, but this is not blanket encryption of all PII. Document metadata, extraction proposals and BTA's local records require production treatment. Physical S3 purge and lifecycle retention are incomplete; exports/downloaded partner data cannot be remotely erased by consent revocation.
4. **Claimed-profile keys:** the inherited ownership/key model requires a real transfer migration. Erasure safely holds accounts that still own a claimed adult profile, requiring operator action.
5. **BTA scale:** the JSON store is for a single persistent demo process, not concurrent replicas. Manual uploads retain metadata/hashes in the current sample portal; durable binary attachment retrieval is not yet a full BTA production service.
6. **Security depth:** controls were reviewed and tested for the reported cases, but generalized concurrency, abuse, malware, denial-of-service and full penetration testing remain. There is no claim of zero vulnerabilities.
7. **Compatibility/accessibility:** mobile navigation/overflow and selected keyboard/form behavior are checked. Every browser, assistive technology and every possible role/state/action combination has not been independently certified. Hindi coverage is partial outside the established vault/guidance paths.
8. **Notifications/operations:** production SMS/email delivery, managed KMS, observability, incident response, backup restore and legal/privacy review require deployment work. The repository's local jobs and heartbeat are not evidence these services are provisioned.
9. **Extension live sites:** actual external portal DOMs and unpacked extension interaction require compatibility validation. No live government application was submitted during this audit.

The integration roadmap ranks the next work by its effect on trust, reliability and real user outcomes. A successful sandbox demonstration should not be presented as production authorization to process real identity data.
