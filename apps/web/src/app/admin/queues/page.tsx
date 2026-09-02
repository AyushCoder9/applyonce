import { Chip } from "@heroui/react";
import { PageHeader } from "@praman/ui";
import { queueCounts } from "@/components/admin/data";
export const dynamic = "force-dynamic";
const KEYS = ["waiting", "active", "delayed", "completed", "failed", "paused", "prioritized", "waiting-children"];
export default async function QueuesAdmin() {
  const q = await queueCounts();
  return (
    <>
      <PageHeader title="Queues" subtitle="BullMQ job counts per queue (live from Redis)." />
      <div className="card overflow-x-auto"><table className="w-full min-w-[720px] text-sm">
        <thead><tr className="border-b border-line text-left text-xs uppercase tracking-[0.04em] text-ink-3"><th className="px-4 py-3">Queue</th>{KEYS.map((k) => <th key={k} className="px-3 py-3 text-right">{k}</th>)}</tr></thead>
        <tbody>{q.map((x) => <tr key={x.name} className="border-b border-line last:border-0"><td className="px-4 py-3 font-medium">{x.name}{x.error && <Chip size="sm" color="danger" className="ml-2">{x.error}</Chip>}</td>{KEYS.map((k) => { const v = x.counts?.[k] ?? 0; return <td key={k} className={`px-3 py-3 text-right tabular ${k === "failed" && v ? "font-bold text-danger-500" : k === "active" && v ? "text-brand-600" : ""}`}>{x.counts ? v : "—"}</td>; })}</tr>)}</tbody>
      </table></div>
      <p className="mt-3 text-xs text-ink-3">Worker: <code>pnpm --filter @praman/worker dev</code>. Failed jobs retry 3× with exponential backoff; inspect with Bull Board later if needed.</p>
    </>
  );
}
