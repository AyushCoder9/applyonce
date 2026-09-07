import type { VercelConfig } from "@vercel/config/v1";

const isDemoPortal = process.env.APPLYONCE_DEPLOY_TARGET === "portal" || process.env.VERCEL_PROJECT_NAME === "applyonce-bta-demo";

export const config: VercelConfig = {
  framework: "nextjs",
  installCommand: "pnpm install --frozen-lockfile",
  buildCommand: isDemoPortal ? "pnpm --filter @applyonce/demo-exam-portal build" : "pnpm --filter @applyonce/web build",
  outputDirectory: isDemoPortal ? "apps/demo-exam-portal/.next" : "apps/web/.next",
  // Keep compute beside the current Neon and private Blob data plane. This
  // avoids several transatlantic round trips on every authenticated render.
  // When production data is migrated to Mumbai, switch this back to `bom1`
  // in the same release that changes the database and object-store regions.
  regions: [isDemoPortal ? "bom1" : "iad1"],
};
