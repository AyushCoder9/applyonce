import { db, t, and, eq, lt, desc } from "@applyonce/db";
import { handler, citizen, ok } from "@/lib/api";
/** My audit trail, newest first. Cursor = last id. */
export const GET = handler(async (req) => {
  const { user } = await citizen(req);
  const u = new URL(req.url);
  const limit = Math.min(100, Number(u.searchParams.get("limit") ?? 50));
  const cursor = Number(u.searchParams.get("cursor") ?? 0);
  const where = cursor ? and(eq(t.auditLog.actorUserId, user.id), lt(t.auditLog.id, cursor)) : eq(t.auditLog.actorUserId, user.id);
  const rows = await db.select().from(t.auditLog).where(where).orderBy(desc(t.auditLog.id)).limit(limit + 1);
  const page = rows.slice(0, limit);
  return ok({ items: page, nextCursor: rows.length > limit ? page[page.length - 1]!.id : null });
});
