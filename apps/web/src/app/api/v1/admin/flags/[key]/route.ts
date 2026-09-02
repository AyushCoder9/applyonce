import { z } from "zod";
import { db, t } from "@praman/db";
import { handler, ok, body, log } from "@/lib/api";
import { adminApi } from "../../_auth";
export const PUT = handler(async (req, { params }) => {
  const s = await adminApi();
  const { enabled, rollout } = await body(req, z.object({ enabled: z.boolean(), rollout: z.record(z.string(), z.unknown()).optional() }));
  const key = params.key!.replace(/[^a-z0-9_]/gi, "").slice(0, 64);
  const [f] = await db.insert(t.flags).values({ key, enabled, rollout: rollout ?? {} }).onConflictDoUpdate({ target: t.flags.key, set: { enabled, ...(rollout ? { rollout } : {}) } }).returning();
  await log(s, "admin.flag.set", "flag", key, { enabled });
  return ok(f);
});
