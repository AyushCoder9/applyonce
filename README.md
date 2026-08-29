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

## Local development

```bash
npm install
npm run dev
```

Then open [http://localhost:3000](http://localhost:3000) or [http://localhost:3000/demo](http://localhost:3000/demo).

## Production build

```bash
npm run lint
npm run build
```

## Product direction after the submission

The prototype intentionally stops at a safe, synthetic boundary. The next layer is a modular monolith with a real consent ledger, encrypted claims, source adapters, a signed packet exchange, application status webhooks, and a partner SDK. Government or private integrations would be enabled only through their official consent and API onboarding flows; no credentials or real citizen documents belong in this demo.
