import { Chip } from "@/components/client-ui";
import { db, t, desc, and, eq, or, dsql } from "@applyonce/db";
import { PageHeader } from "@applyonce/ui";
export const dynamic = "force-dynamic";
export default async function AuditAdmin({ searchParams }: { searchParams: Promise<{ actor?: string; action?: string; target?: string }> }) {
  const q = await searchParams;
  const conds = [];
  if (q.actor) conds.push(or(eq(t.auditLog.actorUserId, q.actor), dsql`${t.auditLog.actorPartnerId}::text = ${q.actor}`));
  if (q.action) conds.push(dsql`${t.auditLog.action} ILIKE ${`%${q.action}%`}`);
  if (q.target) conds.push(or(dsql`${t.auditLog.targetType} ILIKE ${`%${q.target}%`}`, dsql`${t.auditLog.targetId} ILIKE ${`%${q.target}%`}`));
  const rows = await db.select().from(t.auditLog).where(conds.length ? and(...conds) : undefined).orderBy(desc(t.auditLog.id)).limit(200);
  const inp = "rounded-md border border-line bg-surface px-3 py-2 text-sm";
  return (
    <>
      <PageHeader title="Audit log" subtitle="Hash-chained, append-only. Last 200 matching rows." />
      <form className="mb-4 flex flex-wrap gap-2"><input name="actor" defaultValue={q.actor} placeholder="Actor user/partner id" className={inp} /><input name="action" defaultValue={q.action} placeholder="Action contains…" className={inp} /><input name="target" defaultValue={q.target} placeholder="Target type or id" className={inp} /><button className="rounded-pill bg-brand-500 px-4 py-2 text-sm font-semibold text-white">Search</button></form>
      <div className="card overflow-x-auto"><table className="w-full min-w-[900px] text-sm">
        <thead><tr className="border-b border-line text-left text-xs uppercase tracking-[0.04em] text-ink-3"><th className="px-4 py-3">#</th><th className="px-4 py-3">At</th><th className="px-4 py-3">Actor</th><th className="px-4 py-3">Action</th><th className="px-4 py-3">Target</th><th className="px-4 py-3">Meta</th><th className="px-4 py-3">Hash</th></tr></thead>
        <tbody>{rows.map((r) => <tr key={r.id} className="border-b border-line align-top last:border-0"><td className="px-4 py-2 tabular">{r.id}</td><td className="px-4 py-2 whitespace-nowrap">{r.at.toLocaleString("en-IN", { timeZone: "Asia/Kolkata" })}</td><td className="px-4 py-2 font-mono text-xs">{r.actorUserId ?? (r.actorPartnerId ? `partner:${r.actorPartnerId.slice(0, 8)}` : "system")}</td><td className="px-4 py-2"><Chip size="sm" variant="soft">{r.action}</Chip></td><td className="px-4 py-2 font-mono text-xs">{r.targetType}{r.targetId ? `/${r.targetId.slice(0, 12)}` : ""}</td><td className="px-4 py-2"><code className="block max-w-xs truncate text-xs" title={JSON.stringify(r.meta)}>{JSON.stringify(r.meta)}</code></td><td className="px-4 py-2 font-mono text-xs text-ink-3">{r.hash.slice(0, 10)}</td></tr>)}{rows.length === 0 && <tr><td colSpan={7} className="px-4 py-6 text-center text-ink-2">Nothing matches.</td></tr>}</tbody>
      </table></div>
    </>
  );
}
