# WP2 plan — consent & share · partner API · console · SDK · tracker · connections (2026-09-02)

Contract: `docs/plans/2026-09-02-build-plan.md` §2 WP2, §3 Share/Applications/Partner. No new deps.

## Files
- `apps/web/src/lib/signing.ts` — `getSigningKey()` (system_keys kind `jws_es256`, private JWK encrypted with `systemDek()`), `signSharePayload()`, `publicJwks()`.
- `apps/web/src/lib/share.ts` — pure `buildDiff(facts, form)`, `diffSummary(rows)`, `withQuery(url, params)`, `shareToken()` (= `<sessionId>.<random>` so the SDK can derive the session id), plus `loadShareSession(token)`.
- `apps/web/src/lib/webhooks.ts` — `dispatchWebhook(partnerId, event, payload, tx)` (rows in `webhook_deliveries` + `enqueue("webhook.deliver")`), `pushApplicationStatus()`, `createVerificationRequest()` — shared by the Bearer API and the console.
- API: `api/v1/{jwks, partner/jwks, partner/share-sessions, partner/share-sessions/[id]/exchange, partner/applications/[id]/status, partner/verification-requests, partner/forms, partner/webhooks/test, share/[token], share/[token]/consent, consents, consents/[id]/revoke, applications, applications/[id], applications/[id]/events, applications/[id]/documents}/route.ts`.
- Share flow: `app/share/layout.tsx` (bare), `app/share/[token]/page.tsx`, `components/share/share-flow.tsx`, `components/share/step-up-fallback.tsx` (swap for `@/components/vault/step-up-dialog` when WP1 lands).
- Citizen: `app/app/apply/page.tsx`, `app/app/apply/[formSlug]/page.tsx` (creates a citizen-initiated share session → `/share/<token>`), `app/app/applications/{page,[id]/page}.tsx`, `components/applications/*.tsx`, `app/app/connections/{page,[consentId]/page}.tsx`.
- Partner console: `app/partner/{page,onboarding,forms,forms/new,forms/[id],applicants,developers,team,settings}/page.tsx`; mutations via server actions in `components/partner/actions.ts` (console-only mutations have no path in §3, so server actions keep the API surface exact); `components/partner/session.ts` `requirePartnerMember()`.
- `packages/ui/src/{consent-sheet,data-table}.tsx` (+1 export line each). DataTable is HeroUI Table + built-in sort/filter/CSV: `@tanstack/react-table` is not resolvable from `packages/ui` (only installed under `apps/web`) and deps are frozen.
- `packages/sdk/src/{index,browser}.ts`, `README.md`, `test/sdk.test.ts`.
- Tests: `apps/web/src/lib/{share,signing}.test.ts`; `apps/web/e2e/wp2-share.spec.ts`; `apps/web/playwright.config.ts` (absent → create).

## Decisions
- Share token = `${shareSessionId}.${random}`; DB stores only `sha256(token)`. SDK `exchange(token)` derives the session id.
- Step-up: `POST /api/v1/auth/step-up` is WP1's; a temporary OTP-only version is created only if the file is absent.
- Deny on the consent screen returns to `return_url?applyonce_error=denied&state=` (no DB write).
- `partner/layout.tsx` renders `children` when the user has no organisation (else `/partner/onboarding` is unreachable); pages call `requirePartnerMember()` which redirects to onboarding. One-line foundation fix, flagged in the report.
