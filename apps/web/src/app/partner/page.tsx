import Link from "next/link";
import { db, t, eq, desc, gte, and, inArray } from "@applyonce/db";
import type { ApplyOncePayload } from "@applyonce/schema";
import { decryptString } from "@applyonce/crypto";
import { systemDek } from "@applyonce/db";
import { PageHeader, StatTile, Callout, fmtDate } from "@applyonce/ui";
import { requirePartnerMember } from "@/components/partner/session";
import { decodeJws } from "@/lib/signing";
import { STATUS_META } from "@/components/applications/model";

export const metadata = { title: "Partner overview" };

export default async function PartnerOverview() {
  const { partner } = await requirePartnerMember();
  const apps = await db.select().from(t.applications).where(eq(t.applications.partnerId, partner.id)).orderBy(desc(t.applications.createdAt));
  const today = new Date(); today.setHours(0, 0, 0, 0);
  const todayN = apps.filter((a) => a.createdAt >= today).length;
  const recentShares = apps.length ? await db.select().from(t.shares).where(inArray(t.shares.applicationId, apps.slice(0, 50).map((a) => a.id))) : [];
  let verified = 0, total = 0;
  for (const s of recentShares) { try { const p = decodeJws<ApplyOncePayload>(decryptString(systemDek(), s.payloadEnc, `share:${s.id}`)); total += p.facts.length; verified += p.facts.filter((f) => f.source === "issuer_verified" || f.source === "provider_verified").length; } catch { /* skip */ } }
  const hooks = await db.select({ id: t.partnerWebhooks.id }).from(t.partnerWebhooks).where(eq(t.partnerWebhooks.partnerId, partner.id));
  const since = new Date(Date.now() - 7 * 864e5);
  const deliveries = hooks.length ? await db.select({ status: t.webhookDeliveries.status }).from(t.webhookDeliveries).where(and(inArray(t.webhookDeliveries.webhookId, hooks.map((h) => h.id)), gte(t.webhookDeliveries.createdAt, since))) : [];
  const delivered = deliveries.filter((d) => d.status === "delivered" || d.status === "succeeded").length;
  const failed = deliveries.filter((d) => d.status === "failed").length;
  const keys = await db.select({ id: t.partnerApiKeys.id }).from(t.partnerApiKeys).where(eq(t.partnerApiKeys.partnerId, partner.id));
  const forms = await db.select({ id: t.forms.id, name: t.forms.name, status: t.forms.status }).from(t.forms).where(eq(t.forms.partnerId, partner.id));
  return (
    <>
      <PageHeader title="Overview" subtitle={`${partner.name} · ${partner.status === "verified" ? "verified organisation" : partner.status === "pending" ? "verification pending — sandbox only" : "suspended"}`} actions={<Link href="/partner/forms/new" className="cta px-5 py-2.5">New form</Link>} />
      {partner.status === "pending" && <Callout tone="warning" title="Your organisation is being verified">Sandbox keys work now. Live keys unlock after ApplyOnce checks your registration number. Usually 1–2 working days.</Callout>}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatTile label="Applicants today" value={todayN} delta={`${apps.length} total`} />
        <StatTile label="Verified fields" value={total ? `${Math.round((verified / total) * 100)}%` : "—"} delta={total ? `${verified} of ${total} in the last ${recentShares.length} shares` : "No shares yet"} tone="verified" />
        <StatTile label="Webhook health (7d)" value={deliveries.length ? `${Math.round((delivered / deliveries.length) * 100)}%` : hooks.length ? "—" : "No endpoint"} delta={deliveries.length ? `${delivered} delivered · ${failed} failed · ${deliveries.length - delivered - failed} pending` : hooks.length ? "No deliveries yet" : "Add one under Developers"} tone={failed ? "danger" : "default"} />
        <StatTile label="Live forms" value={forms.filter((f) => f.status === "live").length} delta={`${forms.length} total · ${keys.length} API key${keys.length === 1 ? "" : "s"}`} />
      </div>
      <div className="mt-8 grid gap-6 lg:grid-cols-[1fr_360px]">
        <section className="card p-5">
          <div className="mb-3 flex items-center justify-between"><h2 className="font-display text-lg font-bold">Recent applicants</h2><Link href="/partner/applicants" className="text-sm text-brand-600 underline">All applicants</Link></div>
          {!apps.length ? <p className="text-ink-2">No one has applied yet. Embed the button (Forms → your form → Embed) or test the flow from the form page.</p> : (
            <ul className="divide-y divide-line">{apps.slice(0, 8).map((a) => <li key={a.id} className="flex items-center gap-3 py-2 text-sm"><span className="flex-1 truncate">{a.title}</span><span className="text-ink-3">{fmtDate(a.createdAt)}</span><span className="rounded-pill bg-surface-2 px-2 py-0.5 text-xs">{STATUS_META[a.status].label}</span></li>)}</ul>
          )}
        </section>
        <section className="card p-5 text-sm">
          <h2 className="mb-2 font-display text-lg font-bold">Get started</h2>
          <ol className="grid list-decimal gap-2 pl-5 text-ink-2">
            <li><Link className="text-brand-600 underline" href="/partner/forms/new">Build a form</Link> — pick the fields you need from the citizen schema.</li>
            <li><Link className="text-brand-600 underline" href="/partner/developers">Create a sandbox key</Link> and add a webhook endpoint.</li>
            <li>Drop the button on your portal: <code className="font-mono text-xs">&lt;button data-applyonce-form="slug"&gt;</code></li>
            <li>Exchange the share token server-side with <code className="font-mono text-xs">@applyonce/sdk</code>; verify with <Link className="text-brand-600 underline" href="/api/v1/jwks">/api/v1/jwks</Link>.</li>
          </ol>
        </section>
      </div>
    </>
  );
}
