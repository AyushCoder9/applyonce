import Link from "next/link";
import { ListChecks, CalendarClock } from "lucide-react";
import { db, t, eq, desc } from "@applyonce/db";
import { APPLICATION_STATUSES } from "@applyonce/schema";
import { PageHeader, EmptyState, daysUntil, fmtDate } from "@applyonce/ui";
import { requireUser, requireProfileAccess } from "@/lib/session";
import { STATUS_META, KIND_LABEL } from "@/components/applications/model";
import { TrackDrawer } from "@/components/applications/track-drawer";

export const metadata = { title: "Track applications" };
const StatusChip = ({ s }: { s: keyof typeof STATUS_META }) => { const m = STATUS_META[s]; const c = { default: "bg-surface-2 text-ink-2", accent: "bg-brand-50 text-brand-700", success: "bg-verified-50 text-verified-700", warning: "bg-pending-50 text-pending-700", danger: "bg-danger-50 text-danger-500" }[m.color]; return <span className={`rounded-pill px-2 py-0.5 text-xs font-medium ${c}`} data-status={s}>{m.label}</span>; };

export default async function ApplicationsPage({ searchParams }: { searchParams: Promise<{ status?: string; kind?: string }> }) {
  const s = await requireUser("/app/applications");
  const { profile } = await requireProfileAccess(s);
  const { status, kind } = await searchParams;
  const all = await db.select().from(t.applications).where(eq(t.applications.profileId, profile.id)).orderBy(desc(t.applications.updatedAt));
  const rows = all.filter((a) => (!status || a.status === status) && (!kind || a.kind === kind));
  const open = all.filter((a) => !["withdrawn", "rejected", "enrolled"].includes(a.status));
  const soon = open.filter((a) => { const d = daysUntil(a.deadlineAt); return d != null && d >= 0 && d <= 7; }).length;
  const chip = (href: string, label: string, on: boolean) => <Link key={href} href={href} className={`rounded-pill border px-3 py-1 text-sm ${on ? "border-brand-500 bg-brand-50 text-brand-700" : "border-line text-ink-2 hover:bg-surface-2"}`}>{label}</Link>;
  return (
    <>
      <PageHeader title="Track" subtitle={`${open.length} in progress${soon ? ` · ${soon} due within a week` : ""}`} actions={<TrackDrawer />} />
      <div className="mb-4 flex flex-wrap gap-2">
        {chip("/app/applications", "All", !status && !kind)}
        {APPLICATION_STATUSES.filter((x) => all.some((a) => a.status === x)).map((x) => chip(`/app/applications?status=${x}`, STATUS_META[x].label, status === x))}
        {Object.keys(KIND_LABEL).filter((k) => all.some((a) => a.kind === k)).map((k) => chip(`/app/applications?kind=${k}`, KIND_LABEL[k]!, kind === k))}
      </div>
      {!rows.length ? (
        <EmptyState icon={<ListChecks className="size-6" />} title={all.length ? "Nothing matches this filter" : "No applications yet"} blurb={all.length ? "Clear the filter to see everything." : "Apply with ApplyOnce and it lands here automatically — or add one you made elsewhere."} action={<Link href="/app/apply" className="cta px-5 py-2.5">Find a form</Link>} />
      ) : (
        <ul className="grid gap-3">
          {rows.map((a, i) => { const d = daysUntil(a.deadlineAt); return (
            <li key={a.id} className="rise" style={{ animationDelay: `${Math.min(i, 8) * 30}ms` }}>
              <Link href={`/app/applications/${a.id}`} className="card flex flex-col gap-2 p-4 transition-shadow hover:shadow-pop sm:flex-row sm:items-center sm:gap-4" data-testid="application-row">
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2"><StatusChip s={a.status} /><span className="text-xs text-ink-3">{KIND_LABEL[a.kind]} · {a.source === "sdk" ? "via ApplyOnce" : a.source === "extension" ? "via extension" : "tracked manually"}</span></div>
                  <h3 className="mt-1 font-display text-lg font-bold leading-tight">{a.title}</h3>
                  <div className="text-sm text-ink-2">{a.orgName}{a.externalRef ? ` · Ref ${a.externalRef}` : ""}</div>
                </div>
                {a.deadlineAt && !["withdrawn", "rejected", "enrolled", "accepted"].includes(a.status) && (
                  <div className={`inline-flex items-center gap-1 rounded-md px-2 py-1 text-sm ${d != null && d < 0 ? "bg-surface-2 text-ink-3" : d != null && d <= 7 ? "bg-danger-50 text-danger-500" : "bg-pending-50 text-pending-700"}`}><CalendarClock className="size-4" />{d != null && d < 0 ? "Deadline passed" : d === 0 ? "Due today" : `${d} days left`}<span className="text-xs opacity-70">· {fmtDate(a.deadlineAt)}</span></div>
                )}
              </Link>
            </li>
          ); })}
        </ul>
      )}
    </>
  );
}
