# ApplyOnce deployment plan

The submitted production URL is `https://applyonce-silk.vercel.app`. It is a permanent release constraint: deployments may change the artifact behind this alias, but must never replace the alias submitted to reviewers.

## Runtime map

- Next.js web and API: Vercel Fluid Compute in Mumbai (`bom1`), Node.js 24.
- PostgreSQL: the existing Vercel-connected Neon database for the synthetic hackathon environment.
- Queue: the Vercel Marketplace Redis resource `applyonce-redis` in Mumbai.
- Private documents: the existing private Vercel Blob store `applyonce-documents`.
- Authentication: Better Auth with OTP demo mode for synthetic reviewer accounts; production secrets are stored only in Vercel environment variables.
- Providers: explicitly labelled mock/sandbox adapters. No government integration is described as live.

## Release sequence

1. Confirm the stable production alias and record the current deployment ID for rollback.
2. Run the full lint, interaction, type, unit/integration, database, API and browser suites locally.
3. Verify no source, package, route, protocol, metadata or documentation occurrence uses the retired English brand.
4. Push the reviewed commit to the public GitHub repository.
5. Apply additive database migrations and idempotent synthetic seed data to the Vercel database.
6. Build a protected preview with production-equivalent services.
7. Test public pages, OTP login, profile, applications, consent, receipt, status and private document storage on the preview.
8. Promote the exact tested preview artifact to production.
9. Verify the unchanged submitted alias from a clean browser and test direct routes, mobile layout, console errors and response latency.
10. Inspect deployment logs for errors. Roll back immediately if login, submission, receipts, database access, Redis, private documents or the submitted alias fails.

## Rollback

The pre-release production deployment remains the rollback target. Promotion is used instead of rebuilding production. A rollback is triggered by any failed critical journey, repeated HTTP 5xx response, inaccessible submitted alias, authentication regression, failed application persistence, or broken document privacy boundary.

## Scope boundary

This deployment is a public synthetic hackathon environment. It demonstrates the complete ApplyOnce product workflow but is not an official government integration and must not receive real identity documents or production personal data.
