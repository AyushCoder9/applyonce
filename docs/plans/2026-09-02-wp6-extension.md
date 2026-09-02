# WP6 — Chrome MV3 autofill extension (2026-09-02)

Scope: `apps/extension/**`, `apps/web/src/app/api/v1/extension/**`, `apps/web/src/app/app/extension/connect/**`. No deps installed (already wired). No migrations (reuse `session` table).

## Web endpoints (`apps/web/src/app/api/v1/extension`)
- `_auth.ts` — `extensionUser(req)`: reads `Authorization: Bearer`, looks up `t.session` by `token`, rejects if missing/expired, resolves user + profile (query `?profile=` or self via `listProfiles`).
- `token/route.ts` — `POST`, `citizen()` session required, inserts a `session` row (`id/token = randomToken`, `userAgent:'praman-extension'`, `expiresAt +30d`), returns `{token, expiresAt, user, profiles}`.
- `fill-plan/route.ts` — `GET`, Bearer. `?recipe&profile&keys=a,b,c&stepUp=`. Decrypts via `getDek`+`getFacts`. sensitive keys need `stepUp === MOCK_OTP` (mock mode) else omitted → `missing`. `labels` via `@praman/ui` `fmtValue`.
- `documents/route.ts` — `GET`, Bearer, lists `{id,title,docType,mime}` for profile.
- `documents/[id]/url/route.ts` — `GET`, Bearer, presigned S3 URL, or `mock.pdf` route URL for `mock/` storage keys.
- `documents/[id]/mock.pdf/route.ts` — `GET`, Bearer (or token in query since `<a href>` can't set headers — use `?token=`), streams a tiny generated PDF with the doc title.
- `applications/route.ts` — `POST`, Bearer, inserts `applications(source='extension')` + `application_events`.
- `apps/web/src/app/app/extension/connect/page.tsx` + client component — mint token, `postMessage` handshake, copy fallback, `PRAMAN_EXT_CONNECTED` listener.

## Extension (`apps/extension`)
- `manifest.config.ts` (`defineManifest`) + `vite.config.ts` (`crx` + react + tailwind).
- `src/background.ts` — token storage (`chrome.storage.local`), fetch proxy w/ Bearer, message router.
- `src/content/handshake.ts` — listens `PRAMAN_EXT_TOKEN` on app origin, forwards to background, replies `PRAMAN_EXT_CONNECTED`.
- `src/content/fill.ts` — recipe match + DOM fill orchestration, banner UI, highlight sweep (40ms stagger, 900ms fade per `docs/04` motion tokens), ghost "from X" label, ref capture.
- `src/recipes/{bta-demo,nta-jee,nsp,generic}.json` + `index.ts` (pure `matchRecipe`, `resolveFields`).
- `src/lib/{transforms,select-match}.ts` — pure functions, unit tested.
- `src/popup/*` — React popup: connected state, recipe status, fill button + step-up OTP prompt, attach-from-Praman list, disconnect.
- `src/styles.css` — copied `@theme` tokens from `apps/web/src/app/globals.css` (no cross-app import).
- `test/*.test.ts` — vitest, pure functions only (transforms, matchRecipe, generic label mapping, select-match).
- `README.md` — load unpacked, connect flow, add-a-recipe.

## Verify
- `pnpm --filter @praman/extension test` (vitest, pure fns).
- `pnpm --filter @praman/extension typecheck` + `build` → `dist/manifest.json` valid.
- curl the extension API routes against the running dev server (Aarav 9876543210/123456) with a cookie jar for `POST token`, then Bearer for the rest.
- Manual browser load-unpacked check is out of scope for this pass (documented as unverified in the report) unless time permits.
