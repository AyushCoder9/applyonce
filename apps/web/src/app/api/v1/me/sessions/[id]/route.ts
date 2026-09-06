import { db, t, and, eq } from "@applyonce/db";
import { handler, citizen, ok, log, ApiError } from "@/lib/api";
/** Revoke one of my sessions (fallback for WP1's DELETE auth/sessions/:id). */
export const DELETE = handler(async (req, { params }) => {
  const { user, session } = await citizen(req);
  if (params.id === session.session.id) throw new ApiError(400, "CURRENT_SESSION", "Use Sign out for this device.");
  const r = await db.delete(t.session).where(and(eq(t.session.id, params.id!), eq(t.session.userId, user.id))).returning({ id: t.session.id });
  if (!r.length) throw new ApiError(404, "SESSION_NOT_FOUND");
  await log(session, "session.revoke", "session", params.id);
  return ok({ revoked: true });
});
