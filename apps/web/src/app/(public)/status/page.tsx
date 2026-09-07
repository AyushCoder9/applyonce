import type { Metadata } from "next";
import { Container } from "@/components/public/blocks";
import { pingDb, pingRedis, providerModes, workerHealth } from "@/components/admin/data";
export const metadata: Metadata = { title: "Status", description: "Live status of ApplyOnce services and integration modes." };
export const dynamic = "force-dynamic";
export default async function Status() {
  const [db, redis, worker] = await Promise.all([pingDb(), pingRedis(), workerHealth()]);
  const queueOk = redis.ok || !redis.required;
  const allOk = db.ok && queueOk && worker.ok;
  const Dot = ({ ok }: { ok: boolean }) => <span className={`inline-block size-2.5 rounded-pill ${ok ? "bg-verified-500" : "bg-danger-500"}`} />;
  return (
    <Container className="py-14 md:py-20">
      <h1 className="font-display text-4xl font-bold">Status</h1>
      <div className={`mt-6 rounded-lg p-5 text-lg font-semibold ${allOk ? "bg-verified-50 text-verified-700" : "bg-danger-50 text-danger-500"}`}><Dot ok={allOk} /> <span className="ml-2">{allOk ? "Core services operational" : "Degraded — some services are unreachable"}</span></div>
      <ul className="card mt-6 divide-y divide-line">
        {[["Web app", true, "this page rendered"], ["Database (Postgres)", db.ok, db.ok ? `${db.ms} ms` : db.error ?? "down"], [`Queue (Redis${redis.required ? "" : ", optional in sandbox"})`, queueOk, redis.ok ? `${redis.ms} ms` : redis.error ?? "down"], ["Worker", worker.ok, worker.note]].map(([n, ok, note]) => <li key={String(n)} className="flex items-center justify-between px-5 py-3"><span className="flex items-center gap-3"><Dot ok={!!ok} />{n}</span><span className="text-sm text-ink-3">{note}</span></li>)}
      </ul>
      <h2 className="mt-10 font-display text-2xl font-bold">Integrations</h2>
      <p className="mt-1 text-sm text-ink-2">Mode per provider. <code>mock</code> = simulated for demo; <code>setu</code> = sandbox/live via API Setu.</p>
      <ul className="mt-4 grid gap-2 sm:grid-cols-2 lg:grid-cols-4">{providerModes().map((p) => <li key={p.name} className="card flex items-center justify-between px-4 py-3 text-sm"><span className="font-medium">{p.name}</span><span className={`rounded-pill px-2 py-0.5 text-xs font-semibold ${p.mode === "mock" ? "bg-surface-2 text-ink-2" : "bg-verified-50 text-verified-700"}`}>{p.mode}</span></li>)}</ul>
      <p className="mt-8 text-xs text-ink-3">Checked at {new Date().toLocaleString("en-IN", { timeZone: "Asia/Kolkata" })} IST · v0.9 · Incidents: status@applyonce.in</p>
    </Container>
  );
}
