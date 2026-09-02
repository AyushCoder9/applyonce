import { Chip } from "@heroui/react";
import { db, t, desc } from "@praman/db";
import { PageHeader } from "@praman/ui";
import { providerModes } from "@/components/admin/data";
export const dynamic = "force-dynamic";
const JOB = { queued: "default", running: "accent", succeeded: "success", failed: "danger" } as const;
export default async function ProvidersAdmin() {
  const jobs = await db.select().from(t.verificationJobs).orderBy(desc(t.verificationJobs.createdAt)).limit(20);
  return (
    <>
      <PageHeader title="Providers" subtitle="Env mode per provider (PROVIDER_*) and the last 20 verification jobs." />
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">{providerModes().map((p) => <div key={p.name} className="card p-4"><div className="text-xs text-ink-3">{p.env}</div><div className="mt-1 flex items-center justify-between"><span className="font-semibold">{p.name}</span><Chip size="sm" color={p.mode === "mock" ? "default" : "success"}>{p.mode}</Chip></div></div>)}</div>
      <h2 className="mb-2 mt-8 font-display text-lg font-bold">Recent jobs</h2>
      <div className="card overflow-x-auto"><table className="w-full min-w-[720px] text-sm">
        <thead><tr className="border-b border-line text-left text-xs uppercase tracking-[0.04em] text-ink-3"><th className="px-4 py-3">Job</th><th className="px-4 py-3">Provider · kind</th><th className="px-4 py-3">Profile</th><th className="px-4 py-3">Status</th><th className="px-4 py-3">Step</th><th className="px-4 py-3">Created</th></tr></thead>
        <tbody>{jobs.length === 0 ? <tr><td colSpan={6} className="px-4 py-6 text-center text-ink-2">No verification jobs yet.</td></tr> : jobs.map((j) => <tr key={j.id} className="border-b border-line last:border-0"><td className="px-4 py-3 font-mono text-xs">{j.id.slice(0, 8)}</td><td className="px-4 py-3">{j.provider} · {j.kind}</td><td className="px-4 py-3 font-mono text-xs">{j.profileId.slice(0, 8)}</td><td className="px-4 py-3"><Chip size="sm" color={JOB[j.status]}>{j.status}</Chip>{j.error && <div className="text-xs text-danger-500">{j.error}</div>}</td><td className="px-4 py-3">{j.progress?.step} · {j.progress?.pct ?? 0}%</td><td className="px-4 py-3">{j.createdAt.toLocaleString("en-IN")}</td></tr>)}</tbody>
      </table></div>
    </>
  );
}
