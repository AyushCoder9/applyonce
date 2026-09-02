import { handler, citizen, ok } from "@/lib/api";
/** GET → self + wards the session may act on. (POST /profiles = WP5 family.) */
export const GET = handler(async (req) => {
  const { all, profile } = await citizen(req);
  return ok({ activeProfileId: profile.id, profiles: all.map((p) => ({ id: p.id, displayName: p.displayName, kind: p.kind, role: p.role, scope: p.scope, dobYear: p.dobYear })) });
});
