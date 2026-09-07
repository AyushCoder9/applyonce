# ApplyOnce production deployment

## Decision

ApplyOnce uses two explicit deployment profiles. The submitted sandbox stays safe and fast with synthetic data. The real-data production profile keeps primary citizen data in Mumbai and moves as one coordinated release; compute must never move without its data plane.

### Submitted sandbox profile

```text
Vercel CDN (global)
  -> Next.js / Vercel Functions: iad1
  -> Neon Lakebase Postgres: AWS us-east-1, database applyonce_v2
  -> private Vercel Blob: iad1
  -> Redis: currently bom1
```

The sandbox is labelled synthetic. `iad1` is an interim latency correction because the existing database and documents are in the US. A preview measured the database health query at 9 ms warm and 168 ms after a cold connection, compared with roughly 2.5 seconds from `bom1`.

### Real-data production profile

```text
Vercel CDN (global)
  -> Next.js / Vercel Fluid Compute: bom1 (Mumbai)
  -> Aurora PostgreSQL Serverless v2: ap-south-1 (Mumbai)
  -> S3 + KMS + malware quarantine: ap-south-1 (Mumbai)
  -> Redis / durable queue: bom1 (Mumbai)
```

Aurora PostgreSQL is selected over Aurora DSQL because the existing Drizzle schema relies on normal PostgreSQL transactions, constraints, enums and migration semantics. Vercel-to-AWS authentication must use OIDC and RDS IAM tokens, not long-lived AWS credentials. Provisioning and spend approval are release gates.

## Latency budget

| Path | p50 | p95 | Rule |
|---|---:|---:|---|
| Cached public page | 100 ms | 400 ms | No database call on a cache hit |
| Authenticated read | 250 ms | 800 ms | At most two sequential database stages after session resolution |
| Authenticated write | 400 ms | 1,000 ms | One transaction, idempotent retries |
| Health endpoint | 250 ms | 1,500 ms | Two-second hard dependency timeout |
| External provider | provider-specific | provider-specific | Async workflow; never block page rendering |

Run `pnpm perf:smoke -- <url>` to collect p50 and p95 samples. `APPLYONCE_P95_BUDGET_MS` changes the health budget for controlled tests.

## Request-path rules

1. Keep functions and primary data in the same region.
2. Cache public, non-personal aggregates only. Never put citizen claims, session data, documents or consent payloads in CDN or Runtime Cache.
3. Resolve the session once per render and reuse it through React request memoization.
4. Batch independent reads with `Promise.all`; add indexes for every ownership, status and recency lookup.
5. Keep write invariants inside one PostgreSQL transaction.
6. Use the outbox pattern for webhooks and notifications. User-facing success depends on the committed application, not on external delivery.
7. Bound dependency calls and return a request ID plus retryability on failures.
8. Run provider sync, OCR, exports, erasure and webhook retries in durable workflows; request-scoped execution is sandbox-only.

## Safe migration to Mumbai

1. Provision Aurora PostgreSQL and S3 in `ap-south-1` through the Vercel Marketplace/AWS integration.
2. Configure Vercel OIDC, RDS IAM authentication, KMS keys, private bucket policy, quarantine and malware scan flow.
3. Restore a production-sized synthetic snapshot and run migrations with a dedicated migration role.
4. Benchmark from `bom1`; require the latency budget and authorization suite to pass.
5. Export the Neon database with a direct connection and import into Aurora during a bounded maintenance window.
6. Verify row counts, immutable receipt hashes, constraints and representative decrypted claims.
7. Copy private objects, verify checksums, and deny reads until scan status is clean.
8. Deploy a preview against Mumbai, run the complete citizen and partner E2E suites, then promote the exact artifact.
9. Keep Neon and Blob read-only for a rollback window. Do not delete either system until restore and rollback drills pass.

## Release gates

- CI: lint, interaction audit, typecheck, unit/integration tests, migration dry run, build and Playwright.
- Preview: health endpoint, latency smoke, authorization tests, document privacy and duplicate-submit checks.
- Production: additive migration first, deployment second, smoke third, stable alias last.
- Observability: Vercel traces, database saturation, queue depth, webhook dead letters, error rate and p95 latency alerts.
- Operations: point-in-time recovery, quarterly restore drill, incident runbook, retention jobs and data-request completion evidence.

## External blockers

- AWS Marketplace installation, account linkage and billing approval.
- Production SMS/email domains and credentials.
- Government/identity-provider onboarding and legal approval.
- App-store and browser-store reviews for native autofill clients.

Until those gates are complete, provider badges must remain `mock`, `sandbox` or `approval_pending`.
