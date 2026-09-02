/**
 * Inline job runner: same handlers, no BullMQ. Used by worker tests and by the web app when
 * `PRAMAN_INLINE_JOBS=1` (see `@praman/jobs` `enqueue()`, which looks for `globalThis.__pramanInlineJobs`).
 * Importing this module registers the global as a side effect.
 */
import type { JobMap, JobName } from "@praman/jobs";
import { handlers } from "./handlers";

export async function runInline<N extends JobName>(name: N, data: JobMap[N]): Promise<unknown> {
  const handler = handlers[name] as (d: JobMap[N]) => Promise<unknown>;
  return handler(data);
}

type InlineRunner = (name: string, data: unknown) => Promise<unknown>;
(globalThis as unknown as { __pramanInlineJobs?: InlineRunner }).__pramanInlineJobs = runInline as InlineRunner;
