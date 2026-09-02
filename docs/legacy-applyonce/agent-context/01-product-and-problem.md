# Product, problem, and scope

## Problem

People repeatedly type the same identity, contact, address, family, education, income, category, certificate, and document information into applications. This is especially painful for school and college admissions, government and private examinations, scholarships, coaching, certifications, recruitment, and public-service forms. Repetition creates errors, incomplete submissions, lost documents, and uncertainty about what an institution received.

Organizations face the inverse problem: each institution rebuilds similar forms, checks incomplete data manually, follows up for missing documents, and has no consistent, consent-aware way to receive reusable information.

Existing discovery or service aggregation portals are useful reference points, but they do not by themselves solve universal, provenance-aware reuse across private and government application destinations. ApplyOnce is not a claim to replace those portals.

## Product promise

> Enter, verify, and control your information once. Reuse it safely wherever an application needs it.

The promise has four parts:

1. Reusable: a citizen can keep structured claims and documents instead of retyping them.
2. Verifiable: each claim exposes source, freshness, and verification strength.
3. Controlled: a citizen sees the recipient, purpose, requested fields, documents, duration, and expiry before sharing.
4. Traceable: an application produces a receipt and a status timeline after the system persists it.

## First launch audience

- Students and parents applying to schools, colleges, exams, scholarships, coaching programs, and certifications.
- Private institutions and education organizations that need a hosted application form, submission inbox, and document follow-up workflow.
- Approved integration partners that want APIs and signed webhooks.

## Broader domain packs

The core model is domain-neutral. Domain packs provide vocabulary, claim keys, document types, eligibility operators, and retention defaults.

- Education: admissions, examinations, scholarships, financial aid, coaching, certifications.
- Public services: schemes, benefits, certificates, licences, pensions, grievances.
- Employment: internships, private jobs, recruitment, apprenticeships.
- Household: parent/guardian, dependents, family income, address and relationship data.
- Healthcare administration: appointments, benefits, insurance pre-authorisation and non-clinical forms; not clinical records in the first release.
- Financial aid and insurance: application data only; partner systems retain regulated underwriting and payment decisions.

## Three delivery rails

1. ApplyOnce-hosted forms for organizations without a form platform.
2. REST APIs, SDKs, and HMAC-signed webhooks for integrated partners.
3. Citizen-controlled browser and mobile autofill clients for destinations that have not integrated. These clients preview mappings and fill selected fields, but the citizen completes OTP, CAPTCHA, file selection, payment, and final submission.

## What ApplyOnce does not do

- It does not scrape protected portals.
- It does not bypass CAPTCHA, OTP, access controls, or private APIs.
- It does not silently submit to an unintegrated website.
- It cannot programmatically choose a user’s local file for a website file input.
- It does not store passwords, payment credentials, raw face/fingerprint/iris templates, or full Aadhaar numbers by default.
- It does not claim government endorsement or live government connectivity without approved credentials and a verified end-to-end flow.
- It is not called a statutory DPDP Consent Manager unless that legal status is formally established.

## Hackathon story and production story

The focused story is a student who has to repeat a complete profile across education applications. The product demonstration can be narrow and synthetic while the underlying platform remains ready for additional domain packs. This keeps the reviewer journey understandable without pretending that every government service is already integrated.

## Success measures

Citizen:

- Less repeated typing for supported applications.
- Fewer missing or stale fields at review.
- Clear consent and sharing history.
- Fast recovery from a saved draft or lost session.

Partner:

- Faster form setup and version publishing.
- Fewer incomplete submissions.
- Clear missing-document workflow.
- A reliable inbox and webhook/API contract.

Platform:

- No cross-citizen or cross-organization data exposure.
- No duplicate application on a retry.
- Auditable immutable snapshot and consent receipt.
- Honest provider states and operational visibility.
