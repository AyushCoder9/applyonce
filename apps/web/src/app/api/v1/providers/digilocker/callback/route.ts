import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { db, t, getDek } from "@applyonce/db";
import { enqueue } from "@applyonce/jobs";
import { providers } from "@applyonce/providers";
import { encrypt } from "@applyonce/crypto";
import { handler, citizen, log } from "@/lib/api";
import { appUrl, createJob, withJob } from "../../../profiles/_lib";

/** GET ?state&code → link provider, create sync job, enqueue, redirect to `next?job=`. */
export const GET = handler(async (req) => {
  const url = new URL(req.url);
  const state = url.searchParams.get("state") ?? "", code = url.searchParams.get("code") ?? "";
  const jar = await cookies();
  const c = jar.get("applyonce_dl")?.value;
  const saved = c ? (JSON.parse(c) as { state: string; next: string; profileId: string }) : null;
  const next = saved?.next ?? "/app/verify";
  const bounce = (err: string) => NextResponse.redirect(new URL(`${next}${next.includes("?") ? "&" : "?"}error=${err}`, appUrl(req)));
  if (!saved || saved.state !== state || !code) return bounce("digilocker_state");
  const a = await citizen(req, { profileId: saved.profileId });
  const done = await providers.digilocker.completeAuth(state, code).catch(() => null);
  if (!done) return bounce("digilocker_denied");
  const dek = await getDek(a.user.id);
  const row = { userId: a.user.id, provider: "digilocker" as const, providerRefEnc: encrypt(dek, done.providerRef, `provider:${a.user.id}:digilocker`), status: "linked", meta: { name: done.name ?? null, dob: done.dob ?? null } };
  await db.insert(t.providerLinks).values(row).onConflictDoUpdate({ target: [t.providerLinks.userId, t.providerLinks.provider], set: row });
  const job = await createJob(a.profile.id, "digilocker", "sync", { trigger: "callback" });
  await enqueue("digilocker.sync", { jobId: job.id, userId: a.ownerUserId, profileId: a.profile.id, providerRef: done.providerRef });
  await log(a.session, "provider.link", "provider_link", null, { provider: "digilocker", jobId: job.id, profileId: a.profile.id });
  const res = NextResponse.redirect(new URL(withJob(next, job.id), appUrl(req)));
  res.cookies.delete("applyonce_dl");
  return res;
});
