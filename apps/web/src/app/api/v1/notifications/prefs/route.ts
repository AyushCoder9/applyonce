import { z } from "zod";
import { db, t, eq } from "@praman/db";
import { handler, citizen, ok, body, log } from "@/lib/api";
import { mergePrefs, toRows, CHANNELS, CATEGORIES, type PrefMatrix } from "@/components/settings/prefs";

export const GET = handler(async (req) => {
  const { user } = await citizen(req);
  return ok(mergePrefs(await db.select().from(t.notificationPrefs).where(eq(t.notificationPrefs.userId, user.id))));
});
const Matrix = z.partialRecord(z.enum(CHANNELS), z.partialRecord(z.enum(CATEGORIES), z.boolean()));
/** Replace the matrix; a partial body is merged over the stored prefs (idempotent). */
export const PUT = handler(async (req) => {
  const { user, session } = await citizen(req);
  const patch = await body(req, Matrix);
  const stored = await db.select().from(t.notificationPrefs).where(eq(t.notificationPrefs.userId, user.id));
  const rows = Object.entries(patch).flatMap(([channel, cats]) => Object.entries(cats ?? {}).map(([category, enabled]) => ({ channel, category, enabled: !!enabled })));
  const m: PrefMatrix = mergePrefs(rows, mergePrefs(stored));
  await db.transaction(async (tx) => {
    await tx.delete(t.notificationPrefs).where(eq(t.notificationPrefs.userId, user.id));
    await tx.insert(t.notificationPrefs).values(toRows(m).map((r) => ({ userId: user.id, ...r })));
  });
  await log(session, "notifications.prefs.update", "user", user.id);
  return ok(m);
});
