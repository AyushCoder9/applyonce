import type { VercelConfig } from "@vercel/config/v1";

export const config: VercelConfig = {
  framework: "nextjs",
  installCommand: "pnpm install --frozen-lockfile",
  buildCommand: "pnpm --filter @applyonce/web build",
  outputDirectory: "apps/web/.next",
  // Keep compute beside the current Neon and private Blob data plane. This
  // avoids several transatlantic round trips on every authenticated render.
  // When production data is migrated to Mumbai, switch this back to `bom1`
  // in the same release that changes the database and object-store regions.
  regions: ["iad1"],
};
