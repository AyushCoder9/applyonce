import { NextResponse } from "next/server";
import { loadApplyOnceConfig } from "@/lib/applyonce";
import { storeHealth } from "@/lib/store";

export const dynamic = "force-dynamic";

export async function GET() {
  const started = performance.now();
  try {
    const redis = await storeHealth();
    const cfg = loadApplyOnceConfig();
    const response = await fetch(`${cfg.apiUrl}/api/health`, {
      cache: "no-store",
      signal: AbortSignal.timeout(3_000),
    });
    if (!response.ok) throw new Error(`ApplyOnce health returned ${response.status}`);
    const upstream = await response.json() as { ok?: boolean; deployment?: { commit?: string } };
    if (!upstream.ok) throw new Error("ApplyOnce reported a degraded state");
    return NextResponse.json({
      ok: true,
      status: "operational",
      checkedAt: new Date().toISOString(),
      deployment: { environment: process.env.VERCEL_ENV ?? process.env.NODE_ENV ?? "development", region: process.env.VERCEL_REGION ?? "local" },
      services: { redis, applyonce: { ok: true, commit: upstream.deployment?.commit ?? null } },
      durationMs: Math.round(performance.now() - started),
    });
  } catch (error) {
    return NextResponse.json({ ok: false, status: "degraded", checkedAt: new Date().toISOString(), error: (error as Error).message, durationMs: Math.round(performance.now() - started) }, { status: 503 });
  }
}
