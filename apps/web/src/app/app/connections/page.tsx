import Link from "next/link";
import { Link2 } from "lucide-react";
import { db, t, eq, inArray, desc } from "@applyonce/db";
import { PageHeader, EmptyState, fmtDate, purposeLabel } from "@applyonce/ui";
import { requireUser, listProfiles } from "@/lib/session";
import { RevokeButton } from "@/components/applications/consent-actions";

export const metadata = { title: "Connections" };

export default async function ConnectionsPage() {
  const s = await requireUser("/app/connections");
  const { all } = await listProfiles(s.user.id);
  const locale = (s.user as { locale?: string }).locale === "hi" ? "hi" : "en";
  const ids = all.map((p) => p.id);
  const rows = ids.length ? await db.select({ c: t.consents, partner: t.partners, form: t.forms }).from(t.consents).innerJoin(t.partners, eq(t.consents.partnerId, t.partners.id)).leftJoin(t.forms, eq(t.consents.formId, t.forms.id)).where(inArray(t.consents.profileId, ids)).orderBy(desc(t.consents.grantedAt)) : [];
  const status = (c: typeof t.consents.$inferSelect) => (c.revokedAt ? "revoked" : c.expiresAt.getTime() < Date.now() ? "expired" : "active");
  const active = rows.filter((r) => status(r.c) === "active").length;
  return (
    <>
      <PageHeader title="Connections" subtitle={`${active} organisation${active === 1 ? "" : "s"} can currently use your data. Every share has a consent ID you can quote.`} />
      {!rows.length ? (
        <EmptyState icon={<Link2 className="size-6" />} title="Nothing shared yet" blurb="When you apply with ApplyOnce, the exact fields you shared are listed here." action={<Link href="/app/apply" className="cta px-5 py-2.5">Find a form</Link>} />
      ) : (
        <ul className="grid gap-3">
          {rows.map(({ c, partner, form }) => { const st = status(c); const prof = all.find((p) => p.id === c.profileId); return (
            <li key={c.id} className="card flex flex-col gap-3 p-4 sm:flex-row sm:items-center" data-testid="consent-row" data-status={st}>
              <div className="grid size-11 shrink-0 place-items-center rounded-md bg-brand-50 font-display font-bold text-brand-700">{partner.name.slice(0, 1)}</div>
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2"><h3 className="font-display text-lg font-bold leading-tight">{partner.name}</h3><span className={`rounded-pill px-2 py-0.5 text-xs font-medium ${st === "active" ? "bg-verified-50 text-verified-700" : st === "revoked" ? "bg-danger-50 text-danger-500" : "bg-surface-2 text-ink-2"}`}>{st}</span>{prof && prof.kind === "dependent" && <span className="rounded-pill bg-surface-2 px-2 py-0.5 text-xs">for {prof.displayName}</span>}</div>
                <div className="text-sm text-ink-2">{form?.name ?? purposeLabel(c.purpose, locale)} · {c.scope.length} fields · {purposeLabel(c.purpose, locale)}</div>
                <div className="text-xs text-ink-3">Granted {fmtDate(c.grantedAt)} · {st === "revoked" ? `revoked ${fmtDate(c.revokedAt)}` : `expires ${fmtDate(c.expiresAt)}`} · <code className="font-mono">{c.id.slice(0, 8)}…</code></div>
              </div>
              <div className="flex shrink-0 gap-2">
                <Link href={`/app/connections/${c.id}`} className="rounded-pill border border-line px-4 py-2 text-sm font-medium hover:bg-surface-2">What was shared</Link>
                {st === "active" && <RevokeButton consentId={c.id} partnerName={partner.name} />}
              </div>
            </li>
          ); })}
        </ul>
      )}
    </>
  );
}
