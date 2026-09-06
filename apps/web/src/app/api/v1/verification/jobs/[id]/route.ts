import { db, t, eq } from "@applyonce/db";
import { handler, citizen, ok, ApiError } from "@/lib/api";
export const GET = handler(async (req, { params }) => {
  const job = await db.query.verificationJobs.findFirst({ where: eq(t.verificationJobs.id, params.id!) });
  if (!job) throw new ApiError(404, "NOT_FOUND");
  await citizen(req, { profileId: job.profileId });
  return ok({ job });
});
