# @applyonce/sdk

"Apply with ApplyOnce" in three steps. Your server holds the API key; the browser only opens a `share_url`.

## Browser button

```html
<script src="https://cdn.applyonce.in/sdk.js"></script>
<button data-applyonce-form="bta-jee-2026">Apply with ApplyOnce</button>
<script>ApplyOnce.init({ createSession: "/api/applyonce/session" })</script>
```

`ApplyOnce.init` POSTs `{ form, state }` to your `createSession` endpoint and opens the `share_url` it returns (`mode: "popup"` to keep your page; `onComplete` receives `{ share_token, state }`).

## Server (Node 20+)

```ts
import { createApplyOnce } from "@applyonce/sdk";
const applyonce = createApplyOnce({ apiKey: process.env.APPLYONCE_API_KEY!, baseUrl: "https://applyonce.in", webhookSecret: process.env.APPLYONCE_WEBHOOK_SECRET });

// 1. your /api/applyonce/session route
const { share_url } = await applyonce.createShareSession({ formSlug: "bta-jee-2026", returnUrl: "https://bta.example/apply/return", state: cartId });

// 2. your return page (?share_token=…&state=…) — single use, 10-minute window
const { payload, consent_id, application_id } = await applyonce.exchange(shareToken); // verified ES256 JWS against /api/v1/jwks
payload.facts.forEach((f) => console.log(f.key, f.value, f.source, f.verifiedBy));   // e.g. education.class12.percentage 92.4 issuer_verified cbse

// 3. tell the citizen where things stand (shows in their ApplyOnce tracker + notifies them)
await applyonce.pushStatus(application_id, { status: "under_review", externalRef: "BTA-2026-001742", note: "Admit card by 12 Oct" });
```

## Webhooks

ApplyOnce signs every delivery: `X-ApplyOnce-Timestamp` (unix seconds) and `X-ApplyOnce-Signature: v1=<hex hmac-sha256(secret, "<ts>.<raw body>")>`. Deliveries are retried 5× with exponential backoff; treat them as at-least-once (dedupe on `application_id` + `event`).

```ts
export async function POST(req: Request) {
  const raw = await req.text();
  const evt = applyonce.verifyWebhook(raw, req.headers); // throws ApplyOnceError(401) on a bad signature
  switch (evt.event) {
    case "share.completed":   /* { application_id, consent_id, share_session_id, state } */ break;
    case "consent.revoked":   /* stop using the data: { consent_id, application_ids } */ break;
    case "application.withdrawn": break;
    case "verification.updated": break;
    case "test.ping": break;
  }
  return new Response("ok");
}
```

## Payload (`ApplyOncePayload`, from `@applyonce/schema`)

`iss: "applyonce"`, `sub` (stable pseudonymous id per profile+partner), `aud` (your partner id), `jti` (share id), `consent_id`, `application_id`, `form_id`, `form_version`, `purpose`, `profile { kind, display_name, guardian_acting? }`, `facts[] { key, value, source, verifiedBy, verifiedAt, evidence { documentId, sha256, title } }`, `custom` (answers to your questions), `profile_hash`.

Sources: `issuer_verified` (DigiLocker/CBSE/UIDAI…), `provider_verified` (PAN/ABHA/OTP), `document_extracted` (OCR, citizen-reviewed), `self_declared`. Show the source next to each value — ApplyOnce does.

## Errors

`ApplyOnceError { status, code, message, fields? }` — `FORM_NOT_FOUND`, `SHARE_TOKEN_USED` (409, replay), `SHARE_TOKEN_EXPIRED` (410), `CONSENT_REVOKED` (409), `FIELDS_BLOCKED_FOR_PURPOSE` (422, lists keys), `WEBHOOK_SIGNATURE_INVALID` (401).
