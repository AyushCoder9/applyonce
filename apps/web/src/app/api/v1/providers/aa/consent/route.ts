import { z } from "zod";
import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { enqueue } from "@applyonce/jobs";
import { providers } from "@applyonce/providers";
import { handler, citizen, ApiError, ok, log } from "@/lib/api";
import { appUrl, createJob, withJob } from "../../../profiles/_lib";

/** POST {next?} → {url} to the Account Aggregator consent screen (purpose: income). */
export const POST = handler(async (req) => {
  const a = await citizen(req);
  if (a.profile.kind !== "self" || a.ownerUserId !== a.user.id) throw new ApiError(403,"PROVIDER_SELF_ONLY","Switch to your own profile to connect your provider account. Add dependent evidence through Documents.");
  const { next } = z.object({ next: z.string().startsWith("/").max(300).refine(v=>!v.startsWith("//") && !v.includes("\\"),"Use a local page path").optional() }).parse(await req.json().catch(() => ({})));
  const { url, consentHandle } = await providers.aa.createConsent(a.user.id, "income", `${appUrl(req)}/api/v1/providers/aa/consent`);
  await log(a.session, "provider.start", "provider_link", null, { provider: "aa", profileId: a.profile.id });
  const res = ok({ url });
  res.cookies.set("applyonce_aa", JSON.stringify({ handle: consentHandle, next: next ?? "/app/verify", profileId: a.profile.id }), { httpOnly: true, sameSite: "lax", path: "/", maxAge: 600 });
  return res;
});

/** GET ?handle (AA redirect) → job aa.income → redirect. */
export const GET = handler(async (req) => {
  const handle = new URL(req.url).searchParams.get("handle") ?? "";
  const c = (await cookies()).get("applyonce_aa")?.value;
  const saved = c ? (JSON.parse(c) as { handle: string; next: string; profileId: string }) : null;
  const next = saved?.next ?? "/app/verify";
  if (!saved || saved.handle !== handle) return NextResponse.redirect(new URL(`${next}?error=aa_denied`, appUrl(req)));
  const a = await citizen(req, { profileId: saved.profileId });
  const job = await createJob(a.profile.id, "aa", "income", {});
  await enqueue("aa.income", { jobId: job.id, userId: a.ownerUserId, profileId: a.profile.id, consentHandle: handle });
  await log(a.session, "provider.link", "provider_link", null, { provider: "aa", jobId: job.id, profileId: a.profile.id });
  const res = NextResponse.redirect(new URL(withJob(next, job.id), appUrl(req)));
  res.cookies.delete("applyonce_aa");
  return res;
});
