import { enqueue } from "@praman/jobs";
import { handler, citizen, ok, log } from "@/lib/api";
import { createJob, providerRef } from "../../../profiles/_lib";
/** POST → re-run the DigiLocker sync (also the "re-fetch" one-tap for expiring certificates). */
export const POST = handler(async (req) => {
  const a = await citizen(req);
  const ref = await providerRef(a.user.id, "digilocker");
  const job = await createJob(a.profile.id, "digilocker", "sync", { trigger: "manual" });
  await enqueue("digilocker.sync", { jobId: job.id, userId: a.ownerUserId, profileId: a.profile.id, providerRef: ref });
  await log(a.session, "provider.sync", "verification_job", job.id, { provider: "digilocker", profileId: a.profile.id });
  return ok({ jobId: job.id });
});
