/**
 * Worker boot: one BullMQ Worker per queue in `QUEUES`, routed by `job.name` through the `handlers` map.
 * Schedulers (nightly scans) are upserted once here. Graceful shutdown + a 60s queue-depth health log.
 */
import { Worker, type Job } from "bullmq";
import { redis, queue, QUEUES, type QueueName, type JobName } from "@praman/jobs";
import { handlers, registerSchedulers } from "./handlers";
import { logger } from "./logger";

const CONCURRENCY: Partial<Record<QueueName, number>> = { webhooks: 10 };

const workers = QUEUES.map(
  (name) =>
    new Worker(
      name,
      async (job: Job) => {
        const handler = handlers[job.name as JobName];
        if (!handler) throw new Error(`no handler registered for job "${job.name}" on queue "${name}"`);
        return handler(job.data);
      },
      { connection: redis(), concurrency: CONCURRENCY[name] ?? 5 },
    ),
);

for (const w of workers) {
  w.on("completed", (job) => logger.info({ queue: w.name, job: job.name, id: job.id }, "job completed"));
  w.on("failed", (job, err) => logger.error({ queue: w.name, job: job?.name, id: job?.id, err: err.message }, "job failed"));
  w.on("error", (err) => logger.error({ queue: w.name, err: err.message }, "worker error"));
}

await registerSchedulers();
await redis().set("praman:worker:heartbeat", new Date().toISOString(), "EX", 90);
logger.info({ queues: QUEUES }, "schedulers registered, workers started");

const healthTimer = setInterval(async () => {
  try {
    await redis().set("praman:worker:heartbeat", new Date().toISOString(), "EX", 90);
    const counts = await Promise.all(QUEUES.map(async (name) => [name, await queue(name).getJobCounts()] as const));
    logger.info({ queues: Object.fromEntries(counts) }, "queue health");
  } catch (err) {
    logger.warn({ err: (err as Error).message }, "health check failed");
  }
}, 60_000);
healthTimer.unref();

let shuttingDown = false;
async function shutdown(signal: string) {
  if (shuttingDown) return;
  shuttingDown = true;
  logger.info({ signal }, "shutting down");
  clearInterval(healthTimer);
  await Promise.all(workers.map((w) => w.close()));
  process.exit(0);
}
process.on("SIGINT", () => void shutdown("SIGINT"));
process.on("SIGTERM", () => void shutdown("SIGTERM"));
