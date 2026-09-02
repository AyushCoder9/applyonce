# WP5 — Family · Notifications · Settings & data rights · Admin · Public site (2026-09-02)

Contract: build-plan §0–§3. Ownership: `app/app/{family,notifications,settings,extension}`, `app/admin/*` (not layout), `app/(public)/*` (not layout), `api/v1/{family,notifications,me,admin}`, `components/{family,public,settings,admin}`.

## Approach (ponytail)
- Server components read DB via `@praman/db`; small `"use client"` islands mutate via `/api/v1/*` then `router.refresh()`.
- Family invite/claim links: **stateless HS256 JWT** (`jose`, already a dep) signed with `BETTER_AUTH_SECRET`, 7-day expiry, kinds `invite` | `claim`. No new table. `POST family/elder/accept {token}` handles both kinds (claim = handover at 18) so §3 paths stay exact. "Send claim link" = `PATCH family/:id {sendClaimLink:true}`.
- Elder accept: if the accepting user already has a `self` profile, the relation's `wardProfileId` is repointed to that profile and the placeholder profile is deleted; else the placeholder becomes `claimedByUserId=user`.
- Step-up: uses WP1 `components/vault/step-up-dialog.tsx` (`StepUpDialog`) before export/erase.
- Sessions: WP1's `GET auth/sessions` not present → read `t.session` in the settings server component; revoke via `DELETE api/v1/me/sessions/:id`.
- Admin API auth: `api/v1/admin/_auth.ts` (`adminApi()` → 403 unless `user.role==='admin'`). Data-request fulfil = server action (`admin/requests/actions.ts`), keeps §3 exact.
- Locale: `PATCH me {locale}` updates `user.locale`; pages read `session.user.locale` and use inline `{en,hi}` copy.
- Public landing: `motion/react` (v13, already a dep) + `useReducedMotion`; inline SVG only; stats from DB with `revalidate = 300`.
- Tests: vitest `components/family/logic.test.ts` (handover/claim dates), `components/settings/prefs.test.ts` (prefs merge); Playwright `e2e/wp5-family.spec.ts`.

## Files
See report at end of task. No new dependencies.
