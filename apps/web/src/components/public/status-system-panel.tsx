"use client";

import { useCallback, useEffect, useState } from "react";
import { Button } from "@heroui/react";
import { RefreshCw } from "lucide-react";

type Proof = {
  ok: boolean;
  checkedAt: string;
  deployment: { commit: string; region: string };
  services: {
    database: { ok: boolean; ms: number };
    worker: { ok: boolean; note: string };
    portal: { ok: boolean; configured: boolean; redis: { ok: boolean; ms: number | null } };
  };
  providers: Record<string, { mode: string; state: string }>;
};

export function StatusSystemPanel() {
  const [proof, setProof] = useState<Proof | null>(null);
  const [checking, setChecking] = useState(true);
  const [error, setError] = useState("");

  const refresh = useCallback(async () => {
    setChecking(true);
    setError("");
    try {
      const response = await fetch("/api/demo-proof", { cache: "no-store" });
      const data = await response.json() as Proof;
      setProof(data);
      if (!response.ok || !data.ok) setError("Some services are degraded. Your saved data remains available; refresh to check again.");
    } catch {
      setError("The live status check could not be completed. Refresh to retry.");
    } finally {
      setChecking(false);
    }
  }, []);

  useEffect(() => { void refresh(); }, [refresh]);

  const rows = proof ? [
    ["Web app", true, `${proof.deployment.region} · ${proof.deployment.commit}`],
    ["Database (Postgres)", proof.services.database.ok, proof.services.database.ok ? `${proof.services.database.ms} ms` : "unavailable"],
    ["BTA application state", proof.services.portal.ok, proof.services.portal.redis.ok ? `Redis-backed · ${proof.services.portal.redis.ms ?? "—"} ms` : proof.services.portal.configured ? "portal state unavailable" : "portal not configured"],
    ["Worker", proof.services.worker.ok, proof.services.worker.note],
  ] as const : [];
  const Dot = ({ ok }: { ok: boolean }) => <span className={`inline-block size-2.5 rounded-pill ${ok ? "bg-verified-500" : "bg-danger-500"}`} />;

  return (
    <div className="mt-6">
      <div className={`flex flex-wrap items-center justify-between gap-3 rounded-lg p-5 text-lg font-semibold ${checking ? "bg-pending-50 text-pending-700" : proof?.ok ? "bg-verified-50 text-verified-700" : "bg-danger-50 text-danger-500"}`} role="status">
        <span>{checking ? "Checking core services" : proof?.ok ? "Core services operational" : "Degraded — some services are unreachable"}</span>
        <Button size="sm" variant="outline" onPress={refresh} isDisabled={checking} aria-label="Refresh status"><RefreshCw className={`size-4 ${checking ? "animate-spin" : ""}`} />Refresh</Button>
      </div>
      {rows.length > 0 && <ul className="card mt-6 divide-y divide-line">
        {rows.map(([name, ok, note]) => <li key={name} className="flex items-center justify-between gap-4 px-5 py-3"><span className="flex items-center gap-3"><Dot ok={ok} />{name}</span><span className="text-right text-sm text-ink-3">{note}</span></li>)}
      </ul>}
      {error && <p className="mt-3 rounded-md bg-danger-50 px-4 py-3 text-sm text-danger-500" role="alert">{error}</p>}
      <h2 className="mt-10 font-display text-2xl font-bold">Integrations</h2>
      <p className="mt-1 text-sm text-ink-2"><code>demo</code> means simulated, <code>configured unverified</code> means credentials exist but production proof is incomplete, and only <code>live</code> means an approved end-to-end connection has been verified.</p>
      {proof ? <ul className="mt-4 grid gap-2 sm:grid-cols-2 lg:grid-cols-4">{Object.entries(proof.providers).map(([name, provider]) => <li key={name} className="card flex items-center justify-between gap-3 px-4 py-3 text-sm"><span className="font-medium">{name}</span><span className={`rounded-pill px-2 py-0.5 text-right text-xs font-semibold ${provider.state === "live" ? "bg-verified-50 text-verified-700" : provider.state === "misconfigured" ? "bg-danger-50 text-danger-500" : provider.state === "demo" || provider.state === "sandbox" ? "bg-pending-50 text-pending-700" : "bg-surface-2 text-ink-2"}`}>{provider.state.replaceAll("_", " ")}</span></li>)}</ul> : <div className="mt-4 h-24 animate-pulse rounded-lg bg-surface-2" aria-label="Loading integration status" />}
      <p className="mt-8 text-xs text-ink-3">{proof ? `Checked ${new Date(proof.checkedAt).toLocaleString("en-IN", { timeZone: "Asia/Kolkata" })} IST · build ${proof.deployment.commit}` : "Connecting to live services…"} · Incidents: status@applyonce.in</p>
    </div>
  );
}
