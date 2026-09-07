"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { Button } from "@heroui/react";
import { CheckCircle2, Database, RefreshCw, Server, Workflow, XCircle } from "lucide-react";

type Proof = {
  ok: boolean;
  checkedAt: string;
  deployment: { commit: string; region: string };
  services: {
    database: { ok: boolean; ms: number };
    worker: { ok: boolean; note: string };
    portal: { ok: boolean; configured: boolean; redis: { ok: boolean; ms: number | null }; applyonce: { ok: boolean; commit: string | null } };
  };
  durationMs: number;
};

export function DemoSystemProof() {
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
      if (!response.ok || !data.ok) setError("One sandbox service is temporarily degraded. Refresh to check again.");
    } catch {
      setError("The live proof check could not be completed. The demo itself remains available.");
    } finally {
      setChecking(false);
    }
  }, []);

  useEffect(() => { void refresh(); }, [refresh]);

  const checks = proof ? [
    { label: "ApplyOnce API", ok: proof.services.worker.ok, detail: `${proof.deployment.region} · ${proof.deployment.commit}`, Icon: Server },
    { label: "Persistent profiles", ok: proof.services.database.ok, detail: proof.services.database.ok ? `Postgres · ${proof.services.database.ms} ms` : "Postgres unavailable", Icon: Database },
    { label: "BTA signed handoff", ok: proof.services.portal.ok, detail: proof.services.portal.redis.ok ? `Redis-backed · ${proof.services.portal.redis.ms ?? "—"} ms` : "Portal state unavailable", Icon: Workflow },
  ] : [];

  return (
    <section className="card mt-10 overflow-hidden" aria-labelledby="live-proof-title">
      <div className="flex flex-wrap items-start justify-between gap-4 border-b border-line p-5 sm:p-6">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.08em] text-brand-600">Runtime evidence</p>
          <h2 id="live-proof-title" className="mt-1 font-display text-2xl font-bold">This demo has a live backend.</h2>
          <p className="mt-1 max-w-2xl text-sm text-ink-2">A fresh check verifies the database, server-side processing and the independent BTA portal. No synthetic success status is hard-coded here.</p>
        </div>
        <div className="flex items-center gap-3">
          <span data-testid="demo-proof-status" role="status" className={`inline-flex items-center gap-2 rounded-pill px-3 py-1.5 text-sm font-semibold ${checking ? "bg-pending-50 text-pending-700" : proof?.ok ? "bg-verified-50 text-verified-700" : "bg-danger-50 text-danger-500"}`}>
            {checking ? <RefreshCw className="size-4 animate-spin" /> : proof?.ok ? <CheckCircle2 className="size-4" /> : <XCircle className="size-4" />}
            {checking ? "Checking live systems" : proof?.ok ? "Operational" : "Degraded"}
          </span>
          <Button variant="outline" size="sm" onPress={refresh} isDisabled={checking} aria-label="Refresh live backend proof"><RefreshCw className="size-4" />Refresh</Button>
        </div>
      </div>
      {proof && <div className="grid gap-px bg-line sm:grid-cols-3">{checks.map(({ label, ok, detail, Icon }) => <div key={label} className="flex items-start gap-3 bg-surface p-5" data-service={label}>
        <span className={`grid size-9 shrink-0 place-items-center rounded-lg ${ok ? "bg-verified-50 text-verified-700" : "bg-danger-50 text-danger-500"}`}><Icon className="size-4" /></span>
        <div><p className="font-semibold">{label}</p><p className="mt-0.5 font-mono text-xs text-ink-3">{detail}</p></div>
      </div>)}</div>}
      {error && <p role="alert" className="border-t border-line bg-danger-50 px-5 py-3 text-sm text-danger-500">{error}</p>}
      <div className="flex flex-wrap items-center justify-between gap-3 border-t border-line px-5 py-3 text-xs text-ink-3">
        <span>{proof ? `Checked ${new Date(proof.checkedAt).toLocaleTimeString("en-IN")} · ${proof.durationMs} ms end to end` : "Connecting to the sandbox services…"}</span>
        <Link href="/status" className="font-semibold text-brand-700 underline">Open detailed status</Link>
      </div>
    </section>
  );
}
