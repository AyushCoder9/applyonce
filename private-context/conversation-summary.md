# ApplyOnce conversation and request chronology

This is a faithful implementation handoff summary of the owner’s requests available in the working context. It is intentionally not presented as a raw transcript export.

## 1. Explore real public-service problems

The owner first asked whether India has a useful website for food-related complaints and wanted major user-level issues to build around. They then explored a broader direction: government schemes are distributed across different sites, eligibility must be checked separately, and application details/documents are repeatedly entered.

## 2. Government scheme discovery direction

The owner asked whether there is a government platform where schemes eligible for a citizen are listed in one place, with application in the same app, documents prefilled through DigiLocker or similar sources, receipts, and progress tracking. The exploration identified myScheme and UMANG as close reference products, while noting the gap around universal reuse across government and private application destinations.

## 3. Broader public-service opportunity search

The owner asked for many other portals and public-service problems, including real user-level friction across government and public websites, so that a more useful product could be built. The direction expanded beyond schemes to admission, certification, grievance, licence, benefits, examination, and other repeated application journeys.

## 4. Universal citizen profile idea

The owner described a personal JEE-era problem: every college or exam application required retyping name, phone, parent details, family income, address, category, Aadhaar/PAN-related fields, certificates, 10th/12th marks, and many other values. The desired solution was a single profile and verification layer where information is entered once, verified through safe government or approved sources, and reused with one-tap consent.

The owner explicitly wanted this to cover:

- Government examinations at all levels.
- Private college applications and private examinations.
- School, college, job, scholarship, coaching, certification, and public-service forms.
- Parents, children, dependents, and all age groups.
- Documents, receipts, status, admissions, and later updates.
- DigiLocker or other approved connectors, but not unsafe or unofficial access.

## 5. Product planning request

The owner requested a complete product plan: ideation, PRD, feature list, user flows, technical implementation, frontend, backend, database, integrations, security, UI system, animations, best component library, page list, form runtime, and a realistic end-to-end product. The design direction became a vibrant but trustworthy civic product with a reusable profile, provenance, consent, receipts, partner forms, and a strong citizen journey.

## 6. Hackathon submission work

The owner asked for the frontend to be implemented, deployed publicly on Vercel, connected to the GitHub identity `AyushCoder9`, and for submission details, a two-minute demo script, and project summary. The build brief required a real problem, working citizen journey, synthetic data, clear limitations, public browser access, a two-minute video, and a summary under 250 words.

The product name was fixed as ApplyOnce. The canonical story became a student reusing a verified profile for an education application. Public demo data was kept synthetic and no official-government endorsement was claimed.

## 7. Product hardening requests

The owner asked for:

- My Profile to be fixed and made persistent.
- Submit Application to be clickable and show a clear affirmation.
- Every sidebar subpage and every visible button to work.
- Logo and UI inconsistencies to be corrected.
- The product to be treated as a real product rather than a static prototype.

This led to route-addressable citizen pages, persisted profile updates, explicit consent/submit confirmation, immutable snapshots, receipts, partner routes, workflow retries, connector states, and interaction audits.

## 8. Top-250 product direction

After selection into the top 250, the owner asked for a thorough mass-scale product plan. The final direction introduced three rails:

1. ApplyOnce-hosted forms.
2. Partner REST APIs, SDKs, and signed webhooks.
3. Citizen-controlled browser/mobile autofill for sites that have not integrated.

The plan expanded roles to citizens, parents/guardians, delegates, partner owners/admins/builders/reviewers/developers/auditors, and platform operators. It expanded the domain model to education, public services, employment, household, healthcare administration, and financial aid/insurance application data.

## 9. Locked safety decisions

The owner’s intended product must not:

- Scrape protected government portals.
- Bypass CAPTCHA, OTP, access controls, or private APIs.
- Auto-submit to unintegrated portals.
- Store raw biometric templates, passwords, payment credentials, or full Aadhaar numbers by default.
- Claim that an internal ApplyOnce receipt is an external government receipt.
- Claim that DigiLocker, MeriPehchaan, APAAR, eSign, or another provider is live without approval, credentials, and a verified end-to-end request.

## 10. Current request

The owner asked for a full structured context set for another AI agent and a second private repository named approximately `test-applyonce-aks`, owned by `AyushCoder9`, containing the whole codebase plus the progress, idea, decisions, and conversation context. This private folder is the response to that request.
