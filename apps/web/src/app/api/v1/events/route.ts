import { db, t, and, or, eq, gt, inArray, desc } from "@applyonce/db";
import { handler, citizen } from "@/lib/api";
import { sseResponse, type SseEvent } from "@/lib/sse";

export const dynamic = "force-dynamic";
/** GET → SSE: `job` (verification_jobs progress for every accessible profile) + `notification` (new rows). DB-polled every 1.5 s. */
export const GET = handler(async (req) => {
  const a = await citizen(req);
  const profileIds = a.all.map((p) => p.id);
  const seen = new Map<string, string>();
  const poll = async (since: Date): Promise<SseEvent[]> => {
    const out: SseEvent[] = [];
    const jobs = profileIds.length ? await db.select().from(t.verificationJobs).where(and(inArray(t.verificationJobs.profileId, profileIds), or(inArray(t.verificationJobs.status, ["queued", "running"]), gt(t.verificationJobs.finishedAt, new Date(since.getTime() - 5000))))).orderBy(desc(t.verificationJobs.createdAt)).limit(20) : [];
    for (const j of jobs) {
      const sig = `${j.status}:${JSON.stringify(j.progress)}`;
      if (seen.get(j.id) === sig) continue;
      seen.set(j.id, sig);
      out.push({ event: "job", id: `job-${j.id}-${Date.now()}`, data: { id: j.id, profileId: j.profileId, provider: j.provider, kind: j.kind, status: j.status, progress: j.progress, error: j.error, resultJson: j.resultJson, finishedAt: j.finishedAt } });
    }
    const notes = await db.select().from(t.notifications).where(and(eq(t.notifications.userId, a.user.id), gt(t.notifications.createdAt, since))).orderBy(desc(t.notifications.createdAt)).limit(20);
    for (const n of notes) out.push({ event: "notification", id: `n-${n.id}`, data: n });
    return out;
  };
  return sseResponse(req, poll, { hello: { profileId: a.profile.id, at: new Date().toISOString() } });
});
