# Full audit and demo completion — 2026-09-06

## Scope and approach
Audit the tracked source and documentation of Praman, using the existing Graphify graph for navigation and Ponytail for focused fixes. Work on an isolated branch from main. Preserve the canonical schema, provenance, encryption, purpose-scoped consent and existing HeroUI design language.

## Execution plan
1. Inventory every tracked file, page, endpoint, visible action and integration. Read the implementation and distinguish old design intent from actual behavior.
2. Establish isolated local Postgres, Redis and S3 demo services; install dependencies; capture baseline unit, type, build and browser results.
3. Trace citizen onboarding, vault, providers, documents, family, consent, applications, settings, extension; trace partner and admin portals and the standalone BTA application loop.
4. Repair reproducible defects at shared boundaries, complete error/empty/loading states and replace unavailable integrations with explicit, usable sandbox behavior.
5. Build a distinctive evidence-grounded application readiness experience, using canonical requested fields, provenance, expiries and conflicts. Add optional AI assistance only where it improves the task, with explicit provider status and no fabricated verification.
6. Run regression checks, exercise desktop/mobile workflows, inspect screenshots and document remaining external prerequisites honestly.
7. Update README; write audit evidence, project context, current progress, integration matrix and a timed two-minute page-by-page demo script. Refresh Graphify and push to the same repository.

## Validation
Existing Vitest suites, TypeScript checks, production builds, Playwright workflow coverage and direct API security/negative-path checks against disposable demo data. Each finding records evidence, impact, resolution and regression coverage. No production personal data or live provider calls in tests.

## Dependencies
Reuse existing libraries and platform APIs. Any new dependency needs a concrete justification recorded here before installation.

## Delivery
Push the completed branch and advance main with a normal fast-forward only if the remote has not changed; never force-push. Keep credentials and private-context out of commits. Deliver documentation copies under the task outputs directory.
