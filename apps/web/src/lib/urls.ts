export function deploymentAppUrl() {
  const configured = process.env.NEXT_PUBLIC_APP_URL?.trim();
  if (configured) return configured.replace(/\/$/, "");
  const host = process.env.VERCEL_BRANCH_URL ?? process.env.VERCEL_URL ?? process.env.VERCEL_PROJECT_PRODUCTION_URL;
  return host ? `https://${host}` : "http://localhost:3300";
}

export function demoPortalUrl() {
  if (process.env.DEMO_PORTAL_ENABLED !== "1") return null;
  const configured = process.env.NEXT_PUBLIC_DEMO_PORTAL_URL?.trim();
  return configured ? configured.replace(/\/$/, "") : "http://localhost:3301";
}
