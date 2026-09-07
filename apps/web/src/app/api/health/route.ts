import { NextResponse } from "next/server";
import { pingDb, pingRedis, providerModes, workerHealth } from "@/components/admin/data";

export const dynamic = "force-dynamic";

export async function GET() {
  const startedAt = Date.now();
  const [database, redis, worker] = await Promise.all([pingDb(), pingRedis(), workerHealth()]);
  const ok = database.ok && redis.ok && worker.ok;
  const providers = Object.fromEntries(providerModes().map(({ name, mode }) => [name, mode]));
  const response = NextResponse.json({
    ok,
    status: ok ? "operational" : "degraded",
    checkedAt: new Date().toISOString(),
    deployment: {
      environment: process.env.VERCEL_ENV ?? process.env.NODE_ENV ?? "unknown",
      region: process.env.VERCEL_REGION ?? "local",
      commit: process.env.VERCEL_GIT_COMMIT_SHA?.slice(0, 12) ?? null,
    },
    services: { database, redis, worker },
    providers,
    durationMs: Date.now() - startedAt,
  }, { status: ok ? 200 : 503 });
  response.headers.set("Cache-Control", "no-store");
  response.headers.set("Server-Timing", `db;dur=${database.ms}, redis;dur=${redis.ms}, total;dur=${Date.now() - startedAt}`);
  return response;
}
