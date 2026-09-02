import Link from "next/link";
import { notFound } from "next/navigation";
import { CalendarClock, ExternalLink, FileText, ShieldCheck } from "lucide-react";
import { db, t, eq, asc, desc } from "@praman/db";
import { PageHeader, ApplicationTimeline, daysUntil, fmtDate } from "@praman/ui";
import { requireUser, requireProfileAccess } from "@/lib/session";
import { STATUS_META, KIND_LABEL } from "@/components/applications/model";
import { DetailActions } from "@/components/applications/detail-actions";

export default async function ApplicationPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const s = await requireUser(`/app/applications/${id}`);
  const a = await db.query.applications.findFirst({ where: eq(t.applications.id, id) });
  if (!a) notFound();
  await requireProfileAccess(s, a.profileId);
  const events = await db.select().from(t.applicationEvents).where(eq(t.applicationEvents.applicationId, a.id)).orderBy(desc(t.applicationEvents.createdAt));
  const docs = await db.select({ id: t.documents.id, title: t.documents.title, docType: t.documents.docType, label: t.applicationDocuments.label }).from(t.applicationDocuments).innerJoin(t.documents, eq(t.applicationDocuments.documentId, t.documents.id)).where(eq(t.applicationDocuments.applicationId, a.id));
  const share = await db.query.shares.findFirst({ where: eq(t.shares.applicationId, a.id) });
  const consent = share ? await db.query.consents.findFirst({ where: eq(t.consents.id, share.consentId) }) : null;
  const requests = await db.select().from(t.verificationRequests).where(eq(t.verificationRequests.applicationId, a.id)).orderBy(asc(t.verificationRequests.createdAt));
  const m = STATUS_META[a.status];
  const d = daysUntil(a.deadlineAt);
  const partnerMsgs = events.filter((e) => e.actor === "partner");
  const tone = { default: "bg-surface-2 text-ink-2", accent: "bg-brand-50 text-brand-700", success: "bg-verified-50 text-verified-700", warning: "bg-pending-50 text-pending-700", danger: "bg-danger-50 text-danger-500" }[m.color];
  return (
    <>
      <PageHeader back={{ href: "/app/applications", label: "Track" }} eyebrow={`${a.orgName} · ${KIND_LABEL[a.kind]}`} title={a.title}
        subtitle={<span className="inline-flex flex-wrap items-center gap-2"><span className={`rounded-pill px-2.5 py-0.5 text-sm font-medium ${tone}`} data-testid="app-status">{m.label}</span>{a.externalRef && <span className="text-sm">Ref <code className="font-mono">{a.externalRef}</code></span>}{a.submittedAt && <span className="text-sm text-ink-3">submitted {fmtDate(a.submittedAt)}</span>}</span>}
        actions={a.portalUrl ? <a href={a.portalUrl} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 rounded-pill border border-line px-4 py-2 text-sm font-medium hover:bg-surface-2"><ExternalLink className="size-4" />Open portal</a> : undefined} />
      <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
        <div className="grid gap-6">
          {partnerMsgs.length > 0 && (
            <section className="card p-5"><h2 className="mb-2 font-display text-lg font-bold">From {a.orgName}</h2>
              <ul className="grid gap-2">{partnerMsgs.slice(0, 3).map((e) => <li key={e.id} className="rounded-md bg-surface-2 px-3 py-2 text-sm"><div className="font-medium">{e.title}</div>{e.body && <div className="text-ink-2">{e.body}</div>}<div className="text-xs text-ink-3">{fmtDate(e.createdAt)}</div></li>)}</ul>
            </section>
          )}
          <section className="card p-5"><h2 className="mb-4 font-display text-lg font-bold">Timeline</h2><ApplicationTimeline events={events.map((e) => ({ id: e.id, title: e.title, body: e.body, actor: e.actor, createdAt: e.createdAt, type: e.type }))} /></section>
          <section className="card p-5"><h2 className="mb-3 font-display text-lg font-bold">Your notes & actions</h2><DetailActions id={a.id} canWithdraw={!["withdrawn", "accepted", "rejected", "enrolled"].includes(a.status)} /></section>
        </div>
        <aside className="grid content-start gap-4">
          {a.deadlineAt && <div className={`card flex items-center gap-3 p-4 ${d != null && d >= 0 && d <= 7 ? "border-danger-500/40" : ""}`}><CalendarClock className="size-5 text-ink-3" /><div><div className="text-xs text-ink-3">Deadline</div><div className="font-medium">{fmtDate(a.deadlineAt)}</div><div className="text-sm text-ink-2">{d != null && d < 0 ? "Passed" : d === 0 ? "Today" : `${d} days left`}</div></div></div>}
          {consent && (
            <div className="card p-4"><div className="flex items-center gap-2 text-sm font-medium"><ShieldCheck className="size-4 text-verified-700" />What was shared</div>
              <p className="mt-1 text-sm text-ink-2">{consent.scope.length} fields · consent {consent.revokedAt ? "revoked" : consent.expiresAt.getTime() < Date.now() ? "expired" : "active"}</p>
              <Link href={`/app/connections/${consent.id}`} className="mt-2 inline-block text-sm text-brand-600 underline" data-testid="what-was-shared">See the exact payload</Link>
            </div>
          )}
          <div className="card p-4"><div className="flex items-center gap-2 text-sm font-medium"><FileText className="size-4 text-ink-3" />Documents</div>
            {docs.length ? <ul className="mt-2 grid gap-1 text-sm">{docs.map((x) => <li key={x.id}><Link href={`/app/documents/${x.id}`} className="text-brand-600 underline">{x.label ?? x.title}</Link></li>)}</ul> : <p className="mt-1 text-sm text-ink-2">{share ? "Attached evidence travels inside the signed payload." : "No documents attached."}</p>}
          </div>
          {requests.length > 0 && <div className="card p-4"><div className="text-sm font-medium">Re-verification requests</div><ul className="mt-2 grid gap-2 text-sm">{requests.map((r) => <li key={r.id}><div className="text-ink-2">{r.factKeys.join(", ")}</div><div className="text-xs text-ink-3">{r.status} · {fmtDate(r.createdAt)}</div><Link href="/app/verify" className="text-brand-600 underline">Re-verify now</Link></li>)}</ul></div>}
        </aside>
      </div>
    </>
  );
}
