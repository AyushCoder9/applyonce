# Graphify audit context — 6 September 2026

The refreshed graph has **2436 nodes and 7214 edges**. It was extracted from the audited working tree based on commit `bd3dc84218110d04fd917e6ad363d75c560b3bbb` using `graphify extract . --code-only --max-workers 2 --no-cluster`.

## Navigation findings

- `packages/db/src/schema/core.ts` and the canonical field registry define the shared domain.
- `packages/db/src/facts.ts` owns provenance-aware writes and encrypted sensitive values.
- `packages/db/src/access.ts` resolves the current self/guardian scope.
- `packages/schema/src/readiness.ts` is the deterministic evidence check.
- Share/consent routes connect the vault, crypto, SDK, worker and partner callbacks.
- BTA state/drafts and the SDK exchange form the critical return/submission path.
- `readiness-advice.ts` is the optional explanatory AI boundary.

Queries were used to follow readiness, consent, scope, exchange and application dependencies. This is a code navigation artifact, not a test report.

## Coverage boundaries

The incremental scan saw 396 code files (12 changed and 384 unchanged). It skipped 67 non-code files for LLM extraction and did not cluster this graph. Markdown was read/indexed separately in `docs/source-inventory.json`. Two SQL files require the optional `tree_sitter_sql` dependency for AST extraction; their migration/trigger text was reviewed directly and the database invariants were executed in tests.

Machine-local paths and parser timestamps are navigation metadata. Current architecture and measured validation are in `docs/PROJECT-CONTEXT.md` and `docs/AUDIT-REPORT.md`.
