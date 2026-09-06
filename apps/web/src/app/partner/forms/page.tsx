import Link from "next/link";
import { FileInput } from "lucide-react";
import { db, t, eq, desc } from "@applyonce/db";
import { PageHeader, EmptyState, fmtDate, purposeLabel } from "@applyonce/ui";
import { requirePartnerMember } from "@/components/partner/session";

export const metadata = { title: "Forms" };

export default async function FormsPage() {
  const { partner } = await requirePartnerMember();
  const forms = await db.select().from(t.forms).where(eq(t.forms.partnerId, partner.id)).orderBy(desc(t.forms.createdAt));
  return (
    <>
      <PageHeader title="Forms" subtitle="Each form is a purpose plus the fields you request. Citizens see exactly this list before sharing." actions={<Link href="/partner/forms/new" className="cta px-5 py-2.5">New form</Link>} />
      {!forms.length ? <EmptyState icon={<FileInput className="size-6" />} title="No forms yet" blurb="Build one from the citizen schema — takes a few minutes." action={<Link href="/partner/forms/new" className="cta px-5 py-2.5">Build your first form</Link>} /> : (
        <ul className="grid gap-3">
          {forms.map((f) => (
            <li key={f.id}><Link href={`/partner/forms/${f.id}`} className="card flex flex-col gap-2 p-4 hover:shadow-pop sm:flex-row sm:items-center sm:gap-4" data-testid="form-row">
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2"><span className={`rounded-pill px-2 py-0.5 text-xs font-medium ${f.status === "live" ? "bg-verified-50 text-verified-700" : f.status === "draft" ? "bg-pending-50 text-pending-700" : "bg-surface-2 text-ink-2"}`}>{f.status}</span><span className="text-xs text-ink-3">v{f.version} · {purposeLabel(f.purpose)}</span></div>
                <h3 className="mt-1 font-display text-lg font-bold leading-tight">{f.name}</h3>
                <div className="text-sm text-ink-2"><code className="font-mono text-xs">{f.slug}</code> · {f.requestedFields.length} fields · {f.customFields.length} questions · keeps {f.retentionDays}d{f.deadlineAt ? ` · closes ${fmtDate(f.deadlineAt)}` : ""}</div>
              </div>
            </Link></li>
          ))}
        </ul>
      )}
    </>
  );
}
