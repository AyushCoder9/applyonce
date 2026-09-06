import { notFound } from "next/navigation";
import { db, t, and, eq, count } from "@applyonce/db";
import { PageHeader, fmtDate, purposeLabel, Callout } from "@applyonce/ui";
import { requirePartnerMember } from "@/components/partner/session";
import { FormBuilder } from "@/components/partner/form-builder";
import { FormTools, CopyButton } from "@/components/partner/form-tools";
import { deploymentAppUrl } from "@/lib/urls";

export default async function FormPage({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ test?: string; tab?: string }> }) {
  const { partner } = await requirePartnerMember();
  const { id } = await params;
  const { test, tab } = await searchParams;
  const f = await db.query.forms.findFirst({ where: and(eq(t.forms.id, id), eq(t.forms.partnerId, partner.id)) });
  if (!f) notFound();
  const [{ n: applicants } = { n: 0 }] = await db.select({ n: count() }).from(t.applications).where(eq(t.applications.formId, f.id));
  const app = deploymentAppUrl();
  const html = `<form action="/api/applyonce/session" method="POST">\n  <button type="submit">Apply with ApplyOnce</button>\n</form>\n<!-- Your server creates the session, stores a state nonce,\n     then redirects to share_url with HTTP 303. -->`;
  const node = `import { createApplyOnce } from "@applyonce/sdk";\nconst applyonce = createApplyOnce({ apiKey: process.env.APPLYONCE_API_KEY!, baseUrl: "${app}" });\n\n// POST /api/applyonce/session\nconst { share_url } = await applyonce.createShareSession({ formSlug: "${f.slug}", returnUrl: "${f.redirectUrl}", state: cartId });\n\n// on ${f.redirectUrl}?share_token=…\nconst { payload, consent_id, application_id } = await applyonce.exchange(shareToken);`;
  const curl = `curl -X POST ${app}/api/v1/partner/share-sessions \\\n  -H "Authorization: Bearer pk_sandbox_…" -H "Content-Type: application/json" \\\n  -d '{"form_slug":"${f.slug}","return_url":"${f.redirectUrl}","state":"abc"}'`;
  const tabs = [["embed", "Embed"], ["edit", "Edit"], ["versions", "Versions"]] as const;
  const active = tab ?? "embed";
  return (
    <>
      <PageHeader back={{ href: "/partner/forms", label: "Forms" }} eyebrow={`${purposeLabel(f.purpose)} · v${f.version} · ${f.status}`} title={f.name} subtitle={`${f.requestedFields.length} fields · ${f.customFields.length} questions · ${applicants} applicant${applicants === 1 ? "" : "s"} · keeps data ${f.retentionDays} days${f.deadlineAt ? ` · closes ${fmtDate(f.deadlineAt)}` : ""}`} actions={<FormTools formId={f.id} status={f.status} />} />
      {test === "returned" && <Callout tone="success" title="Test share completed">The consent flow returned here with a share_token. In production your server exchanges it within 10 minutes.</Callout>}
      <nav className="mb-6 flex gap-1 border-b border-line">{tabs.map(([k, v]) => <a key={k} href={`?tab=${k}`} className={`px-4 py-2 text-sm font-medium ${active === k ? "border-b-2 border-brand-500 text-brand-700" : "text-ink-2"}`}>{v}</a>)}</nav>
      {active === "embed" && (
        <div className="grid gap-4">
          <section className="card p-5"><div className="mb-2 flex items-center justify-between"><h2 className="font-display text-lg font-bold">1. Button on your portal</h2><CopyButton text={html} /></div><pre className="overflow-x-auto rounded-md bg-ink p-4 font-mono text-xs text-white">{html}</pre></section>
          <section className="card p-5"><div className="mb-2 flex items-center justify-between"><h2 className="font-display text-lg font-bold">2. Your server (Node)</h2><CopyButton text={node} /></div><pre className="overflow-x-auto rounded-md bg-ink p-4 font-mono text-xs text-white">{node}</pre></section>
          <section className="card p-5"><div className="mb-2 flex items-center justify-between"><h2 className="font-display text-lg font-bold">Or plain HTTP</h2><CopyButton text={curl} /></div><pre className="overflow-x-auto rounded-md bg-ink p-4 font-mono text-xs text-white">{curl}</pre><p className="mt-2 text-sm text-ink-2">Verify payloads against <a className="text-brand-600 underline" href="/api/v1/jwks">/api/v1/jwks</a> (ES256). Webhook events: share.completed · consent.revoked · application.withdrawn · verification.updated.</p></section>
        </div>
      )}
      {active === "edit" && <FormBuilder partnerName={partner.name} verified={partner.status === "verified"} initial={{ id: f.id, name: f.name, slug: f.slug, description: f.description, purpose: f.purpose, kind: f.kind, requestedFields: f.requestedFields, customFields: f.customFields, retentionDays: f.retentionDays, redirectUrl: f.redirectUrl, webhookUrl: f.webhookUrl, deadlineAt: f.deadlineAt?.toISOString() ?? null, status: f.status, version: f.version }} />}
      {active === "versions" && (
        <section className="card p-5"><h2 className="mb-2 font-display text-lg font-bold">Versions</h2>
          <ul className="divide-y divide-line text-sm"><li className="flex items-center justify-between py-2"><span>v{f.version} <span className="text-ink-3">· current</span></span><span className="text-ink-3">created {fmtDate(f.createdAt)}</span></li>{Array.from({ length: f.version - 1 }, (_, i) => <li key={i} className="flex items-center justify-between py-2 text-ink-2"><span>v{f.version - 1 - i}</span><span className="text-ink-3">superseded</span></li>)}</ul>
          <p className="mt-3 text-xs text-ink-3">Every save bumps the version; payloads carry <code className="font-mono">form_version</code> so you know which field list a citizen consented to.</p>
        </section>
      )}
    </>
  );
}
