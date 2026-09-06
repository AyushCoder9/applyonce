import { z } from "zod";
import { db, t, eq } from "@applyonce/db";
import { handler, citizen, body, ok, log } from "@/lib/api";
/** POST {profileId} → session.activeProfileId (must be an accessible profile). */
export const POST = handler(async (req) => {
  const { profileId } = await body(req, z.object({ profileId: z.uuid() }));
  const { session, profile } = await citizen(req, { profileId });
  await db.update(t.session).set({ activeProfileId: profile.id }).where(eq(t.session.id, session.session.id));
  await log(session, "profile.switch", "profile", profile.id);
  return ok({ activeProfileId: profile.id, displayName: profile.displayName });
});
