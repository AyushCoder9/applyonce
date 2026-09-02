# User flows and UI contract

## Product visual language

ApplyOnce is a trust-first civic utility, not a generic dashboard. It uses a warm, optimistic, high-clarity visual system:

- Display type: Sora.
- Product/body type: Geist.
- IDs, timestamps, receipt codes, and technical values: IBM Plex Mono.
- Core colors: Midnight Ink `#17212B`, Cloud Paper `#F7F9F7`, Civic Indigo `#4F46E5`, Form Mint `#CFF7E9`, Signal Saffron `#F8C969`, Caution Coral `#E96A58`, Sky Verification `#74C9F5`, Quiet Slate `#66727D`, Border Mist `#DCE4E2`.
- The single-source rail motif represents one verified profile moving through explicit consent to several applications.
- HeroUI supplies accessible primitives; ApplyOnce owns composition, tokens, copy, and states.

The canonical mark is in `public/applyonce-mark.svg`, with wordmark and social variants beside it. Do not force incompatible width and height values onto the SVG.

## Citizen onboarding

1. Register through Clerk.
2. Enable passkey or MFA when available.
3. Choose self, student, parent/guardian, or dependent context.
4. Complete essential profile fields with visible progress.
5. Connect an approved source or upload a document only when the citizen chooses to.
6. Browse applications and see what can be reused.

## Citizen application

1. Open a program/application.
2. See deterministic eligibility: eligible, ineligible, or needs information.
3. Start or resume a hosted session.
4. Review requested fields, documents, purpose, recipient, retention, and expiry.
5. Authenticate before sensitive source retrieval or sharing.
6. Review prefilled values, source, verification state, freshness, and editability.
7. Resolve missing, stale, or conflicting values.
8. Upload missing documents with progress and clear errors.
9. Review an immutable final snapshot.
10. See an explicit affirmation: “Share N fields and M documents with this organization?”
11. Select “Share and submit”; protect against double clicks.
12. Show success only after the backend confirms persistence.
13. Display receipt code, timestamp, status, data shared, documents shared, copy, download, and print actions.

## My Profile

The profile is a reusable data workspace, not a static student card. It covers:

- Names and identity.
- Contact details.
- Current and permanent address.
- Parent, guardian, and dependent relationships.
- Education and qualifications.
- Employment and experience.
- Household and family income.
- Category, disability, and benefit-related values where relevant.
- Typed identifiers and issuer references.
- Documents and credentials.
- Verification history and conflicts.

Every field should expose value, source, verification strength, last updated time, expiry, editability, and applications where shared. Edits autosave on blur or explicit save, persist through refresh, and never overwrite a stronger verified claim silently.

## Consent sheet

Show the partner, purpose, requested fields, requested documents, source of values, retention period, expiry, and revocation meaning. Consent is not hidden in a generic checkbox. Revocation, connector disconnect, application withdrawal, and account deletion are separate actions.

## Partner onboarding and workspace

Visiting `/partner` must not silently create an organization. A partner supplies organization details, accepts terms, verifies contact/domain where required, and waits for approval before publishing.

Approved partner flow:

1. Create a program draft.
2. Add form fields and requirements.
3. Add deterministic eligibility rules.
4. Map reusable claim keys with privacy scope.
5. Configure branding.
6. Preview the exact citizen form.
7. Publish an immutable version.
8. Share a hosted URL or integrate through API/webhooks.
9. Review submissions, request missing information, and update status.

## Hosted form behavior

The public form is mobile-first and short-lived. It is transparent about requested data and can be resumed when policy allows. A guest may start, but sign-in is required before official-source retrieval or sensitive submission. A partner receives only the declared, consented fields and documents.

## Control contract

Every visible control must have:

- A real route or backend operation.
- A keyboard focus state and accessible name.
- Loading and duplicate-click protection.
- Success and error feedback.
- A useful disabled explanation when unavailable.
- Mobile behavior and reduced-motion behavior.

Avoid labels such as “Proceed” without context, “Execute,” and “Sync entity” on citizen screens. Prefer “Review information,” “Share and submit,” “Request document,” and “Download receipt.”

## Motion rules

Use isolated `motion/react` client components only for meaningful transitions. Keep feedback understandable without motion. Under `prefers-reduced-motion`, remove large transforms and drawing animations, but preserve status and focus feedback. Never use an animation as the only explanation of a state change.
