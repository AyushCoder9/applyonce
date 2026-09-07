import "server-only";
import { db, t, eq, gt, and, count, dsql, inArray } from "@applyonce/db";
import { QUEUES, queue } from "@applyonce/jobs";

const n = async (q: Promise<{ n: number }[]>) => (await q)[0]?.n ?? 0;
export async function overviewStats() {
  const day = new Date(Date.now() - 864e5);
  const [users, profiles, factsTotal, factsVerified, partnersPending, jobsFailed24h, whTotal, whFailed] = await Promise.all([
    n(db.select({ n: count() }).from(t.user)),
    n(db.select({ n: count() }).from(t.profiles).where(eq(t.profiles.status, "active"))),
    n(db.select({ n: count() }).from(t.facts)),
    n(db.select({ n: count() }).from(t.facts).where(inArray(t.facts.source, ["issuer_verified", "provider_verified"]))),
    n(db.select({ n: count() }).from(t.partners).where(eq(t.partners.status, "pending"))),
    n(db.select({ n: count() }).from(t.verificationJobs).where(and(eq(t.verificationJobs.status, "failed"), gt(t.verificationJobs.createdAt, day)))),
    n(db.select({ n: count() }).from(t.webhookDeliveries)),
    n(db.select({ n: count() }).from(t.webhookDeliveries).where(eq(t.webhookDeliveries.status, "failed"))),
  ]);
  return { users, profiles, factsTotal, factsVerified, verifiedPct: factsTotal ? Math.round((factsVerified / factsTotal) * 100) : 0, partnersPending, jobsFailed24h, webhookTotal: whTotal, webhookFailed: whFailed, webhookFailPct: whTotal ? Math.round((whFailed / whTotal) * 100) : 0 };
}

export type QueueCount = { name: string; counts: Record<string, number> | null; error?: string };
export async function queueCounts(): Promise<QueueCount[]> {
  return Promise.all(QUEUES.map(async (name) => {
    try { const counts = await Promise.race([queue(name).getJobCounts(), new Promise<never>((_, rej) => setTimeout(() => rej(new Error("redis timeout")), 2500))]); return { name, counts }; }
    catch (e) { return { name, counts: null, error: (e as Error).message }; }
  }));
}

export const PROVIDER_ENV = [["digilocker", "PROVIDER_DIGILOCKER"], ["aadhaar_offline", "PROVIDER_AADHAAR"], ["pan", "PROVIDER_PAN"], ["abha", "PROVIDER_ABHA"], ["aa", "PROVIDER_AA"], ["ocr", "PROVIDER_OCR"], ["sms", "PROVIDER_SMS"], ["email", "PROVIDER_EMAIL"]] as const;
export const providerModes = () => PROVIDER_ENV.map(([name, env]) => ({ name, env, mode: process.env[env] ?? "mock" }));

const within = <T>(promise: Promise<T>, ms: number, label: string) => Promise.race([
  promise,
  new Promise<never>((_, reject) => setTimeout(() => reject(new Error(`${label} timeout`)), ms)),
]);

export const queueRequired = () => process.env.APPLYONCE_INLINE_JOBS !== "1";

export async function pingDb() { const t0 = Date.now(); try { await within(db.execute(dsql`select 1`), 1200, "database"); return { ok: true, ms: Date.now() - t0 }; } catch (e) { return { ok: false, ms: Date.now() - t0, error: (e as Error).message }; } }
export async function pingRedis() {
  const t0 = Date.now();
  const required = queueRequired();
  try { const { redis } = await import("@applyonce/jobs"); const r = await within(redis().ping(), 750, "redis"); return { ok: r === "PONG", required, ms: Date.now() - t0 }; }
  catch (e) { return { ok: false, required, ms: Date.now() - t0, error: (e as Error).message }; }
}

export async function workerHealth() {
  if (process.env.APPLYONCE_INLINE_JOBS === "1") return {ok:true,note:"Request-scoped processor enabled"};
  try {const {redis}=await import("@applyonce/jobs");const at=await Promise.race([redis().get("applyonce:worker:heartbeat"),new Promise<null>(resolve=>setTimeout(()=>resolve(null),2000))]);return {ok:!!at,note:at?"Heartbeat received":"No recent worker heartbeat"};} catch {return {ok:false,note:"Worker health unavailable"};}
}
