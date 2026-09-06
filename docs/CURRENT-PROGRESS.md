# Current progress and handoff

Updated 6 September 2026. Repository: AyushCoder9/test-applyonce-aks. This update continues the Praman monorepo already on main; it preserves the ApplyOnce history.

## Delivered in this audit

1. Read/indexed the source and Markdown, queried Graphify and refreshed its code graph. The architecture and dependency boundaries are documented in `PROJECT-CONTEXT.md`.
2. Corrected scoped family access, document authorization, token handling, consent validation/races, partner key/team controls and data-request handling. See the finding-by-finding table in `AUDIT-REPORT.md`.
3. Built evidence readiness with repair links, source detail, expiry checks, deterministic guidance and a constrained optional OpenAI explanation adapter.
4. Repaired BTA's integrated flow with browser-bound callback state, saved review drafts, preserved edits, server-owned identifiers, status access cookies and explicit offline mode.
5. Added working sample document previews and synthetic photo/signature fixtures. Replaced the disabled e-Sign entry with a stored, downloadable declaration receipt.
6. Exposed all citizen destinations on mobile, constrained layouts at 390/320 px, corrected public claims, added error/not-found pages and fixed production client-component boundaries. Repaired HeroUI checkbox/switch interactions across partner, admin and settings pages.
7. Added repeatable API/route audit, regression tests and native browser tests; expanded CI to run builds, local sandbox audit and browser workflows.
8. Rewrote README/runbook and supplied a 228-word, precisely staged two-minute demo script.

## Runtime/configuration

The default local stack is web 3300, BTA 3301, Postgres 5434, Redis 6380 and MinIO 9002. Root commands load `.env`. Mock providers and OTP 123456 are deliberate sandbox defaults. Optional `OPENAI_API_KEY` / `OPENAI_MODEL` enable explanation calls. `DEMO_ADMIN_ENABLED=1` exposes BTA sample status controls in production mode; `DEMO_OFFLINE=1` is required for deliberate offline fixtures.

This audit ran isolated services on 3400/3401 and a separate database, Redis index and bucket. Use `RUNBOOK.md` to reproduce that configuration. Never copy these demo secrets into a real deployment.

## Validation evidence

The final unit suite passed 106 tests across eight packages; all 11 TypeScript tasks and all three production builds passed. The production API audit passed 83/83 assertions. All 11 browser workflows passed against the final production build in 25.9 seconds. The audit report records coverage and remaining limits. `docs/audit-results.json` contains each production HTTP assertion. Native Playwright traces are retained on failures and test reports describe the actual browser runs. Source inventory captures file hashes/structure; graph output supports navigation rather than proving correctness.

## Next work requiring deployment or external validation

- Onboard and contract-test live issuer, financial and health providers; configure real SMS/email.
- Add managed key wrapping, encrypted-object policy, malware scanning, durable BTA storage and complete physical data purge/retention.
- Transfer encryption ownership for claimed adult profiles; current erasure correctly holds affected accounts.
- Evaluate live model quality and any opt-in real OCR against a versioned dataset.
- Validate unpacked extension behavior on supported real sandbox pages and complete assistive-technology/language testing.
- Run staging restore/concurrency/security tests and independent review before processing real citizen data.

These items are implementation/deployment boundaries, not hidden “coming soon” buttons. The visible demo uses working local services or clearly labeled sample alternatives.

## Where to continue

- Product/architecture: `PROJECT-CONTEXT.md`.
- What was wrong and how it was fixed: `AUDIT-REPORT.md`.
- Ordered technical investments: `INTEGRATIONS-AND-ROADMAP.md`.
- Setup and troubleshooting: `RUNBOOK.md`.
- Judging/demo presentation: `DEMO-SCRIPT.md`.
- Historical decisions: `docs/plans/` and earlier PRDs, with current docs taking precedence.
