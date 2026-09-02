import { z } from "zod";
import { enqueue } from "@praman/jobs";
import { RE } from "@praman/schema";
import { handler, citizen, body, ok, log } from "@/lib/api";
import { createJob } from "../../../profiles/_lib";
/** POST {pan} → job pan.verify. */
export const POST = handler(async (req) => {
  const a = await citizen(req);
  const { pan } = await body(req, z.object({ pan: z.string().trim().toUpperCase().regex(RE.pan, "Format ABCDE1234F") }));
  const job = await createJob(a.profile.id, "pan", "verify_pan", { pan: pan.slice(0, 5) + "****" + pan.slice(-1) });
  await enqueue("pan.verify", { jobId: job.id, userId: a.ownerUserId, profileId: a.profile.id, pan });
  await log(a.session, "provider.verify", "verification_job", job.id, { provider: "pan", profileId: a.profile.id });
  return ok({ jobId: job.id });
});
