# ApplyOnce

Your details. Once. Anywhere.

ApplyOnce is a citizen-controlled application wallet for the repetitive part of public and private applications. A person keeps verified profile claims ready, reviews exactly what a receiving portal needs, gives purpose-bound consent, and receives a durable receipt.

## Hackathon demo

- Live reviewer path: [applyonce-silk.vercel.app/demo](https://applyonce-silk.vercel.app/demo)
- Public landing page: [applyonce-silk.vercel.app](https://applyonce-silk.vercel.app)
- No login is required.
- All names, records, IDs, dates, and application results are synthetic demo data.

The fastest walkthrough is:

1. Open the demo and choose **Open exam portal**.
2. Tick the consent checkbox and choose **Continue with ApplyOnce**.
3. Confirm the one flagged income-certificate field.
4. Choose **Submit application** to see the receipt and consent trail.

## What is implemented

- Public product landing page explaining the citizen problem and solution.
- Student dashboard with profile readiness, connected sources, applications, and activity.
- Mock external exam portal with a field requirement contract.
- Consent-first packet review for MeriPehchaan, DigiLocker, and APAAR-style sources.
- Source-aware prefilled application review with a deliberate mismatch resolution step.
- Receipt generation screen with application ID, timestamp, next update, and consent trail.
- Responsive layout for desktop and small screens, visible keyboard focus, and reduced-motion support.
- Clerk-backed account boundary for the authenticated workspace at `/app`.
- Neon Postgres schema and migrations for profiles, source connections, claims, documents, packets, field-level readiness, consents, events, and notifications.
- Deterministic readiness engine that maps verified claims to portal requirements and separates prefilled values from citizen decisions.
- Private Vercel Blob upload, download, and deletion routes for documents; uploads are limited to PDF/JPEG/PNG and 10 MB.
- Public operational endpoints for health, templates, integration status, and the synthetic demo snapshot.

## Local development

```bash
npm install
npm run dev
```

Then open [http://localhost:3000](http://localhost:3000) or [http://localhost:3000/demo](http://localhost:3000/demo).

After pulling Vercel development variables, initialize the local/provisioned database with:

```bash
npm run db:migrate
npm run db:seed
```

## Production build

```bash
npm run lint
npm run typecheck
npm test
npm run build
```

## Product direction after the submission

The public demo uses synthetic data. DigiLocker, MeriPehchaan, and APAAR are represented as consent-gated connector contracts; production access still requires each provider's official partner approval and credentials. Resend is intentionally disabled until a verified sending domain is supplied. In-app notifications work through the database outbox today, while email can be enabled without changing the application workflow once that domain is available.
