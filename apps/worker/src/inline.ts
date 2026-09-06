/**
 * Inline job runner: same handlers, no BullMQ. Used by worker tests and by the web app when
 * `APPLYONCE_INLINE_JOBS=1` (see `@applyonce/jobs` `enqueue()`, which looks for `globalThis.__applyonceInlineJobs`).
 * Importing this module registers the global as a side effect.
 */
import type { JobMap, JobName } from "@applyonce/jobs";
import { handlers } from "./handlers";

export async function runInline<N extends JobName>(name: N, data: JobMap[N]): Promise<unknown> {
  const handler = handlers[name] as (d: JobMap[N]) => Promise<unknown>;
  return handler(data);
}

type InlineRunner = (name: string, data: unknown) => Promise<unknown>;
(globalThis as unknown as { __applyonceInlineJobs?: InlineRunner }).__applyonceInlineJobs = runInline as InlineRunner;
