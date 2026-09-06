import { Chip } from "@/components/client-ui";
import { db, t, desc, eq } from "@applyonce/db";
import { PageHeader } from "@applyonce/ui";
import { updateRequest } from "./actions";
export const dynamic = "force-dynamic";
const COLOR: Record<string, "warning" | "accent" | "success" | "danger" | "default"> = { pending: "warning", processing: "accent", done: "success", failed: "danger", cancelled: "default" };
export default async function RequestsAdmin() {
  const rows = await db.select({ r: t.dataRequests, u: { name: t.user.name, phone: t.user.phoneNumber } }).from(t.dataRequests).leftJoin(t.user, eq(t.user.id, t.dataRequests.userId)).orderBy(desc(t.dataRequests.requestedAt)).limit(200);
  const sla = (d: Date) => Math.max(0, 30 - Math.floor((Date.now() - d.getTime()) / 864e5));
  return (
    <>
      <PageHeader title="Data-principal requests" subtitle="DPDP access / erasure / correction. Respond within 30 days; erasure has a 30-day grace and legal-hold check." />
      <div className="card overflow-x-auto"><table className="w-full min-w-[820px] text-sm">
        <thead><tr className="border-b border-line text-left text-xs uppercase tracking-[0.04em] text-ink-3"><th className="px-4 py-3">Kind</th><th className="px-4 py-3">Who</th><th className="px-4 py-3">Requested</th><th className="px-4 py-3">SLA</th><th className="px-4 py-3">Status</th><th className="px-4 py-3">Update</th></tr></thead>
        <tbody>{rows.length === 0 ? <tr><td colSpan={6} className="px-4 py-6 text-center text-ink-2">Queue is empty.</td></tr> : rows.map(({ r, u }) => (
          <tr key={r.id} className="border-b border-line align-top last:border-0">
            <td className="px-4 py-3 font-medium capitalize">{r.kind}</td><td className="px-4 py-3">{u?.name ?? r.userId}<div className="text-xs text-ink-3">{u?.phone ?? ""}</div></td>
            <td className="px-4 py-3">{r.requestedAt.toLocaleString("en-IN")}</td><td className={`px-4 py-3 tabular ${sla(r.requestedAt) < 7 && r.status === "pending" ? "font-bold text-danger-500" : ""}`}>{r.status === "done" ? "—" : `${sla(r.requestedAt)} d left`}</td>
            <td className="px-4 py-3"><Chip size="sm" color={COLOR[r.status] ?? "default"}>{r.status}</Chip>{r.resultStorageKey && <div className="text-xs text-ink-3">{r.resultStorageKey}</div>}</td>
            <td className="px-4 py-3"><form action={updateRequest} className="flex flex-wrap gap-2"><input type="hidden" name="id" value={r.id} /><select name="status" defaultValue={r.status} className="rounded-md border border-line bg-surface px-2 py-1.5">{["pending", "processing", "done", "failed", "cancelled"].map((s) => <option key={s}>{s}</option>)}</select><input name="notes" defaultValue={r.notes ?? ""} placeholder="Notes" className="w-44 rounded-md border border-line bg-surface px-2 py-1.5" /><button type="submit" className="rounded-pill bg-brand-500 px-3 py-1.5 text-xs font-semibold text-white">Save</button></form></td>
          </tr>))}</tbody>
      </table></div>
    </>
  );
}
