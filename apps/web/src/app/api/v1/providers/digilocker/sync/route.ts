import { enqueue } from "@applyonce/jobs";
import { db, t, and, eq, getDek } from "@applyonce/db";
import { encrypt } from "@applyonce/crypto";
import { providers } from "@applyonce/providers";
import { handler, citizen, ApiError, ok, log } from "@/lib/api";
import { createJob, providerRef } from "../../../profiles/_lib";
/** POST → re-run the DigiLocker sync (also the "re-fetch" one-tap for expiring certificates). */
export const POST = handler(async (req) => {
  const a = await citizen(req);
  if (a.profile.kind !== "self" || a.ownerUserId !== a.user.id) throw new ApiError(403,"PROVIDER_SELF_ONLY","Switch to your own profile to connect your provider account. Add dependent evidence through Documents.");
  // Assert that the encrypted provider session exists without putting it in Redis/job payloads.
  const currentRef = await providerRef(a.user.id, "digilocker");
  if (providers.digilocker.refresh) {
    const refreshed = await providers.digilocker.refresh(currentRef);
    if (refreshed.providerRef !== currentRef) {
      const dek = await getDek(a.user.id);
      await db.update(t.providerLinks).set({ providerRefEnc: encrypt(dek, refreshed.providerRef, `provider:${a.user.id}:digilocker`) }).where(and(eq(t.providerLinks.userId, a.user.id), eq(t.providerLinks.provider, "digilocker")));
    }
  }
  const job = await createJob(a.profile.id, "digilocker", "sync", { trigger: "manual" });
  await enqueue("digilocker.sync", { jobId: job.id, userId: a.ownerUserId, profileId: a.profile.id });
  await log(a.session, "provider.sync", "verification_job", job.id, { provider: "digilocker", profileId: a.profile.id });
  return ok({ jobId: job.id });
});
