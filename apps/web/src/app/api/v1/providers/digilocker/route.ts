import { db, t, and, eq } from "@applyonce/db";
import { providers } from "@applyonce/providers";
import { handler, citizen, ok, log } from "@/lib/api";
import { providerRef } from "../../profiles/_lib";

/** DELETE disconnects ApplyOnce immediately and attempts provider-side revocation first. */
export const DELETE = handler(async (req) => {
  const access = await citizen(req);
  if (access.profile.kind !== "self" || access.ownerUserId !== access.user.id) return ok({ disconnected: false, reason: "self_profile_required" }, { status: 403 });
  const ref = await providerRef(access.user.id, "digilocker");
  let providerRevoked = false;
  let providerWarning: string | null = null;
  try {
    if (providers.digilocker.revoke) {
      await providers.digilocker.revoke(ref);
      providerRevoked = true;
    } else providerWarning = "This provider does not expose remote revocation. Revoke ApplyOnce in DigiLocker as well.";
  } catch {
    providerWarning = "ApplyOnce access was removed locally, but DigiLocker could not confirm remote revocation. Revoke ApplyOnce in DigiLocker as well.";
  }
  await db.delete(t.providerLinks).where(and(eq(t.providerLinks.userId, access.user.id), eq(t.providerLinks.provider, "digilocker")));
  await log(access.session, "provider.disconnect", "provider_link", null, { provider: "digilocker", providerRevoked, profileId: access.profile.id });
  return ok({ disconnected: true, providerRevoked, providerWarning });
});
