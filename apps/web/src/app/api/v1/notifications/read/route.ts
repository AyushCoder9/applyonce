import { z } from "zod";
import { db, t, and, eq, isNull, inArray } from "@praman/db";
import { handler, citizen, ok, body } from "@/lib/api";
export const POST = handler(async (req) => {
  const { user } = await citizen(req);
  const b = await body(req, z.object({ ids: z.array(z.string().uuid()).optional(), all: z.boolean().optional() }));
  const base = and(eq(t.notifications.userId, user.id), isNull(t.notifications.readAt));
  const where = b.all ? base : b.ids?.length ? and(base, inArray(t.notifications.id, b.ids)) : null;
  if (!where) return ok({ read: 0 });
  const r = await db.update(t.notifications).set({ readAt: new Date() }).where(where).returning({ id: t.notifications.id });
  return ok({ read: r.length });
});
