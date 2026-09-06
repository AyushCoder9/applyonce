import { z } from "zod";
import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { enqueue } from "@praman/jobs";
import { providers, byPhone } from "@praman/providers";
import { handler, citizen, ApiError, ok, log } from "@/lib/api";
import { appUrl, createJob, providerRef, withJob } from "../../../profiles/_lib";

/** POST {next?} → {url} to the ABHA consent screen. */
export const POST = handler(async (req) => {
  const a = await citizen(req);
  if (a.profile.kind !== "self" || a.ownerUserId !== a.user.id) throw new ApiError(403,"PROVIDER_SELF_ONLY","Switch to your own profile to connect your provider account. Add dependent evidence through Documents.");
  const { next } = z.object({ next: z.string().startsWith("/").max(300).refine(v=>!v.startsWith("//") && !v.includes("\\"),"Use a local page path").optional() }).parse(await req.json().catch(() => ({})));
  const { url, state } = await providers.abha.startLink(a.user.id, `${appUrl(req)}/api/v1/providers/abha/link`);
  await log(a.session, "provider.start", "provider_link", null, { provider: "abha", profileId: a.profile.id });
  const res = ok({ url });
  res.cookies.set("praman_abha", JSON.stringify({ state, next: next ?? "/app/verify", profileId: a.profile.id }), { httpOnly: true, sameSite: "lax", path: "/", maxAge: 600 });
  return res;
});

/** GET ?state&code (provider callback) → job abha.link → redirect. */
export const GET = handler(async (req) => {
  const url = new URL(req.url);
  const state = url.searchParams.get("state") ?? "", code = url.searchParams.get("code") ?? "";
  const c = (await cookies()).get("praman_abha")?.value;
  const saved = c ? (JSON.parse(c) as { state: string; next: string; profileId: string }) : null;
  const next = saved?.next ?? "/app/verify";
  if (!saved || saved.state !== state || !code) return NextResponse.redirect(new URL(`${next}?error=abha_denied`, appUrl(req)));
  const a = await citizen(req, { profileId: saved.profileId });
  const ref = await providerRef(a.user.id, "digilocker").catch(() => null) ?? (byPhone(code) ? `dl_${byPhone(code)!.id}` : code);
  const job = await createJob(a.profile.id, "abha", "link", {});
  await enqueue("abha.link", { jobId: job.id, userId: a.ownerUserId, profileId: a.profile.id, providerRef: ref });
  await log(a.session, "provider.link", "provider_link", null, { provider: "abha", jobId: job.id, profileId: a.profile.id });
  const res = NextResponse.redirect(new URL(withJob(next, job.id), appUrl(req)));
  res.cookies.delete("praman_abha");
  return res;
});
