import { Chip } from "@/components/client-ui";
import { db, t, desc } from "@applyonce/db";
import { PageHeader } from "@applyonce/ui";
import { providerModes } from "@/components/admin/data";
export const dynamic = "force-dynamic";
const JOB = { queued: "default", running: "accent", succeeded: "success", failed: "danger" } as const;
export default async function ProvidersAdmin() {
  const jobs = await db.select().from(t.verificationJobs).orderBy(desc(t.verificationJobs.createdAt)).limit(20);
  return (
    <>
      <PageHeader title="Provider readiness" subtitle="Operational truth per connector. A configured provider is not labelled live until its approved-scope end-to-end check is recorded." />
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">{providerModes().map((p) => <div key={p.name} className="card p-4"><div className="flex items-start justify-between gap-3"><div><div className="text-xs text-ink-3">{p.env} · {p.mode}</div><div className="mt-1 font-semibold">{p.label}</div></div><Chip size="sm" color={p.state === "live" ? "success" : p.state === "misconfigured" ? "danger" : p.state === "demo" || p.state === "sandbox" ? "warning" : "default"}>{p.state.replaceAll("_", " ")}</Chip></div><p className="mt-2 text-xs text-ink-2">{p.capabilities.join(" · ")}</p>{p.blocker && <p className="mt-2 text-xs text-ink-3">{p.blocker}</p>}{p.onboardingUrl && <a className="mt-3 inline-flex text-xs font-semibold text-brand-700 hover:underline" href={p.onboardingUrl} target="_blank" rel="noreferrer">Official onboarding ↗</a>}</div>)}</div>
      <h2 className="mb-2 mt-8 font-display text-lg font-bold">Recent jobs</h2>
      <div className="card overflow-x-auto"><table className="w-full min-w-[720px] text-sm">
        <thead><tr className="border-b border-line text-left text-xs uppercase tracking-[0.04em] text-ink-3"><th className="px-4 py-3">Job</th><th className="px-4 py-3">Provider · kind</th><th className="px-4 py-3">Profile</th><th className="px-4 py-3">Status</th><th className="px-4 py-3">Step</th><th className="px-4 py-3">Created</th></tr></thead>
        <tbody>{jobs.length === 0 ? <tr><td colSpan={6} className="px-4 py-6 text-center text-ink-2">No verification jobs yet.</td></tr> : jobs.map((j) => <tr key={j.id} className="border-b border-line last:border-0"><td className="px-4 py-3 font-mono text-xs">{j.id.slice(0, 8)}</td><td className="px-4 py-3">{j.provider} · {j.kind}</td><td className="px-4 py-3 font-mono text-xs">{j.profileId.slice(0, 8)}</td><td className="px-4 py-3"><Chip size="sm" color={JOB[j.status]}>{j.status}</Chip>{j.error && <div className="text-xs text-danger-500">{j.error}</div>}</td><td className="px-4 py-3">{j.progress?.step} · {j.progress?.pct ?? 0}%</td><td className="px-4 py-3">{j.createdAt.toLocaleString("en-IN", { timeZone: "Asia/Kolkata" })}</td></tr>)}</tbody>
      </table></div>
    </>
  );
}
