import { NextResponse } from "next/server";
import { pingDb, workerHealth } from "@/components/admin/data";
import { demoPortalUrl } from "@/lib/urls";

export const dynamic = "force-dynamic";

type PortalHealth = {
  ok?: boolean;
  services?: {
    redis?: { ok?: boolean; ms?: number };
    applyonce?: { ok?: boolean; commit?: string | null };
  };
};

async function checkPortal() {
  const portal = demoPortalUrl();
  if (!portal) return { ok: false, configured: false, redis: { ok: false, ms: null }, applyonce: { ok: false, commit: null } };
  try {
    const response = await fetch(`${portal}/api/health`, { cache: "no-store", signal: AbortSignal.timeout(5_000) });
    const health = await response.json() as PortalHealth;
    return {
      ok: response.ok && health.ok === true,
      configured: true,
      redis: { ok: health.services?.redis?.ok === true, ms: health.services?.redis?.ms ?? null },
      applyonce: { ok: health.services?.applyonce?.ok === true, commit: health.services?.applyonce?.commit ?? null },
    };
  } catch {
    return { ok: false, configured: true, redis: { ok: false, ms: null }, applyonce: { ok: false, commit: null } };
  }
}

export async function GET() {
  const started = Date.now();
  const [database, worker, portal] = await Promise.all([pingDb(), workerHealth(), checkPortal()]);
  const ok = database.ok && worker.ok && portal.ok;
  const response = NextResponse.json({
    ok,
    checkedAt: new Date().toISOString(),
    deployment: {
      commit: process.env.VERCEL_GIT_COMMIT_SHA?.slice(0, 12) ?? "local",
      region: process.env.VERCEL_REGION ?? "local",
    },
    services: { database: { ok: database.ok, ms: database.ms }, worker, portal },
    durationMs: Date.now() - started,
  }, { status: ok ? 200 : 503 });
  response.headers.set("Cache-Control", "no-store");
  response.headers.set("Server-Timing", `db;dur=${database.ms}, total;dur=${Date.now() - started}`);
  return response;
}
