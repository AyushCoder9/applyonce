# 02 — Architecture

## 1. Principles
1. **Schema is the product.** One canonical Citizen Schema (`packages/schema`) drives the vault UI, the partner form builder, the SDK payload, the extension field maps and the DB. Change it in one place.
2. **Every fact carries provenance.** `source`, `verified_by`, `evidence_id`, `verified_at`, `expires_at`. The UI never shows a value without its trust level.
3. **No share without a consent record.** The consent ledger is written *before* the payload is released; a DB constraint + test enforces it.
4. **Providers are pluggable.** `mock → sandbox → live` per provider via env; the app is fully demoable with `mock`.
5. **Boring, scalable, small-team.** One Next.js monolith + Postgres + Redis + object storage. Split services only when a queue backs up.

## 2. Stack (decided)
| Layer | Choice | Why |
|---|---|---|
| Framework | **Next.js 15 (App Router, TS)** | RSC for fast vault pages, route handlers for API, one deploy |
| UI | **HeroUI v3** + Tailwind v4 + **Motion** | Polished, accessible (React Aria), vibrant out of the box; Motion for micro-interactions |
| Forms | react-hook-form + **zod** (schemas generated from Citizen Schema) | Type-safe, shared client/server validation |
| Data | **TanStack Query** (client), **TanStack Table** (partner tables) | |
| DB | **PostgreSQL 16** (Neon or Supabase) + **Drizzle ORM** | Migrations as code, typed |
| Cache / jobs | **Redis** (Upstash) + **BullMQ** | OCR, provider polling, reminders, webhooks |
| Files | **Cloudflare R2** (S3 API), server-side envelope encryption | Cheap egress |
| Auth | **better-auth** (phone OTP + passkeys/WebAuthn, sessions, orgs) | Passkeys first-class |
| Secrets/KMS | Env in dev; **AWS KMS / Cloudflare secrets** for data-key wrapping in prod | |
| OCR | Provider adapter: Tesseract (mock/dev) → Google Document AI or Surepass OCR (live) | |
| Email/SMS/Push | Resend · MSG91 · Web Push (VAPID) | India-friendly SMS |
| Observability | Sentry + OpenTelemetry → Grafana Cloud; pino logs | |
| Hosting | Vercel (web) + Railway/Fly (worker) or a single VPS via Docker Compose | Compose file ships for judges |
| Extension | Chrome MV3, Vite + React, shares `packages/schema` | |
| Monorepo | **Turborepo + pnpm** | |

## 3. Monorepo layout
```
applyonce/
├─ apps/
│  ├─ web/                 Next.js: citizen app + partner console + admin + public site
│  ├─ worker/              BullMQ workers (OCR, provider polling, reminders, webhooks)
│  ├─ extension/           Chrome MV3 autofill extension
│  └─ demo-exam-portal/    "Bharat Test Agency" — standalone Next.js app consuming the SDK
├─ packages/
│  ├─ schema/              Citizen Schema: zod + JSON Schema + field registry + i18n labels
│  ├─ db/                  Drizzle schema, migrations, seed
│  ├─ providers/           Adapter interfaces + mock/sandbox/live impls (digilocker, aadhaar-offline, pan, abha, aa, esign, ocr, sms)
│  ├─ crypto/              Envelope encryption, hashing, signed payloads (JWS)
│  ├─ sdk/                 @applyonce/sdk — "Apply with ApplyOnce" button + verify helper for partners (npm)
│  ├─ ui/                  Design tokens, HeroUI theme, shared composed components
│  └─ config/              eslint, tsconfig, tailwind presets
├─ docs/                   this kit
├─ docker-compose.yml      postgres + redis + minio + web + worker
├─ CLAUDE.md
└─ turbo.json
```

## 4. Core domains (bounded contexts inside the monolith)
- **identity** — users, passkeys, sessions, devices, recovery
- **profiles** — a `profile` per person (self or dependent); `facts`; `addresses`; `relations`
- **documents** — files, issuer metadata, hashes, OCR extractions → *proposed facts*
- **verification** — provider jobs, results, mismatches, expiries
- **consent** — consent records, scopes, revocations, data-principal requests
- **applications** — application, timeline events, deadlines, attached documents, partner status pushes
- **partners** — orgs, members, API keys, forms (field selections), webhooks, sandbox
- **notifications** — templates, channels, preferences, delivery log
- **audit** — append-only actor/action/target log (hash-chained)

## 5. Provider adapter layer (`packages/providers`)
```ts
interface DigiLockerProvider {
  startAuth(userId, redirect): Promise<{ url: string; state: string }>
  completeAuth(state, code): Promise<{ providerRef: string }>
  listIssuedDocs(providerRef): Promise<IssuedDoc[]>          // Aadhaar, PAN, DL, CBSE marksheets...
  fetchDoc(providerRef, uri): Promise<{ bytes: Buffer; mime: string; xml?: string }>
  fetchAadhaarXml(providerRef): Promise<AadhaarOfflineKyc>   // name, dob, gender, address, photo, last4
}
interface PanProvider     { verify(pan, name, dob): Promise<{ valid; nameMatch: number }> }
interface AbhaProvider    { link(userId): Promise<{ url }>; profile(ref): Promise<AbhaProfile> }
interface AaProvider      { createConsent(userId, purpose): Promise<{ url }>; fetchIncomeSummary(ref) }
interface EsignProvider   { sign(pdf, signer): Promise<{ signedPdf; certInfo }> }
interface OcrProvider     { extract(bytes, docType): Promise<{ fields: Record<string,string>; confidence }> }
```
Env: `PROVIDER_DIGILOCKER=mock|setu|apisetu`, same per provider. Mock returns deterministic fixtures for seeded demo users (e.g., `Aarav Sharma`, DOB 2007-03-14, CBSE 2025 marks). Sandbox = Setu/Cashfree keys. Live = API Setu once org ToS is signed. Live Aadhaar data: **store** name, DOB, gender, photo, address, last-4, XML hash, reference key; **never** the 12-digit number.

## 6. Security & privacy
- **Encryption**: per-user data key (DEK) generated at signup, wrapped by KMS master key (KEK). Sensitive fact values and documents are encrypted with the DEK (AES-256-GCM). DB search on plaintext is limited to non-sensitive columns + blind indexes (HMAC) for lookups (e.g., phone).
- **Auth**: passkeys preferred; OTP fallback with rate limits + device binding; step-up (fresh passkey/OTP ≤ 5 min) required before *any* share or export.
- **Consent invariant**: `shares.consent_id NOT NULL` + trigger validating scope ⊆ consent scope and consent not revoked/expired.
- **Partner payload**: JWS (ES256) signed by ApplyOnce, includes `consent_id`, `fields`, per-field `source/verified_at`, `profile_hash`; partner verifies signature with published JWKS. Payload TTL 10 min; partner must exchange `share_token` server-side (like OAuth code) — never trust the browser.
- **Audit**: append-only, hash-chained rows; citizen can view their own; admin views all.
- **Delegation**: `relations(guardian_profile_id, ward_profile_id, scope, valid_until, basis: 'minor'|'poa'|'consent')`; ward's own consent required once adult.
- **DPDP**: purpose per consent; retention per partner form (default 365 d, partner sets); data-principal request endpoints (export JSON/PDF, erase with legal-hold exceptions); DPO contact page; breach runbook in `docs/`.
- **Threats covered in tests**: IDOR on profile/fact IDs (all queries scoped by session profile ACL), share replay (single-use `share_token`), extension origin allow-list, webhook HMAC + idempotency keys, file type/size/AV scan on upload.

## 7. Scalability notes
- Reads dominate: vault pages via RSC + Postgres; cache profile summary in Redis (invalidate on fact write).
- Provider calls are async jobs with status rows; UI polls/subscribes via SSE `/api/events`.
- Partition `audit_log`, `notification_deliveries`, `application_events` by month once > 50 M rows.
- Stateless web; horizontal scale behind Vercel/Fly; worker autoscale on queue depth.
- Object storage keyed `users/{uid}/docs/{docid}`; signed URLs (5 min) only after ACL check.

## 8. Environments
`local` (docker-compose, mock providers, seeded demo data) · `staging` (sandbox providers) · `prod` (live). Feature flags via env + `flags` table (per-org rollouts for partner features).
