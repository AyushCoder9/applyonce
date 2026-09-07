# Bharat Test Agency — BTA-JEE 2026 Registration (demo exam portal)

This is `apps/demo-exam-portal` (WP3): a deliberately dated, dense, white/blue/grey
government-exam-portal look-alike, built to make the "Apply with ApplyOnce" flow feel like a
magic trick by contrast. It is an ApplyOnce **partner**, not part of ApplyOnce itself.

Public sandbox: [applyonce-bta-demo.vercel.app](https://applyonce-bta-demo.vercel.app)

## Run it

```sh
set -a; . ../../.env; set +a
pnpm --filter @applyonce/demo-exam-portal dev   # http://localhost:3301
```

(or `cd apps/demo-exam-portal && set -a && . ../../.env && set +a && pnpm dev`)

### Env vars (from root `.env`)

| Var | Meaning |
|---|---|
| `APPLYONCE_API_URL` | ApplyOnce's own app, `http://localhost:3300` — where the partner API lives |
| `BTA_APPLYONCE_API_KEY` | Bearer key for `Authorization: Bearer <key>` on partner API calls |
| `BTA_APPLYONCE_FORM_ID` | `bta-jee-2026` — the seeded form slug this portal requests |
| `BTA_WEBHOOK_SECRET` | HMAC secret for verifying `/api/applyonce/webhook` deliveries |
| `NEXT_PUBLIC_DEMO_PORTAL_URL` | This portal's own base URL, `http://localhost:3301` |
| `REDIS_URL` | Authenticated TLS Redis connection for review sessions, applications, status history and webhook logs |
| `DEMO_OFFLINE` | Set to `1` to skip the live ApplyOnce API entirely (see below) |

### DEMO_OFFLINE mode

The deployed portal uses ApplyOnce's live sandbox partner API. `DEMO_OFFLINE=1` is retained
only for isolated UI development when the main application is intentionally unavailable:

- **"Apply with ApplyOnce"** skips the (nonexistent) live share-session call and redirects
  straight to `/apply/return` with a synthetic `share_token`.
- **`/apply/return`** skips JWS verification and instead renders a hand-built
  `ApplyOncePayload` fixture (`src/lib/fixtures.ts`) — Aarav Sharma's demo data
  (`packages/providers/src/fixtures.ts`'s `AARAV`) mapped onto exactly BTA's 51 requested
  registry keys (45 required + 2 of the 6 optional ones actually populated for Aarav), with
  the same green/blue/amber source badges the real flow would show. A small notice banner
  says plainly that this payload wasn't cryptographically verified.
- **Admin "push status" buttons** and the return-page submit log what they *would* have sent
  to ApplyOnce (`console.log`) instead of POSTing, and still update this portal's own status
  page/timeline.

With offline mode disabled, network, authentication and validation failures are shown as real
errors; the portal never silently replaces a failed integration with fixture data. The server
uses `@applyonce/sdk` for session creation, one-time exchange, ES256/JWKS verification and
partner status updates.

## The 3-minute demo script (docs/05-API-AND-FLOWS.md §4)

1. Open `https://applyonce-bta-demo.vercel.app` (or `http://localhost:3301`) → click **Fill manually** → watch the timer run through 6
   steps × 56 fields (uppercase-forced names, DD/MM/YYYY dates, PIN/mobile pattern checks,
   photo/signature/marksheet size-and-format rejections) → judges feel the pain for ~20 s.
2. Go back → click **Apply with ApplyOnce** → (on ApplyOnce) consent screen shows verified vs.
   missing fields → fill the gaps → passkey → bounce back to `/apply/return` with everything
   filled, badged (green/blue/amber/grey) and marksheet/category-certificate attached →
   **Submit to BTA** → application number `BTA26-XXXXXXX`.
3. `/status/[ref]` shows the tracker. Admin panel → **Push: Admit card released** → status
   flips to "Admit card released" locally and (if WP2 is live) on ApplyOnce's own tracker via
   the partner status API.
4. On ApplyOnce, open Connections → see exactly what BTA received; revoke → BTA's
   `/api/applyonce/webhook` receives `consent.revoked`, verified via HMAC, logged at
   `/admin/webhooks`, and the matching `/status/[ref]` page shows "consent revoked".
5. Family: switch to Riya's profile on ApplyOnce, repeat step 2 as guardian — same BTA form.

## Routes

| Route | What |
|---|---|
| `GET /` | Landing: notice, dates, **Fill manually** / **Apply with ApplyOnce** |
| `GET /apply/manual` | The pain: 6-step, 56-field wizard with running timer and gov-portal validation |
| `POST /api/manual/submit` | Server-validates, hashes uploads, stores a BTA-only application, redirects to `/status/[ref]` |
| `POST /api/applyonce/session` | Creates a ApplyOnce share session server-side, 303-redirects to `share_url` |
| `GET /apply/return` | Exchanges `share_token`, verifies the JWS, renders the pre-filled/badged form |
| `POST /api/return/submit` | Stores the application (with `applyonce_application_id`/`consent_id`), immediately `pushStatus(under_review)` |
| `GET /status/[ref]` | Timeline + no-auth admin panel (push admit-card/accept/reject) |
| `POST /api/admin/push-status` | Admin panel target — pushes to ApplyOnce (if linked) + local history |
| `POST /api/applyonce/webhook` | HMAC-verified webhook receiver; `consent.revoked` marks the matching application |
| `GET /admin/webhooks` | Last 20 webhook deliveries (verified + rejected) |

Field-to-registry-key mapping (for the extension recipe `bta-demo`) lives in `FIELDS.md`.

## Storage and deployment

`src/lib/store.ts` uses the existing authenticated Redis integration. Temporary state is
namespaced under `applyonce:demo-portal:*`; callback states expire after 15 minutes, review
drafts after 30 minutes, webhook records after 30 days and synthetic application records after
90 days. A shared, lazily connected client is reused by each warm function instance.

The root `vercel.ts` selects this workspace when the Vercel project has
`APPLYONCE_DEPLOY_TARGET=portal`; the primary `applyonce` project continues to build `apps/web`.
