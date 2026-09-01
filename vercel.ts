import type { VercelConfig } from "@vercel/config/v1/types";

export const config: VercelConfig = {
  framework: "nextjs",
  buildCommand: "npm run build",
  regions: ["bom1"],
};
