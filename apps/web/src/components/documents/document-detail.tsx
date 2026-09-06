"use client";
import { LinkButton } from "@/components/vault/link-button";
/** /app/documents/[id] — viewer (step-up), metadata, hash badge, linked facts, extraction review (accept/reject per fact, side-by-side). */
import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button, Chip, toast } from "@heroui/react";
import { ShieldCheck, FileText, Lock, ExternalLink, Check, X, AlertTriangle } from "lucide-react";
import type { Fact } from "@praman/schema";
import { FactRow, SourceChip, fmtDate, fmtValue, daysUntil, label, cx } from "@praman/ui";
import { api, tr, type Locale } from "@/components/vault/i18n";
import { useStepUp } from "@/components/vault/step-up-dialog";
import { docTypeLabel } from "./doc-types";

export interface DocDetail { id: string; title: string; docType: string; issuerName?: string | null; issuerId?: string | null; docUri?: string | null; storageKey?: string | null; mime: string; size: number; sha256?: string | null; origin: "digilocker" | "upload" | "generated"; issuedAt?: string | null; validUntil?: string | null; status: "pending" | "ready" | "rejected"; createdAt: string; meta?: Record<string, unknown> | null }
export interface Extraction { id: string; provider: string; proposedFacts: { key: string; value: unknown; confidence: number }[]; confidence?: number | null; reviewedAt?: string | null; createdAt: string }
type Current = Record<string, { value: unknown; source: Fact["source"]; verifiedBy?: string | null }>;

export function DocumentDetail({ doc, extractions, linkedFacts, current, locale = "en" }: { doc: DocDetail; extractions: Extraction[]; linkedFacts: (Fact & { masked?: boolean })[]; current: Current; locale?: Locale }) {
  const router = useRouter();
  const { stepUp, dialog } = useStepUp(locale, tr(locale, "Viewing the original file needs a quick confirmation.", "मूल फ़ाइल देखने के लिए त्वरित पुष्टि चाहिए।"));
  const [src, setSrc] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const mock = !doc.storageKey || doc.storageKey.startsWith("mock/");
  const pending = extractions.find((e) => !e.reviewedAt);
  const [accept, setAccept] = useState<Set<string>>(() => new Set(pending?.proposedFacts.map((p) => p.key) ?? []));
  const dl = daysUntil(doc.validUntil);

  const view = async () => {
    setBusy(true);
    try {
      let r = await api<{ url: string | null; mock: boolean }>(`/documents/${doc.id}/download-url`).catch(async (e) => { if ((e as { code?: string }).code === "STEP_UP_REQUIRED" && (await stepUp())) return api<{ url: string | null; mock: boolean }>(`/documents/${doc.id}/download-url`); throw e; });
      if (r.url) setSrc(r.url); else toast.info(tr(locale, "Original stays with the issuer in demo mode.", "डेमो में मूल फ़ाइल जारीकर्ता के पास रहती है।"));
    } catch (e) { toast.danger((e as Error).message); }
    finally { setBusy(false); }
  };
  const apply = async (keys: string[]) => {
    if (!pending) return;
    setBusy(true);
    try {
      const r = await api<{ applied: number; mismatches: number }>(`/documents/${doc.id}/extractions/${pending.id}/apply`, { method: "POST", json: { accept: keys } });
      toast.success(keys.length ? tr(locale, `${r.applied} facts added to your vault`, `${r.applied} तथ्य वॉल्ट में जुड़े`) : tr(locale, "Skipped", "छोड़ा"), { description: r.mismatches ? tr(locale, `${r.mismatches} clashed with verified values — see Verify.`, `${r.mismatches} सत्यापित मानों से टकराए — सत्यापन देखें।`) : undefined });
      router.refresh();
    } catch (e) { toast.danger((e as Error).message); }
    finally { setBusy(false); }
  };

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,3fr)_minmax(0,2fr)]">
      {dialog}
      <div className="grid gap-6">
        {/* viewer */}
        <section className="card overflow-hidden" data-testid="doc-viewer">
          {src ? (doc.mime.startsWith("image/") ? <img src={src} alt={doc.title} className="max-h-[70dvh] w-full object-contain bg-surface-2" /> : <iframe src={src} title={doc.title} className="h-[70dvh] w-full bg-surface-2" />) : (
            <div className="grid place-items-center gap-3 px-6 py-14 text-center">
              <span className={cx("grid size-16 place-items-center rounded-lg", doc.origin === "digilocker" ? "bg-verified-50 text-verified-700" : "bg-surface-2 text-ink-2")}><FileText className="size-8" strokeWidth={1.5} /></span>
              <div className="font-display text-xl font-bold">{doc.title}</div>
              <div className="text-sm text-ink-2">{doc.issuerName ?? tr(locale, "Uploaded by you", "आपके द्वारा अपलोड")}{doc.issuedAt ? ` · ${fmtDate(doc.issuedAt, locale)}` : ""}</div>
              {mock && <p className="max-w-md text-sm text-ink-3">{tr(locale, "Sandbox: view a clearly marked sample attachment. This is not a real issuer document.", "सैंडबॉक्स: नमूना फ़ाइल देखें। यह असली जारीकर्ता दस्तावेज़ नहीं है।")}</p>}
              {<Button variant="outline" onPress={view} isPending={busy}><Lock className="size-4" />{tr(locale, mock ? "View sample attachment" : "View original (confirm it’s you)", "मूल देखें (पुष्टि करें)")}</Button>}
            </div>
          )}
        </section>
        {/* extraction review */}
        {pending && (
          <section className="card p-5" data-testid="extraction-review">
            <div className="flex items-start justify-between gap-3">
              <div><h2 className="font-display text-xl font-bold">{tr(locale, `We found ${pending.proposedFacts.length} facts`, `${pending.proposedFacts.length} तथ्य मिले`)}</h2><p className="mt-0.5 text-sm text-ink-2">{tr(locale, "Untick anything that looks wrong. Low-confidence reads are outlined in amber — check those first.", "गलत लगे तो अनटिक करें। कम-विश्वास वाले पीले घेरे में हैं — पहले वे जाँचें।")}</p></div>
              <Chip size="sm" variant="soft" color={(pending.confidence ?? 0) >= 0.8 ? "success" : "warning"}>{Math.round((pending.confidence ?? 0) * 100)}% {tr(locale, "confidence", "विश्वास")}</Chip>
            </div>
            <ul className="mt-4 grid gap-2">
              {[...pending.proposedFacts].sort((a, b) => a.confidence - b.confidence).map((p) => {
                const on = accept.has(p.key), low = p.confidence < 0.8, cur = current[p.key], verified = cur && (cur.source === "issuer_verified" || cur.source === "provider_verified");
                return (
                  <li key={p.key} className={cx("grid grid-cols-[auto_1fr] items-start gap-3 rounded-md border p-3", low ? "border-pending-500/60" : "border-line", !on && "opacity-60")}>
                    <button type="button" role="checkbox" aria-checked={on} aria-label={label(p.key, locale)} onClick={() => setAccept((s) => { const n = new Set(s); if (n.has(p.key)) n.delete(p.key); else n.add(p.key); return n; })} className={cx("mt-0.5 grid size-6 place-items-center rounded-md border", on ? "border-brand-500 bg-brand-500 text-white" : "border-line bg-surface")}>{on && <Check className="size-4" />}</button>
                    <div className="min-w-0">
                      <div className="text-sm text-ink-2">{label(p.key, locale)}{low && <span className="ml-2 inline-flex items-center gap-1 text-xs font-medium text-pending-700"><AlertTriangle className="size-3" />{tr(locale, "check", "जाँचें")}</span>}</div>
                      <div className="font-medium">{fmtValue(p.key, p.value as never, locale)}</div>
                      {cur && <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-ink-3">{tr(locale, "Currently", "अभी")}: <span className="font-medium text-ink-2">{fmtValue(p.key, cur.value as never, locale)}</span><SourceChip source={cur.source} verifiedBy={cur.verifiedBy} locale={locale} />{verified && <span>{tr(locale, "· verified stays; a differing value is logged as a mismatch", "· सत्यापित बना रहेगा; अलग मान बेमेल में दर्ज होगा")}</span>}</div>}
                    </div>
                  </li>
                );
              })}
            </ul>
            <div className="mt-4 flex flex-wrap items-center gap-2">
              <Button className="cta" onPress={() => apply([...accept])} isDisabled={busy || accept.size === 0} isPending={busy} data-testid="apply-extraction">{tr(locale, `Add ${accept.size} to vault`, `${accept.size} वॉल्ट में जोड़ें`)}</Button>
              <Button variant="ghost" onPress={() => apply([])} isDisabled={busy}><X className="size-4" />{tr(locale, "Skip all", "सब छोड़ें")}</Button>
            </div>
          </section>
        )}
        {/* linked facts */}
        <section className="card p-5" data-testid="linked-facts">
          <h2 className="font-display text-xl font-bold">{tr(locale, "Facts from this document", "इस दस्तावेज़ से तथ्य")}</h2>
          {linkedFacts.length === 0 ? <p className="mt-1 text-sm text-ink-2">{tr(locale, "None yet.", "अभी कोई नहीं।")}{pending ? ` ${tr(locale, "Review the facts above to add them.", "ऊपर के तथ्य समीक्षा कर जोड़ें।")}` : ""}</p>
            : <div className="mt-2">{linkedFacts.map((f) => <FactRow key={`${f.key}:${f.repeatIndex}`} fact={f} locale={locale} masked={!!f.masked} />)}</div>}
        </section>
      </div>
      {/* metadata */}
      <aside className="grid content-start gap-4">
        <section className="card p-5" data-testid="doc-meta">
          <div className="flex flex-wrap items-center gap-2">
            {doc.origin === "digilocker" ? <Chip color="success" variant="soft" size="sm"><span className="inline-flex items-center gap-1"><ShieldCheck className="size-3.5" />{tr(locale, "Issuer-verified", "जारीकर्ता-सत्यापित")}</span></Chip> : <Chip variant="soft" size="sm">{tr(locale, "Uploaded", "अपलोड")}</Chip>}
            {doc.sha256 && <Chip color="accent" variant="soft" size="sm" data-testid="hash-badge"><span className="inline-flex items-center gap-1"><Check className="size-3.5" />{tr(locale, "Hash recorded", "हैश दर्ज")}</span></Chip>}
            {doc.status === "pending" && <Chip color="warning" variant="soft" size="sm">{tr(locale, "Processing", "प्रोसेसिंग")}</Chip>}
            {dl != null && <Chip color={dl < 0 ? "danger" : dl <= 60 ? "warning" : "default"} variant="soft" size="sm">{dl < 0 ? tr(locale, "Expired", "समाप्त") : tr(locale, `Valid ${dl}d`, `${dl} दिन वैध`)}</Chip>}
          </div>
          <dl className="mt-4 grid grid-cols-[auto_1fr] gap-x-4 gap-y-2 text-sm">
            <dt className="text-ink-3">{tr(locale, "Type", "प्रकार")}</dt><dd className="font-medium">{docTypeLabel(doc.docType, locale)}</dd>
            {doc.issuerName && <><dt className="text-ink-3">{tr(locale, "Issuer", "जारीकर्ता")}</dt><dd className="font-medium">{doc.issuerName}<span className="block text-xs text-ink-3">{doc.issuerId}</span></dd></>}
            {doc.issuedAt && <><dt className="text-ink-3">{tr(locale, "Issued", "जारी")}</dt><dd>{fmtDate(doc.issuedAt, locale)}</dd></>}
            {doc.validUntil && <><dt className="text-ink-3">{tr(locale, "Valid until", "वैधता")}</dt><dd>{fmtDate(doc.validUntil, locale)}</dd></>}
            <dt className="text-ink-3">{tr(locale, "Added", "जोड़ा")}</dt><dd>{fmtDate(doc.createdAt, locale)}</dd>
            <dt className="text-ink-3">{tr(locale, "File", "फ़ाइल")}</dt><dd>{doc.mime.replace("application/", "").replace("image/", "").toUpperCase()}{doc.size ? ` · ${(doc.size / 1024).toFixed(0)} KB` : ""}</dd>
            {doc.docUri && <><dt className="text-ink-3">URI</dt><dd className="break-all font-mono text-xs">{doc.docUri}</dd></>}
            {doc.sha256 && <><dt className="text-ink-3">SHA-256</dt><dd className="break-all font-mono text-xs">{doc.sha256}</dd></>}
          </dl>
        </section>
        <section className="card p-5">
          <h3 className="font-display text-lg font-bold">{tr(locale, "Use it", "इस्तेमाल करें")}</h3>
          <div className="mt-3 grid gap-2">
            {<Button variant="outline" onPress={view} isPending={busy}><Lock className="size-4" />{src ? tr(locale, "Refresh link", "लिंक ताज़ा करें") : tr(locale, "Download / view", "डाउनलोड / देखें")}</Button>}
            <LinkButton variant="outline" href="/app/apply"><ExternalLink className="size-4" />{tr(locale, "Attach in an application", "आवेदन में संलग्न करें")}</LinkButton>
          </div>
          <p className="mt-3 text-xs text-ink-3">{tr(locale, "Downloads need your passkey or OTP and are logged in your audit trail.", "डाउनलोड के लिए पासकी/OTP चाहिए और यह ऑडिट में दर्ज होता है।")}</p>
        </section>
      </aside>
    </div>
  );
}
