import { z } from "zod";
import { db, t, eq } from "@applyonce/db";
import { handler, citizen, ok, body, log } from "@/lib/api";
const Patch = z.object({ locale: z.enum(["en", "hi"]).optional(), name: z.string().trim().min(2).max(120).optional() });
/** Profile settings: display language + name. */
export const PATCH = handler(async (req) => {
  const { user, session } = await citizen(req);
  const b = await body(req, Patch);
  await db.update(t.user).set({ ...b, updatedAt: new Date() }).where(eq(t.user.id, user.id));
  await log(session, "me.update", "user", user.id, b);
  return ok(b);
});
