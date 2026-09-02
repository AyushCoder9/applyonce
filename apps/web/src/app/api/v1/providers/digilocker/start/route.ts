import { z } from "zod";
import { providers } from "@praman/providers";
import { handler, citizen, ok, log } from "@/lib/api";
import { appUrl } from "../../../profiles/_lib";
/** POST {next?} → {url}. OAuth state kept in an httpOnly cookie (10 min). */
export const POST = handler(async (req) => {
  const a = await citizen(req);
  const { next } = z.object({ next: z.string().startsWith("/").max(300).optional() }).parse(await req.json().catch(() => ({})));
  const { url, state } = await providers.digilocker.startAuth(a.user.id, `${appUrl(req)}/api/v1/providers/digilocker/callback`);
  await log(a.session, "provider.start", "provider_link", null, { provider: "digilocker", profileId: a.profile.id });
  const res = ok({ url });
  res.cookies.set("praman_dl", JSON.stringify({ state, next: next ?? "/app/verify", profileId: a.profile.id }), { httpOnly: true, sameSite: "lax", path: "/", maxAge: 600 });
  return res;
});
