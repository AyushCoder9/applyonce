import { z } from "zod";
import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { enqueue } from "@praman/jobs";
import { providers } from "@praman/providers";
import { handler, citizen, ok, log } from "@/lib/api";
import { appUrl, createJob, withJob } from "../../../profiles/_lib";

/** POST {next?} → {url} to the Account Aggregator consent screen (purpose: income). */
export const POST = handler(async (req) => {
  const a = await citizen(req);
  const { next } = z.object({ next: z.string().startsWith("/").max(300).optional() }).parse(await req.json().catch(() => ({})));
  const { url, consentHandle } = await providers.aa.createConsent(a.user.id, "income", `${appUrl(req)}/api/v1/providers/aa/consent`);
  await log(a.session, "provider.start", "provider_link", null, { provider: "aa", profileId: a.profile.id });
  const res = ok({ url });
  res.cookies.set("praman_aa", JSON.stringify({ handle: consentHandle, next: next ?? "/app/verify", profileId: a.profile.id }), { httpOnly: true, sameSite: "lax", path: "/", maxAge: 600 });
  return res;
});

/** GET ?handle (AA redirect) → job aa.income → redirect. */
export const GET = handler(async (req) => {
  const handle = new URL(req.url).searchParams.get("handle") ?? "";
  const c = (await cookies()).get("praman_aa")?.value;
  const saved = c ? (JSON.parse(c) as { handle: string; next: string; profileId: string }) : null;
  const next = saved?.next ?? "/app/verify";
  if (!saved || saved.handle !== handle) return NextResponse.redirect(new URL(`${next}?error=aa_denied`, appUrl(req)));
  const a = await citizen(req, { profileId: saved.profileId });
  const job = await createJob(a.profile.id, "aa", "income", {});
  await enqueue("aa.income", { jobId: job.id, userId: a.ownerUserId, profileId: a.profile.id, consentHandle: handle });
  await log(a.session, "provider.link", "provider_link", null, { provider: "aa", jobId: job.id, profileId: a.profile.id });
  const res = NextResponse.redirect(new URL(withJob(next, job.id), appUrl(req)));
  res.cookies.delete("praman_aa");
  return res;
});
