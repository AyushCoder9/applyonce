# Validation notes

The audit runs in an isolated Git worktree, database, Redis database, object bucket and two web-server ports. The existing checkout is not used as a test target. A mistaken first seed attempt briefly created one empty duplicate fixture profile in the original local database; that exact empty row was identified by ID and creation time and removed. Subsequent migrations, fixtures and tests use the isolated database.

Baseline: all 11 typecheck tasks passed. The initial concurrent unit run hit a five-second signing-test timeout while the workstation was under load. A rerun with two concurrent package tasks passed all eight existing test tasks. The signing test now uses a bounded 30-second timeout.

Graphify: queried the original project graph, traced the consent/auth/facts hubs, then ran a local AST refresh across the changed source. Markdown files are inventoried separately. Graphify reported a missing optional SQL parser; the SQL migrations were inspected as text. No semantic-LLM document extraction is claimed.

Ponytail: used the installed skill's workflow and reused the existing SDK, Drizzle, schema registry, crypto, object store and UI components. No additional production package was introduced. The project now has an explicit environment loader so root workspace commands receive the same configuration.

Development browser checks validated readiness, source chips, fact edits, masked-value reveal and the consent POST. Cold route compilation on this workstation made the long browser run slow, so it was interrupted and the final audit is run against a production build. Interrupted runs are not counted as completed passes.

The final evidence is recorded in `../AUDIT-REPORT.md`, `../audit-results.json` and the test logs summarized there. Source inventory is not a claim that every possible input, hardware authenticator, external portal or production integration was tested.

## Production validation progression

- Next webpack production build initially exposed server imports of client-only HeroUI exports. Fixed the pattern across app pages, the link button and shared UI components, then built successfully.
- The first production route/API audit passed 83/83 checks against real local Postgres, Redis, worker and MinIO services.
- The first complete production browser run passed 7/8 tests. The failing narrow viewport check revealed header overflow; the compact header was corrected and the regression expanded to 390 and 320 px.
- The manual six-step BTA workflow was separately exercised successfully.
- A database hook timed out on an earlier concurrently loaded run. After setting an explicit 30-second database hook budget and running suites sequentially, all 105 unit/integration tests passed. Failed/interrupted attempts were not counted as successful runs.
- Production build and browser testing are repeated after the final UI and consent-exchange corrections; see the final report for the measured outcome.

- Expanded partner/admin browser cases exposed missing `Checkbox.Content` / `Switch.Content` wrappers in the installed HeroUI version. The components looked interactive but lacked a clickable control. Corrected every affected instance, including notification preferences and re-verification selection.
- A second mobile inspection found the document grid's implicit minimum width overflowing after the header fix. Explicit single-column minmax tracks now constrain the cards.
- Added a database concurrent-write regression and row-locked transactional fact updates. Six database tests pass, bringing the suite total to 106.

- After repairing HeroUI anatomy, browser selectors were changed from visually hidden inputs to the visible clickable content, with checked-state assertions. The admin persistence test now waits for the server success notice before reloading; the focused test passes.
- The production dependency advisory was resolved with a targeted transitive esbuild override. Drizzle checks pass, the registry scan reports zero known production advisories, and all 106 tests passed after the lockfile update.
- The final production API audit passed 83/83 checks on the current implementation.
- Final root `pnpm build` passed all three production applications (web, BTA and extension) after the dependency override. All tasks executed without build-cache hits.
- The final native Chromium run passed all 11 workflows in 25.9 seconds against the rebuilt applications. These are the final browser results; no failed attempt is included in that total.
