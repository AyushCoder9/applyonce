"use client";
import { BadgeCheck, Building2, CalendarClock, Clock } from "lucide-react";
import { Button, Chip } from "@heroui/react";
import { SECTION_META, field, type FieldDiffRow, type Purpose, type Section } from "@applyonce/schema";
import { FieldDiff } from "./field-diff";
import { purposeLabel, initials, cx, type Locale } from "./format";

export interface ConsentPartner { name: string; kind?: string; logoUrl?: string | null; website?: string | null; verified: boolean }
export interface ConsentSummary { requested: number; verified: number; extracted: number; self: number; missing: number; blocked: number }

/** Who’s asking — always at the top, never buried (Google/Apple OAuth convention). */
export function PartnerIdentity({ partner, purpose, retentionDays, locale = "en", compact }: { partner: ConsentPartner; purpose: Purpose; retentionDays: number; locale?: Locale; compact?: boolean }) {
  const hi = locale === "hi";
  return (
    <div className={cx("flex items-start gap-4", compact ? "" : "card p-5")} data-testid="partner-identity">
      {partner.logoUrl ? <img src={partner.logoUrl} alt="" className="size-14 shrink-0 rounded-md border border-line object-contain" /> : <div className="grid size-14 shrink-0 place-items-center rounded-md bg-brand-50 font-display text-xl font-bold text-brand-700">{initials(partner.name) || <Building2 className="size-6" />}</div>}
      <div className="min-w-0">
        <div className="flex flex-wrap items-center gap-2"><span className="font-display text-xl font-bold leading-tight">{partner.name}</span>
          {partner.verified ? <Chip color="success" size="sm"><span className="inline-flex items-center gap-1"><BadgeCheck className="size-3.5" />{hi ? "सत्यापित संस्था" : "Verified organisation"}</span></Chip> : <Chip color="warning" size="sm">{hi ? "सत्यापन लंबित" : "Verification pending"}</Chip>}
        </div>
        <dl className="mt-2 grid gap-1 text-sm text-ink-2">
          <div className="flex gap-2"><dt className="w-20 shrink-0 text-ink-3">{hi ? "उद्देश्य" : "Purpose"}</dt><dd className="font-medium text-ink">{purposeLabel(purpose, locale)}</dd></div>
          <div className="flex gap-2"><dt className="w-20 shrink-0 text-ink-3">{hi ? "अवधि" : "Keeps for"}</dt><dd className="inline-flex items-center gap-1"><CalendarClock className="size-4 text-ink-3" />{retentionDays} {hi ? "दिन" : "days"}</dd></div>
          <div className="flex gap-2"><dt className="w-20 shrink-0 text-ink-3">{hi ? "वैधता" : "Valid"}</dt><dd className="inline-flex items-center gap-1"><Clock className="size-4 text-ink-3" />{hi ? "जब तक आप रद्द नहीं करते" : "until you revoke it"}</dd></div>
        </dl>
      </div>
    </div>
  );
}

export function ConsentSummaryChips({ s, locale = "en" }: { s: ConsentSummary; locale?: Locale }) {
  const hi = locale === "hi";
  return (
    <div className="flex flex-wrap gap-2" data-testid="consent-summary">
      <Chip size="sm" variant="secondary">{s.requested} {hi ? "अनुरोधित" : "requested"}</Chip>
      <Chip size="sm" color="success">{s.verified} {hi ? "सत्यापित" : "verified"}</Chip>
      {s.extracted > 0 && <Chip size="sm" color="accent">{s.extracted} {hi ? "दस्तावेज़ से" : "from documents"}</Chip>}
      {s.self > 0 && <Chip size="sm" color="warning">{s.self} {hi ? "स्व-घोषित" : "self-declared"}</Chip>}
      {s.missing > 0 && <Chip size="sm" color="danger">{s.missing} {hi ? "अनुपलब्ध" : "missing"}</Chip>}
      {s.blocked > 0 && <Chip size="sm" variant="secondary">{s.blocked} {hi ? "साझा नहीं होंगे" : "won’t be shared"}</Chip>}
    </div>
  );
}

/** Field list grouped by section, one row per field (Singpass/MyInfo pattern). Optional rows carry their own toggle. */
export function ConsentFieldList({ rows, locale = "en", selected, onToggle }: { rows: FieldDiffRow[]; locale?: Locale; selected?: Set<string>; onToggle?: (key: string) => void }) {
  const groups = SECTION_META.map((s) => ({ s, rows: rows.filter((r) => sectionOf(r.key) === s.id) })).filter((g) => g.rows.length);
  return (
    <div className="grid gap-5">
      {groups.map(({ s, rows: rs }) => (
        <section key={s.id}>
          <h3 className="mb-2 text-xs font-semibold uppercase tracking-[0.04em] text-ink-3">{s.label[locale]} · {rs.length}</h3>
          <FieldDiff rows={rs} locale={locale} selected={selected} onToggle={onToggle} />
        </section>
      ))}
    </div>
  );
}
const sectionOf = (key: string): Section | null => { try { return field(key).section; } catch { return null; } };

/** Two buttons, both fully legible: Share (accent) and Deny (outline). Never a ghosted cancel. */
export function ConsentActions({ onShare, onDeny, shareLabel, denyLabel, busy, disabled, locale = "en", hint }: { onShare: () => void; onDeny: () => void; shareLabel?: string; denyLabel?: string; busy?: boolean; disabled?: boolean; locale?: Locale; hint?: string }) {
  const hi = locale === "hi";
  return (
    <div className="sticky bottom-0 -mx-4 border-t border-line bg-surface/95 px-4 pt-3 pb-4 backdrop-blur sm:static sm:mx-0 sm:border-0 sm:bg-transparent sm:p-0 safe-bottom">
      {hint && <p className="mb-2 text-center text-xs text-ink-3">{hint}</p>}
      <div className="grid grid-cols-2 gap-3">
        <Button variant="outline" size="lg" onPress={onDeny} isDisabled={busy} data-testid="consent-deny">{denyLabel ?? (hi ? "मना करें" : "Deny")}</Button>
        <Button size="lg" className="cta" onPress={onShare} isDisabled={disabled || busy} isPending={busy} data-testid="consent-share">{shareLabel ?? (hi ? "साझा करें" : "Share")}</Button>
      </div>
    </div>
  );
}

/** Receipt: the consent_id the citizen can look up later under Connections. */
export function ConsentReceipt({ consentId, partnerName, fields, locale = "en", href }: { consentId: string; partnerName: string; fields: number; locale?: Locale; href?: string }) {
  const hi = locale === "hi";
  return (
    <div className="card p-6 text-center stamp" data-testid="consent-receipt">
      <div className="mx-auto grid size-14 place-items-center rounded-pill bg-verified-50 text-verified-700"><BadgeCheck className="size-8" /></div>
      <h2 className="mt-3 font-display text-2xl font-bold">{hi ? `${partnerName} के साथ साझा किया गया` : `Shared with ${partnerName}`}</h2>
      <p className="mt-1 text-ink-2">{fields} {hi ? "फ़ील्ड, आपकी सहमति से" : "fields, with your consent"}</p>
      <div className="mt-4 rounded-md bg-surface-2 px-3 py-2 text-left"><div className="text-xs uppercase tracking-[0.04em] text-ink-3">Consent ID</div><code className="font-mono text-sm break-all" data-testid="consent-id">{consentId}</code></div>
      {href && <a href={href} className="mt-3 inline-block text-sm text-brand-600 underline">{hi ? "कनेक्शन में देखें" : "View under Connections"}</a>}
    </div>
  );
}
