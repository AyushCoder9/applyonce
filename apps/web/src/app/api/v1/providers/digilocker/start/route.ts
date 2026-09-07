import { z } from "zod";
import { providers } from "@applyonce/providers";
import { handler, citizen, ApiError, ok, log } from "@/lib/api";
import { sealOAuthTransaction } from "@/lib/oauth-transaction";
import { appUrl } from "../../../profiles/_lib";
/** POST {next?} → {url}. OAuth state kept in an httpOnly cookie (10 min). */
export const POST = handler(async (req) => {
  const a = await citizen(req);
  if (a.profile.kind !== "self" || a.ownerUserId !== a.user.id) throw new ApiError(403,"PROVIDER_SELF_ONLY","Switch to your own profile to connect your provider account. Add dependent evidence through Documents.");
  const { next } = z.object({ next: z.string().startsWith("/").max(300).refine(v=>!v.startsWith("//") && !v.includes("\\"),"Use a local page path").optional() }).parse(await req.json().catch(() => ({})));
  const { url, transaction } = await providers.digilocker.startAuth(a.user.id, `${appUrl(req)}/api/v1/providers/digilocker/callback`);
  await log(a.session, "provider.start", "provider_link", null, { provider: "digilocker", profileId: a.profile.id });
  const res = ok({ url });
  res.cookies.set("applyonce_dl", sealOAuthTransaction({ provider: "digilocker", userId: a.user.id, transaction, next: next ?? "/app/verify", profileId: a.profile.id }), { httpOnly: true, secure: process.env.NODE_ENV === "production", sameSite: "lax", path: "/", maxAge: 600 });
  return res;
});
