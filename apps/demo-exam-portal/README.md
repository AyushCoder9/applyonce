# Bharat Test Agency — BTA-JEE 2026 Registration (demo exam portal)

This is `apps/demo-exam-portal` (WP3): a deliberately dated, dense, white/blue/grey
government-exam-portal look-alike, built to make the "Apply with Praman" flow feel like a
magic trick by contrast. It is a Praman **partner**, not part of Praman itself.

## Run it

```sh
set -a; . ../../.env; set +a
pnpm --filter @praman/demo-exam-portal dev   # http://localhost:3301
```

(or `cd apps/demo-exam-portal && set -a && . ../../.env && set +a && pnpm dev`)

### Env vars (from root `.env`)

| Var | Meaning |
|---|---|
| `PRAMAN_API_URL` | Praman's own app, `http://localhost:3300` — where the partner API lives |
| `BTA_PRAMAN_API_KEY` | Bearer key for `Authorization: Bearer <key>` on partner API calls |
| `BTA_PRAMAN_FORM_ID` | `bta-jee-2026` — the seeded form slug this portal requests |
| `BTA_WEBHOOK_SECRET` | HMAC secret for verifying `/api/praman/webhook` deliveries |
| `NEXT_PUBLIC_DEMO_PORTAL_URL` | This portal's own base URL, `http://localhost:3301` |
| `DEMO_OFFLINE` | Set to `1` to skip the live Praman API entirely (see below) |

### DEMO_OFFLINE mode

As of this writing WP2 (Praman's partner API — `/api/v1/partner/*`, `/api/v1/jwks`) has not
shipped yet (`apps/web/src/app/api/v1` doesn't exist and `packages/sdk/src/index.ts` is still
`export {}`). Set `DEMO_OFFLINE=1` and this portal works standalone end to end:

- **"Apply with Praman"** skips the (nonexistent) live share-session call and redirects
  straight to `/apply/return` with a synthetic `share_token`.
- **`/apply/return`** skips JWS verification and instead renders a hand-built
  `PramanPayload` fixture (`src/lib/fixtures.ts`) — Aarav Sharma's demo data
  (`packages/providers/src/fixtures.ts`'s `AARAV`) mapped onto exactly BTA's 51 requested
  registry keys (45 required + 2 of the 6 optional ones actually populated for Aarav), with
  the same green/blue/amber source badges the real flow would show. A small notice banner
  says plainly that this payload wasn't cryptographically verified.
- **Admin "push status" buttons** and the return-page submit log what they *would* have sent
  to Praman (`console.log`) instead of POSTing, and still update this portal's own status
  page/timeline.

Even with `DEMO_OFFLINE` unset, a real `fetch` connection failure (`ECONNREFUSED` etc. —
i.e. WP2 genuinely isn't running) is caught and falls back to the same offline behaviour
automatically; only non-network errors (bad auth, validation) surface as real errors. Once
WP2 ships, just leave `DEMO_OFFLINE` unset (or `0`) — no code change needed.

`src/lib/praman.ts` is a hand-written client against docs/05-API-AND-FLOWS.md §1/§3, kept
close to `@praman/sdk`'s planned shape (`createShareSession`, `exchange`, `verifyWebhook`,
`pushStatus`) so swapping to the real SDK later should be close to a drop-in replacement.
JWS verification (`src/lib/jws-verify.ts`) is hand-rolled with Web Crypto — `jose` (a
dependency of `@praman/sdk` and `@praman/crypto`) does not resolve from this package's own
`node_modules` (pnpm doesn't hoist deps this package never declared), and this package isn't
allowed to touch `package.json`/the lockfile, so ES256 compact-JWS verification is done with
`crypto.subtle` directly instead.

## The 3-minute demo script (docs/05-API-AND-FLOWS.md §4)

1. Open `http://localhost:3301` → click **Fill manually** → watch the timer run through 6
   steps × 56 fields (uppercase-forced names, DD/MM/YYYY dates, PIN/mobile pattern checks,
   photo/signature/marksheet size-and-format rejections) → judges feel the pain for ~20 s.
2. Go back → click **Apply with Praman** → (on Praman) consent screen shows verified vs.
   missing fields → fill the gaps → passkey → bounce back to `/apply/return` with everything
   filled, badged (green/blue/amber/grey) and marksheet/category-certificate attached →
   **Submit to BTA** → application number `BTA26-XXXXXXX`.
3. `/status/[ref]` shows the tracker. Admin panel → **Push: Admit card released** → status
   flips to "Admit card released" locally and (if WP2 is live) on Praman's own tracker via
   the partner status API.
4. On Praman, open Connections → see exactly what BTA received; revoke → BTA's
   `/api/praman/webhook` receives `consent.revoked`, verified via HMAC, logged at
   `/admin/webhooks`, and the matching `/status/[ref]` page shows "consent revoked".
5. Family: switch to Riya's profile on Praman, repeat step 2 as guardian — same BTA form.

## Routes

| Route | What |
|---|---|
| `GET /` | Landing: notice, dates, **Fill manually** / **Apply with Praman** |
| `GET /apply/manual` | The pain: 6-step, 56-field wizard with running timer and gov-portal validation |
| `POST /api/manual/submit` | Server-validates, hashes uploads, stores a BTA-only application, redirects to `/status/[ref]` |
| `POST /api/praman/session` | Creates a Praman share session server-side, 303-redirects to `share_url` |
| `GET /apply/return` | Exchanges `share_token`, verifies the JWS, renders the pre-filled/badged form |
| `POST /api/return/submit` | Stores the application (with `praman_application_id`/`consent_id`), immediately `pushStatus(under_review)` |
| `GET /status/[ref]` | Timeline + no-auth admin panel (push admit-card/accept/reject) |
| `POST /api/admin/push-status` | Admin panel target — pushes to Praman (if linked) + local history |
| `POST /api/praman/webhook` | HMAC-verified webhook receiver; `consent.revoked` marks the matching application |
| `GET /admin/webhooks` | Last 20 webhook deliveries (verified + rejected) |

Field-to-registry-key mapping (for the extension recipe `bta-demo`) lives in `FIELDS.md`.

## Storage

Ponytail: no DB. `src/lib/store.ts` reads/writes a single JSON file at `.data/store.json`
(created on first write) synchronously — applications + the last 20 webhook events. Delete
that file to reset the demo.

## What depends on WP2

Everything above works today with `DEMO_OFFLINE=1`. Once WP2 ships
`/api/v1/partner/share-sessions(/:id/exchange)`, `/api/v1/jwks`, and
`/api/v1/partner/applications/:id/status`:

- Unset `DEMO_OFFLINE` (or set `0`) — no code changes required, `src/lib/praman.ts` already
  calls the real endpoints first and only falls back to offline data on a connection error.
- Double-check the response envelope: this client assumes `{ok, data}` for partner endpoints
  and a bare `{keys: [...]}` for `/api/v1/jwks` (so it also works with `jose`'s
  `createRemoteJWKSet` elsewhere) — see `partnerFetch`/`fetchJwks` in `src/lib/praman.ts`.
  If WP2's actual envelope differs, that's the one place to adjust.
- The webhook event body shape is assumed to be `{type, data}` (or `{event, data}`) with
  `consent_id`/`application_id` inside `data` — see `firstString(...)` in
  `src/app/api/praman/webhook/route.ts`; adjust if WP2's actual payload differs.
