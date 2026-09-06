import type { VercelConfig } from "@vercel/config/v1";

export const config: VercelConfig = {
  framework: "nextjs",
  installCommand: "pnpm install --frozen-lockfile",
  buildCommand: "pnpm --filter @applyonce/web build",
  outputDirectory: "apps/web/.next",
  regions: ["bom1"],
};
