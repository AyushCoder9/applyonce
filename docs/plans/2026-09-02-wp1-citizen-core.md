# WP1 — Citizen core (Home · Vault · Documents · Verify · Onboarding · APIs · SSE · step-up)

Contract: docs/plans/2026-09-02-build-plan.md §1–§3 (WP1 ownership). No new deps.

## Files
- lib: `apps/web/src/lib/{storage.ts,sse.ts,inline-jobs.ts}`, `apps/web/src/instrumentation.ts`
- API (`apps/web/src/app/api/v1/**`): auth/step-up · profiles (list, active, :id/summary, :id/facts, :id/facts/:key, …/history, :id/mismatches, …/:mid/resolve, :id/documents, …/upload-url) · documents/:id (get, complete, download-url, extractions/:eid/apply) · providers (digilocker start/callback/sync, pan/verify, abha/link, aa/consent) · verification/jobs/:id · events (SSE)
- ui pkg: `packages/ui/src/{inputs-india,fact-editor,wizard-shell,doc-upload}.tsx` (+1 export line each in index.ts)
- components: `apps/web/src/components/{vault,documents,onboarding}/**`
- pages: `apps/web/src/app/app/{page.tsx,loading.tsx,vault/**,documents/**,verify/**}`, `apps/web/src/app/welcome/**`, `apps/web/src/app/mock/**`
- tests: `apps/web/src/lib/wp1.test.ts` (coercion + SSE formatter), `apps/web/e2e/wp1-vault.spec.ts`, `apps/web/playwright.config.ts`

## Decisions
- DigiLocker OAuth state → httpOnly cookie `applyonce_dl` (10 min) holding `{state,next,profileId}`; no extra table.
- Step-up OTP verified via `auth.api.consumePhoneNumberOTP` (mock accepts 123456); passkey = client `signIn.passkey()` then POST `{method:'passkey'}`, server accepts if user has a passkey and session created < 2 min ago.
- SSE = DB polling every 1.5 s (jobs for accessible profiles + new notifications), 25 s heartbeat, closes on abort.
- `APPLYONCE_INLINE_JOBS=1` → `instrumentation.ts` registers `globalThis.__applyonceInlineJobs` running digilocker.sync / document.process / pan.verify / abha.link / aa.income in-process (fire-and-forget so SSE progress still streams). Demo fallback until WP4 worker runs.
- Mock provider docs keep `storageKey=mock/…` (no S3 write); viewer shows placeholder card.
- Bottom-sheet editors = HeroUI `Drawer placement="bottom"` on mobile, `right` on desktop.

## Verify
`pnpm --filter @applyonce/web typecheck` · `pnpm --filter @applyonce/web test` · `pnpm --filter @applyonce/web test:e2e` (dev server on 3300) · curl the endpoints with a cookie jar (see report).
