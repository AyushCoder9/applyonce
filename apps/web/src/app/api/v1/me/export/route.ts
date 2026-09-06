import { db, t, and, eq, inArray } from "@applyonce/db";
import { enqueue } from "@applyonce/jobs";
import { handler, citizen, ok, log, ApiError } from "@/lib/api";
/** DPDP right of access: one open export at a time; worker builds a signed ZIP. Step-up required. */
export const POST = handler(async (req) => {
  const { user, session } = await citizen(req, { stepUp: true });
  const open = await db.query.dataRequests.findFirst({ where: and(eq(t.dataRequests.userId, user.id), eq(t.dataRequests.kind, "export"), inArray(t.dataRequests.status, ["pending", "processing"])) });
  if (open) throw new ApiError(409, "EXPORT_IN_PROGRESS", "An export is already being prepared. We'll notify you when it's ready.");
  const [r] = await db.insert(t.dataRequests).values({ userId: user.id, kind: "export" }).returning();
  await enqueue("data.export", { requestId: r!.id, userId: user.id });
  await log(session, "me.export.request", "data_request", r!.id);
  return ok({ requestId: r!.id, status: r!.status }, { status: 201 });
});
