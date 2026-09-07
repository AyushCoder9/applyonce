import { NextResponse } from "next/server";
import { pingDb, providerModes, workerHealth } from "@/components/admin/data";
import { checkDemoPortal } from "@/lib/demo-system";

export const dynamic = "force-dynamic";

export async function GET() {
  const started = Date.now();
  const [database, worker, portal] = await Promise.all([pingDb(), workerHealth(), checkDemoPortal()]);
  const ok = database.ok && worker.ok && portal.ok;
  const response = NextResponse.json({
    ok,
    checkedAt: new Date().toISOString(),
    deployment: {
      commit: process.env.VERCEL_GIT_COMMIT_SHA?.slice(0, 12) ?? "local",
      region: process.env.VERCEL_REGION ?? "local",
    },
    services: { database: { ok: database.ok, ms: database.ms }, worker, portal },
    providers: Object.fromEntries(providerModes().map(({ name, mode }) => [name, mode])),
    durationMs: Date.now() - started,
  }, { status: ok ? 200 : 503 });
  response.headers.set("Cache-Control", "no-store");
  response.headers.set("Server-Timing", `db;dur=${database.ms}, total;dur=${Date.now() - started}`);
  return response;
}
