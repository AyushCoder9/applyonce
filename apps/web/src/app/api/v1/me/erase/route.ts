import { z } from "zod";
import { db, t, and, eq, inArray } from "@praman/db";
import { enqueue } from "@praman/jobs";
import { handler, citizen, ok, body, log, ApiError } from "@/lib/api";
/** DPDP right of erasure: 30-day grace (cancel explicitly before processing), legal holds checked by the worker. Step-up required. */
export const POST = handler(async (req) => {
  const { user, session } = await citizen(req, { stepUp: true });
  const { confirm } = await body(req, z.object({ confirm: z.literal("DELETE") }));
  const open = await db.query.dataRequests.findFirst({ where: and(eq(t.dataRequests.userId, user.id), eq(t.dataRequests.kind, "erase"), inArray(t.dataRequests.status, ["pending", "processing", "on_hold"])) });
  if (open) throw new ApiError(409, "ERASE_IN_PROGRESS", "Deletion is already scheduled.");
  const [r] = await db.insert(t.dataRequests).values({ userId: user.id, kind: "erase", notes: "grace_until=" + new Date(Date.now() + 30 * 864e5).toISOString() }).returning();
  await enqueue("data.erase", { requestId: r!.id, userId: user.id });
  await log(session, "me.erase.request", "data_request", r!.id, { confirm });
  return ok({ requestId: r!.id, status: r!.status, graceDays: 30 }, { status: 201 });
});

/** Cancel an unprocessed erasure request; delayed jobs check this state again. */
export const DELETE = handler(async req => {
  const {user,session} = await citizen(req);
  const rows = await db.update(t.dataRequests).set({status:"cancelled",notes:"Cancelled by account holder"}).where(and(eq(t.dataRequests.userId,user.id),eq(t.dataRequests.kind,"erase"),inArray(t.dataRequests.status,["pending","on_hold"]))).returning({id:t.dataRequests.id});
  await log(session,"me.erase.cancel","user",user.id);
  return ok({cancelled:rows.length});
});
