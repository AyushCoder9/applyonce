import Link from "next/link";
import { notFound } from "next/navigation";
import { Lock } from "lucide-react";
import { db, t, eq, systemDek, mask } from "@applyonce/db";
import { decryptString } from "@applyonce/crypto";
import { field, type ApplyOncePayload } from "@applyonce/schema";
import { PageHeader, FactRow, PartnerIdentity, fmtDate } from "@applyonce/ui";
import { requireUser, requireProfileAccess, isSteppedUp } from "@/lib/session";
import { decodeJws } from "@/lib/signing";
import { RevokeButton, RevealButton } from "@/components/applications/consent-actions";

/** Exactly what the partner received. Sensitive values masked until the session is stepped-up. */
export default async function ConsentPage({ params }: { params: Promise<{ consentId: string }> }) {
  const { consentId } = await params;
  const s = await requireUser(`/app/connections/${consentId}`);
  const c = await db.query.consents.findFirst({ where: eq(t.consents.id, consentId) });
  if (!c) notFound();
  await requireProfileAccess(s, c.profileId);
  const partner = (await db.query.partners.findFirst({ where: eq(t.partners.id, c.partnerId) }))!;
  const form = c.formId ? await db.query.forms.findFirst({ where: eq(t.forms.id, c.formId) }) : null;
  const share = await db.query.shares.findFirst({ where: eq(t.shares.consentId, c.id) });
  const payload = share ? decodeJws<ApplyOncePayload>(decryptString(systemDek(), share.payloadEnc, `share:${share.id}`)) : null;
  const revealed = isSteppedUp(s);
  const locale = (s.user as { locale?: string }).locale === "hi" ? "hi" : "en";
  const st = c.revokedAt ? "revoked" : c.expiresAt.getTime() < Date.now() ? "expired" : "active";
  const hasSensitive = payload?.facts.some((f) => { try { return field(f.key).sensitive; } catch { return false; } });
  return (
    <>
      <PageHeader back={{ href: "/app/connections", label: "Connections" }} eyebrow="Consent receipt" title={form?.name ?? partner.name}
        subtitle={<span className="inline-flex flex-wrap items-center gap-2"><span className={`rounded-pill px-2.5 py-0.5 text-sm font-medium ${st === "active" ? "bg-verified-50 text-verified-700" : st === "revoked" ? "bg-danger-50 text-danger-500" : "bg-surface-2 text-ink-2"}`} data-testid="consent-status">{st}</span><span className="text-sm">Consent ID <code className="font-mono" data-testid="consent-id">{c.id}</code></span></span>}
        actions={<div className="flex gap-2">{share?.applicationId && <Link href={`/app/applications/${share.applicationId}`} className="rounded-pill border border-line px-4 py-2 text-sm font-medium hover:bg-surface-2">Application</Link>}{st === "active" && <RevokeButton consentId={c.id} partnerName={partner.name} />}</div>} />
      <div className="grid gap-6 lg:grid-cols-[1fr_300px]">
        <div className="grid gap-4">
          <PartnerIdentity partner={{ name: partner.name, kind: partner.kind, logoUrl: partner.logoUrl, website: partner.website, verified: partner.status === "verified" }} purpose={c.purpose} retentionDays={form?.retentionDays ?? Math.round((c.expiresAt.getTime() - c.grantedAt.getTime()) / 864e5)} locale={locale} />
          {!payload ? (
            <div className="card p-5 text-ink-2">No payload was generated for this consent.</div>
          ) : (
            <section className="card p-5">
              <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
                <div><h2 className="font-display text-lg font-bold">{payload.facts.length} fields shared</h2><p className="text-sm text-ink-2">Signed payload · hash <code className="font-mono text-xs">{share!.payloadHash.slice(0, 16)}…</code>{share!.exchangedAt ? ` · collected by ${partner.name} ${fmtDate(share!.exchangedAt)}` : " · not collected yet"}</p></div>
                {hasSensitive && !revealed && <RevealButton phone={(s.user as { phoneNumber?: string | null }).phoneNumber ?? null} />}
              </div>
              {hasSensitive && !revealed && <p className="mb-3 inline-flex items-center gap-1 rounded-md bg-surface-2 px-3 py-2 text-sm text-ink-2"><Lock className="size-4" />Sensitive values are masked. Reveal needs a fresh OTP or passkey.</p>}
              <div data-testid="shared-facts">
                {payload.facts.map((f) => { const sensitive = (() => { try { return field(f.key).sensitive; } catch { return false; } })(); return <FactRow key={f.key} locale={locale} fact={{ key: f.key, value: sensitive && !revealed ? mask(f.key, f.value) : f.value, repeatIndex: f.repeatIndex ?? 0, source: f.source, verifiedBy: f.verifiedBy, verifiedAt: f.verifiedAt }} />; })}
              </div>
              {Object.keys(payload.custom ?? {}).length > 0 && (
                <div className="mt-5"><h3 className="mb-2 text-xs font-semibold uppercase tracking-[0.04em] text-ink-3">Answers to {partner.name}’s questions</h3>
                  <dl className="grid gap-1 text-sm">{Object.entries(payload.custom).map(([k, v]) => <div key={k} className="flex gap-3 border-b border-line py-2 last:border-0"><dt className="w-40 shrink-0 text-ink-2">{form?.customFields.find((x) => x.id === k)?.label ?? k}</dt><dd className="font-medium">{String(v)}</dd></div>)}</dl>
                </div>
              )}
            </section>
          )}
        </div>
        <aside className="grid content-start gap-4 text-sm">
          <div className="card p-4"><div className="text-xs uppercase tracking-[0.04em] text-ink-3">Granted</div><div className="font-medium">{fmtDate(c.grantedAt)}</div><div className="text-ink-2">by {c.stepUpMethod === "passkey" ? "passkey" : "OTP"} confirmation{payload?.profile.guardian_acting ? " · as guardian" : ""}</div></div>
          <div className="card p-4"><div className="text-xs uppercase tracking-[0.04em] text-ink-3">{st === "revoked" ? "Revoked" : "Expires"}</div><div className="font-medium">{fmtDate(st === "revoked" ? c.revokedAt : c.expiresAt)}</div><div className="text-ink-2">{st === "revoked" ? "Partner notified via webhook." : "Or the moment you revoke."}</div></div>
          <div className="card p-4"><div className="text-xs uppercase tracking-[0.04em] text-ink-3">Scope</div><div className="font-medium">{c.scope.length} fields</div><div className="text-ink-2">Every share is checked against this scope by the database itself.</div></div>
        </aside>
      </div>
    </>
  );
}
