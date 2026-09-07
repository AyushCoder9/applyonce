# Local operations and demo runbook

Updated 6 September 2026. These instructions describe implemented behavior. Production deployment requirements are listed separately; earlier planning documents are not evidence of a deployed control.

## First run

Use Node 24 LTS and pnpm 9.15.9. Copy `.env.example` to `.env`, install with `pnpm install --frozen-lockfile`, then start `docker compose up -d`. Local services are Postgres on 5434, Redis on 6380 and MinIO on 9002. Run `pnpm db:migrate`, `pnpm db:seed`, then `pnpm dev`.

Web runs on 3300, BTA on 3301 and the worker consumes the configured Redis queues. Root scripts load `.env`; package commands invoked directly need the same environment, so use `node scripts/run.mjs <command> ...`. Do not copy real secrets into source files. Docker build context excludes environment files and local application data.

## Production-mode local rehearsal

```bash
pnpm build
# Separate terminals, repository root:
node scripts/run.mjs pnpm --filter @applyonce/web start
DEMO_ADMIN_ENABLED=1 node scripts/run.mjs pnpm --filter @applyonce/demo-exam-portal start
node scripts/run.mjs pnpm --filter @applyonce/worker start
```

Keep provider values in `mock`. Production mode controls Next's build/runtime behavior; it does not turn sample providers into live verification. `DEMO_ADMIN_ENABLED=1` exposes BTA's sandbox status buttons. Normal integrated mode is `DEMO_OFFLINE=0`; enable offline fixtures only deliberately. BTA stores drafts/applications in a local `.data` directory or `DEMO_DATA_DIR`. Use one process and a persistent directory. A serverless ephemeral filesystem is unsuitable for this store.

If Next's default Turbopack build is unsuitable for the host, the verified webpack commands are:

```bash
node scripts/run.mjs pnpm --filter @applyonce/web exec next build --webpack
node scripts/run.mjs pnpm --filter @applyonce/demo-exam-portal exec next build --webpack
```

## Isolated audit ports and data

Create a separate Postgres database, Redis database index and S3 bucket. Set `DATABASE_URL`, `REDIS_URL`, `S3_BUCKET` in a private environment file. For ports 3400/3401 set `NEXT_PUBLIC_APP_URL`, `BETTER_AUTH_URL`, `APPLYONCE_API_URL` to 3400 and `NEXT_PUBLIC_DEMO_PORTAL_URL` to 3401 **before building**. Start using `next start -p 3400` and `next start -p 3401` through the environment loader. The seeded BTA webhook and redirect origins follow these values.

```bash
AUDIT_BASE_URL=http://localhost:3400 AUDIT_PORTAL_URL=http://localhost:3401 pnpm audit:workflows
PLAYWRIGHT_BASE_URL=http://localhost:3400 AUDIT_PORTAL_URL=http://localhost:3401 node scripts/run.mjs pnpm --filter @applyonce/web test:e2e --workers=1
```

The audit is local-only and mutates sample records. It creates sample uploads/applications, checks hostile requests, requests an export, and schedules then cancels erasure. Do not run it against a live citizen database. Native browser tests require `pnpm --filter @applyonce/web exec playwright install chromium` once on the host.

## Fixture maintenance

`pnpm db:seed` fills missing seed records without resetting user changes. `pnpm db:refresh-demo` updates only mock attachment bytes/hashes and missing sample photo/signature records. `db:reset` currently delegates to the package's migration/seed script; inspect that script before assuming destructive reset behavior. Use a new disposable database for an entirely clean rehearsal.

Do not use a production person's phone or data for the pitch. Aarav's phone is 9876543210 and all mock OTPs are 123456. Pre-fill missing current address and choose the sample photograph/signature before the timed pitch. Rehearse consent and BTA review in separate tabs as described in `DEMO-SCRIPT.md`.

## Troubleshooting

| Symptom | Check |
|---|---|
| Login/callback fails | App URLs, exact origin, cookie host, root environment and mock provider selection |
| Preview fails | Recent OTP, document profile/scope, ready state, ticket expiry; request a fresh URL |
| Upload remains pending | Worker process/heartbeat, Redis database, S3 bucket/CORS and processing job failure |
| BTA callback says state invalid | Restart from the BTA button in the same browser; callback states are one-use and expire after 15 minutes |
| BTA review expires | Draft lifetime is 30 minutes; create a new share |
| Status controls absent | Set `DEMO_ADMIN_ENABLED=1` for the BTA runtime; open the application's browser-bound status page |
| AI unavailable | Leave both AI settings blank for local guidance; configured failures also fall back locally |
| Wrong profile after family change | Reload; expired/revoked delegation falls back to an accessible profile |

## Production work still required

Live provider onboarding and contract tests, production SMS/email, managed key wrapping, encryption/object access policies, malware scanning, durable BTA storage, claimed-profile key transfer, physical object purge/retention, backup restoration tests, monitoring and an independent privacy/security/accessibility review. The existing environment-backed encryption and append-only audit trigger are implemented; KMS, Sentry and PITR are not provisioned by this repository. Do not represent the project as certified or legally compliant on the strength of a demo.

The worker emits a TTL heartbeat checked by `/status`; `/admin/queues` shows queue counts. Retention and erasure are not a complete production data lifecycle, particularly for exported or previously downloaded data. Review `AUDIT-REPORT.md` before deployment.
