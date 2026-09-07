import Link from "next/link";
import { StatTile, PageHeader } from "@applyonce/ui";
import { overviewStats, queueCounts, providerModes } from "@/components/admin/data";
export const dynamic = "force-dynamic";
export default async function AdminHome() {
  const [s, q] = await Promise.all([overviewStats(), queueCounts()]);
  const failedJobs = q.reduce((a, x) => a + (x.counts?.failed ?? 0), 0);
  const live = providerModes().filter((p) => p.state === "live").length;
  return (
    <>
      <PageHeader title="Overview" subtitle="ApplyOnce internal ops. Every action here is audited." />
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <StatTile label="Users" value={s.users} delta={`${s.profiles} active profiles`} />
        <StatTile label="Verified facts" value={`${s.verifiedPct}%`} delta={`${s.factsVerified} of ${s.factsTotal}`} tone="verified" />
        <StatTile label="Partners pending" value={s.partnersPending} delta="Review under Partners" tone={s.partnersPending ? "pending" : "default"} />
        <StatTile label="Verification jobs failed (24 h)" value={s.jobsFailed24h} tone={s.jobsFailed24h ? "danger" : "default"} />
        <StatTile label="Queue jobs failed" value={failedJobs} delta={q.some((x) => x.error) ? "Redis unreachable" : `${q.length} queues`} tone={failedJobs ? "danger" : "default"} />
        <StatTile label="Webhook failure rate" value={`${s.webhookFailPct}%`} delta={`${s.webhookFailed} of ${s.webhookTotal} deliveries`} tone={s.webhookFailPct > 10 ? "danger" : "default"} />
      </div>
      <div className="mt-6 flex flex-wrap gap-2 text-sm">{[["/admin/partners", "Partners"], ["/admin/providers", `Providers (${live} live)`], ["/admin/queues", "Queues"], ["/admin/flags", "Flags"], ["/admin/requests", "Data requests"], ["/admin/audit", "Audit"]].map(([h, l]) => <Link key={h} href={h!} className="rounded-pill border border-line px-3 py-1.5 hover:bg-surface-2">{l}</Link>)}</div>
    </>
  );
}
