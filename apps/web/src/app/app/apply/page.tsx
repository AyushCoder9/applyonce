import Link from "next/link";
import { Puzzle, Search, Send } from "lucide-react";
import { db, t, eq, desc } from "@praman/db";
import { PageHeader, EmptyState, daysUntil, purposeLabel, fmtDate } from "@praman/ui";
import { requireUser } from "@/lib/session";
import { KIND_LABEL } from "@/components/applications/model";

export const metadata = { title: "Apply" };

export default async function ApplyPage({ searchParams }: { searchParams: Promise<{ q?: string }> }) {
  const s = await requireUser("/app/apply");
  const { q = "" } = await searchParams;
  const locale = (s.user as { locale?: string }).locale === "hi" ? "hi" : "en";
  const rows = await db.select({ f: t.forms, p: { name: t.partners.name, status: t.partners.status, logoUrl: t.partners.logoUrl, kind: t.partners.kind } }).from(t.forms).innerJoin(t.partners, eq(t.forms.partnerId, t.partners.id)).where(eq(t.forms.status, "live")).orderBy(desc(t.forms.createdAt));
  const needle = q.trim().toLowerCase();
  const forms = rows.filter((r) => !needle || `${r.f.name} ${r.p.name} ${r.f.description ?? ""} ${KIND_LABEL[r.f.kind]}`.toLowerCase().includes(needle));
  const groups = Object.entries(forms.reduce<Record<string, typeof forms>>((acc, r) => ((acc[r.f.kind] ??= []).push(r), acc), {}));
  return (
    <>
      <PageHeader title="Apply with Praman" subtitle="Pick a form. You’ll see exactly which fields it asks for before anything is shared." />
      <form className="mb-6 flex max-w-lg items-center gap-2 rounded-pill border border-line bg-surface px-4 py-2" role="search">
        <Search className="size-4 text-ink-3" /><input name="q" defaultValue={q} placeholder="Search exam, college, bank…" aria-label="Search forms" className="w-full bg-transparent text-[15px] outline-none" />
      </form>
      {!forms.length ? (
        <EmptyState icon={<Send className="size-6" />} title={needle ? `Nothing for “${q}”` : "No forms are open right now"} blurb="Portals that don’t use Praman yet can still be filled with the extension." action={<Link href="/app/extension" className="cta px-5 py-2.5">Set up the extension</Link>} />
      ) : groups.map(([kind, list]) => (
        <section key={kind} className="mb-8">
          <h2 className="mb-3 font-display text-xl font-bold">{KIND_LABEL[kind] ?? kind}</h2>
          <div className="grid gap-3 sm:grid-cols-2">
            {list.map(({ f, p }) => { const dl = daysUntil(f.deadlineAt); return (
              <article key={f.id} className="card flex flex-col gap-3 p-5" data-testid="apply-card">
                <div className="flex items-start gap-3">
                  {p.logoUrl ? <img src={p.logoUrl} alt="" className="size-10 rounded-md border border-line object-contain" /> : <div className="grid size-10 shrink-0 place-items-center rounded-md bg-brand-50 font-display font-bold text-brand-700">{p.name.slice(0, 1)}</div>}
                  <div className="min-w-0"><div className="flex flex-wrap items-center gap-2"><span className="text-sm text-ink-2">{p.name}</span>{p.status === "verified" && <span className="rounded-pill bg-verified-50 px-2 py-0.5 text-xs font-medium text-verified-700">Verified org</span>}</div><h3 className="font-display text-lg font-bold leading-tight">{f.name}</h3></div>
                </div>
                {f.description && <p className="text-sm text-ink-2">{f.description}</p>}
                <div className="flex flex-wrap gap-2 text-xs">
                  <span className="rounded-pill bg-surface-2 px-2 py-0.5">{purposeLabel(f.purpose, locale)}</span>
                  <span className="rounded-pill bg-surface-2 px-2 py-0.5">{f.requestedFields.length} fields</span>
                  {f.deadlineAt && <span className={`rounded-pill px-2 py-0.5 ${dl != null && dl <= 7 ? "bg-danger-50 text-danger-500" : "bg-pending-50 text-pending-700"}`}>{dl != null && dl < 0 ? "Closed" : dl === 0 ? "Closes today" : `${dl} days left · ${fmtDate(f.deadlineAt, locale)}`}</span>}
                </div>
                <div className="mt-auto flex items-center justify-between gap-2">
                  <span className="text-xs text-ink-3">Keeps data {f.retentionDays} days</span>
                  {dl != null && dl < 0 ? <span className="text-sm text-ink-3">Deadline passed</span> : <Link href={`/app/apply/${f.slug}`} className="cta px-4 py-2 text-sm" data-testid="apply-with-praman">Apply with Praman</Link>}
                </div>
              </article>
            ); })}
          </div>
        </section>
      ))}
      <section className="card flex flex-col items-start gap-3 p-5 sm:flex-row sm:items-center">
        <div className="grid size-11 shrink-0 place-items-center rounded-md bg-accent-50 text-accent-600"><Puzzle className="size-6" /></div>
        <div className="flex-1"><h3 className="font-display text-lg font-bold">Open a portal with the extension</h3><p className="text-sm text-ink-2">NTA, NSP, state portals — the Praman extension fills their forms from your vault, field by field.</p></div>
        <Link href="/app/extension" className="rounded-pill border border-line px-4 py-2 text-sm font-medium hover:bg-surface-2">Set up</Link>
      </section>
    </>
  );
}
