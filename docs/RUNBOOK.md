# RUNBOOK

## Environments
| env | providers | DB | notes |
|---|---|---|---|
| local | mock | docker compose | seeded demo users; OTP 123456 |
| staging | setu (sandbox) | Neon/Supabase | real DigiLocker sandbox; SMS via MSG91 test route |
| prod | setu/apisetu (live) | managed Postgres + PITR | KMS-wrapped KEK; Sentry; audit retention 7 y |

## Env matrix (see `.env.example`)
- `DATABASE_URL`, `REDIS_URL`, `S3_*` (R2/MinIO), `BETTER_AUTH_SECRET/URL`, `PRAMAN_RP_ID` (passkeys: the apex domain), `PRAMAN_KEK_HEX` (dev only — prod: load KEK from KMS at boot and keep `PRAMAN_KEK_HEX` unset), `PRAMAN_BLIND_INDEX_KEY`, `PROVIDER_*`, `SETU_*`, `MSG91_AUTH_KEY`, `RESEND_API_KEY`, `NEXT_PUBLIC_APP_URL`, `NEXT_PUBLIC_DEMO_PORTAL_URL`.

## Deploy
- **web**: Vercel (Node runtime; `proxy.ts` runs on Node). Set env; run `pnpm db:migrate` from CI before promoting.
- **worker**: Fly.io / Railway container: `pnpm --filter @praman/worker start` (needs DB, Redis, S3, KEK). Scale on queue depth (`/admin/queues`).
- **demo portal**: Vercel, env `PRAMAN_API_URL`, `BTA_PRAMAN_API_KEY` (live key from partner console), `BTA_WEBHOOK_SECRET`.
- **extension**: `pnpm --filter @praman/extension build` → zip `dist/` → Chrome Web Store; set `host_permissions` for prod domains.
- One-box alternative: `docker compose -f docker-compose.yml -f docker-compose.demo.yml up` (web + worker + portal images).

## Provider switch (mock → setu → live)
1. Get Setu sandbox keys → set `SETU_CLIENT_ID/SECRET/PRODUCT_INSTANCE_ID`, `PROVIDER_DIGILOCKER=setu`, `PROVIDER_PAN=setu`. Restart web + worker. No UI change.
2. Register as API Setu requester org (DigiLocker) → implement `apisetu` adapter in `packages/providers/src/apisetu` behind `PROVIDER_DIGILOCKER=apisetu`.
3. AA (FIU) and ABDM (HIU) need regulator/partner status — see `docs/08-INTEGRATIONS-PLAN.md`.

## Key rotation
- JWS signing key: insert a new `system_keys` row (kind `jws_es256`, active=true), keep the old row active for 24 h so partners' JWKS caches refresh, then set old `active=false`.
- KEK: re-wrap every `user_keys.dek_wrapped` in a migration job (unwrap with old, wrap with new); DEKs never change, so no data rewrite.

## Backups & retention
Nightly PITR; `audit_log` append-only (trigger); consents retained per partner `retention_days`; erase requests honour a 30-day grace + legal holds (`data.erase` job).

## Breach runbook (DPDP Rules 2025)
1. Contain: revoke affected partner keys (`partner_api_keys.revoked_at`), rotate KEK/JWS key, invalidate sessions (`DELETE FROM session`).
2. Assess: query `audit_log` + `shares` for the window; list data principals affected.
3. Notify the Data Protection Board and affected users **without delay**; follow with the detailed report within **72 hours** (Rules 2025 timeline). Templates in `docs/legal/` (TODO).
4. Post-mortem in `docs/incidents/<date>.md`.

## Observability
pino JSON logs (web + worker) → your log sink; Sentry DSN via `SENTRY_DSN` (wire `@sentry/nextjs` + `instrumentation-client.ts` when the DSN exists); `/status` page pings DB + Redis; `/admin/queues` shows BullMQ counts.

## Common ops
- Re-seed demo: `pnpm db:reset`.
- Stuck job: `/admin/queues` → or `pnpm --filter @praman/worker exec tsx -e "..."` to retry; failed jobs keep 24 h.
- Partner can't verify JWS: check `GET /api/v1/jwks` returns the active key; payload TTL is 10 min — partners must exchange promptly.
