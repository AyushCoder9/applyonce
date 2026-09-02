import { db, t, and, eq, desc } from "@praman/db";
import { handler, citizen, ok } from "@/lib/api";
export const GET = handler(async (req) => {
  const { user } = await citizen(req);
  const cat = new URL(req.url).searchParams.get("category");
  const where = cat ? and(eq(t.notifications.userId, user.id), eq(t.notifications.category, cat)) : eq(t.notifications.userId, user.id);
  return ok(await db.select().from(t.notifications).where(where).orderBy(desc(t.notifications.createdAt)).limit(200));
});
