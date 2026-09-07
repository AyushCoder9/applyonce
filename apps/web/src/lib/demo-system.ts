import "server-only";
import { demoPortalUrl } from "@/lib/urls";

type PortalHealthResponse = {
  ok?: boolean;
  services?: {
    redis?: { ok?: boolean; ms?: number };
    applyonce?: { ok?: boolean; commit?: string | null };
  };
};

export type DemoPortalHealth = {
  ok: boolean;
  configured: boolean;
  redis: { ok: boolean; ms: number | null };
  applyonce: { ok: boolean; commit: string | null };
};

/** Probe the independent BTA app, which in turn proves Redis and ApplyOnce reachability. */
export async function checkDemoPortal(): Promise<DemoPortalHealth> {
  const portal = demoPortalUrl();
  if (!portal) return { ok: false, configured: false, redis: { ok: false, ms: null }, applyonce: { ok: false, commit: null } };
  try {
    const response = await fetch(`${portal}/api/health`, { cache: "no-store", signal: AbortSignal.timeout(2_000) });
    const health = await response.json() as PortalHealthResponse;
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
