/**
 * Queue names + payload types shared by web (producer) and worker (consumer).
 * One queue per domain; job `name` selects the handler.
 */
import { Queue, type JobsOptions } from "bullmq";
import IORedis from "ioredis";

export const redisUrl = () => process.env.REDIS_URL ?? "redis://localhost:6380";
const g = globalThis as unknown as { __applyonceRedis?: IORedis; __applyonceQueues?: Record<string, Queue> };
export const redis = () => (g.__applyonceRedis ??= new IORedis(redisUrl(), { maxRetriesPerRequest: null, lazyConnect: true }));

export type JobMap = {
  // verification
  "digilocker.sync": { jobId: string; userId: string; profileId: string; providerRef: string };
  "pan.verify": { jobId: string; userId: string; profileId: string; pan: string };
  "aa.income": { jobId: string; userId: string; profileId: string; consentHandle: string };
  "abha.link": { jobId: string; userId: string; profileId: string; providerRef: string };
  // documents
  "document.process": { documentId: string; userId: string; profileId: string };       // AV stub + OCR → proposed facts
  // partners
  "webhook.deliver": { deliveryId: string };
  // notifications
  "notify": { userId: string; category: string; title: string; body?: string; link?: string; channels?: ("inapp" | "sms" | "email" | "push")[] };
  // scheduled (upsertJobScheduler)
  "scan.expiries": Record<string, never>;
  "scan.mismatches": Record<string, never>;
  "scan.handover18": Record<string, never>;
  "scan.deadlines": Record<string, never>;
  // data rights
  "data.export": { requestId: string; userId: string };
  "data.erase": { requestId: string; userId: string };
};
export type JobName = keyof JobMap;

export const QUEUES = ["verification", "documents", "webhooks", "notifications", "scheduled", "data"] as const;
export type QueueName = (typeof QUEUES)[number];
const QUEUE_OF: Record<JobName, QueueName> = {
  "digilocker.sync": "verification", "pan.verify": "verification", "aa.income": "verification", "abha.link": "verification",
  "document.process": "documents", "webhook.deliver": "webhooks", "notify": "notifications",
  "scan.expiries": "scheduled", "scan.mismatches": "scheduled", "scan.handover18": "scheduled", "scan.deadlines": "scheduled",
  "data.export": "data", "data.erase": "data",
};
export const queueFor = (name: JobName) => QUEUE_OF[name];

export function queue(name: QueueName): Queue {
  g.__applyonceQueues ??= {};
  return (g.__applyonceQueues[name] ??= new Queue(name, { connection: redis(), defaultJobOptions: { attempts: 3, backoff: { type: "exponential", delay: 2000 }, removeOnComplete: { age: 3600, count: 1000 }, removeOnFail: { age: 86400 } } }));
}

/** Producer. Falls back to inline `process.env.APPLYONCE_INLINE_JOBS` runner in tests (worker registers it). */
export async function enqueue<N extends JobName>(name: N, data: JobMap[N], opts: JobsOptions = {}) {
  const inline = (globalThis as { __applyonceInlineJobs?: (n: string, d: unknown) => Promise<void> }).__applyonceInlineJobs;
  if (inline) { await inline(name, data); return { id: `inline-${Date.now()}` }; }
  const job = await queue(queueFor(name)).add(name, data, opts);
  return { id: job.id! };
}
