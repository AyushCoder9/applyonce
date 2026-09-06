import { Chip } from "@/components/client-ui";
import { db, t, desc, eq, count } from "@praman/db";
import { PageHeader, fmtDate } from "@praman/ui";
import { PartnerStatus } from "@/components/admin/actions";
export const dynamic = "force-dynamic";
const COLOR = { pending: "warning", verified: "success", suspended: "danger" } as const;
export default async function PartnersAdmin() {
  const rows = await db.select({ p: t.partners, forms: count(t.forms.id) }).from(t.partners).leftJoin(t.forms, eq(t.forms.partnerId, t.partners.id)).groupBy(t.partners.id).orderBy(desc(t.partners.createdAt));
  return (
    <>
      <PageHeader title="Partners" subtitle="Approve institutions before their live keys work. Sandbox keys work while pending." />
      <div className="card overflow-x-auto"><table className="w-full min-w-[720px] text-sm">
        <thead><tr className="border-b border-line text-left text-xs uppercase tracking-[0.04em] text-ink-3"><th className="px-4 py-3">Partner</th><th className="px-4 py-3">Kind</th><th className="px-4 py-3">DPO</th><th className="px-4 py-3">Forms</th><th className="px-4 py-3">Status</th><th className="px-4 py-3">Since</th><th className="px-4 py-3"></th></tr></thead>
        <tbody>{rows.map(({ p, forms }) => <tr key={p.id} className="border-b border-line last:border-0"><td className="px-4 py-3"><div className="font-medium">{p.name}</div><div className="text-xs text-ink-3">{p.slug} · {p.website}</div></td><td className="px-4 py-3">{p.kind}</td><td className="px-4 py-3">{p.dpoEmail ?? "—"}</td><td className="px-4 py-3 tabular">{forms}</td><td className="px-4 py-3"><Chip size="sm" color={COLOR[p.status]}>{p.status}</Chip></td><td className="px-4 py-3">{fmtDate(p.createdAt)}</td><td className="px-4 py-3"><PartnerStatus id={p.id} status={p.status} /></td></tr>)}</tbody>
      </table></div>
    </>
  );
}
