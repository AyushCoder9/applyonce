"use client";
import { LinkButton } from "@/components/vault/link-button";
/** /app/documents body — Issued (DigiLocker) vs Uploaded split, filters, DocCard grid, upload flow, live refresh via SSE. */
import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button, Tabs, toast } from "@heroui/react";
import { Plus, ScanLine, ShieldCheck, Upload } from "lucide-react";
import { DocCard, DocUpload, EmptyState, daysUntil, cx } from "@praman/ui";
import { api, tr, type Locale } from "@/components/vault/i18n";
import { useEvents } from "@/components/vault/use-events";
import { docTypeLabel, UPLOAD_TYPES } from "./doc-types";

export interface DocItem { id: string; title: string; docType: string; issuerName?: string | null; origin: "digilocker" | "upload" | "generated"; status: "pending" | "ready" | "rejected"; validUntil?: string | null; issuedAt?: string | null; sha256?: string | null; needsReview: boolean; createdAt: string }
type Validity = "all" | "valid" | "expiring" | "expired";

export function DocumentsView({ profileId, docs, locale = "en", openUpload = false }: { profileId: string; docs: DocItem[]; locale?: Locale; openUpload?: boolean }) {
  const router = useRouter();
  const [tab, setTab] = useState<"issued" | "uploaded">(openUpload ? "uploaded" : docs.some((d) => d.origin === "digilocker") ? "issued" : "uploaded");
  const [type, setType] = useState<string | null>(null);
  const [validity, setValidity] = useState<Validity>("all");
  const [show, setShow] = useState(openUpload);
  useEvents({ onNotification: (n) => { if (n.category === "verification") { toast.info(n.title, { description: n.body ?? undefined }); router.refresh(); } } });

  const inTab = docs.filter((d) => (tab === "issued" ? d.origin === "digilocker" : d.origin !== "digilocker"));
  const types = useMemo(() => [...new Set(inTab.map((d) => d.docType))], [inTab]);
  const list = inTab.filter((d) => (!type || d.docType === type)).filter((d) => { const dl = daysUntil(d.validUntil); return validity === "all" || (validity === "valid" && (dl == null || dl > 60)) || (validity === "expiring" && dl != null && dl >= 0 && dl <= 60) || (validity === "expired" && dl != null && dl < 0); });
  const review = docs.filter((d) => d.needsReview);
  const chip = (on: boolean) => cx("min-h-9 rounded-pill border px-3 text-sm font-medium transition-colors", on ? "border-brand-500 bg-brand-50 text-brand-700" : "border-line bg-surface text-ink-2 hover:bg-surface-2");

  return (
    <div className="grid min-w-0 grid-cols-1 gap-6">
      {review.length > 0 && (
        <Link href={`/app/documents/${review[0]!.id}`} className="card flex items-center gap-4 border-info-500/30 bg-info-50 p-4 hover:shadow-pop" data-testid="review-banner">
          <span className="grid size-10 shrink-0 place-items-center rounded-md bg-surface text-info-500"><ScanLine className="size-5" /></span>
          <span className="min-w-0 flex-1"><span className="block font-semibold">{tr(locale, `We found facts in ${review.length} document${review.length > 1 ? "s" : ""} — review?`, `${review.length} दस्तावेज़ में तथ्य मिले — समीक्षा करें?`)}</span><span className="text-sm text-ink-2">{review.map((d) => d.title).join(" · ")}</span></span>
          <span className="text-sm font-semibold text-brand-600">{tr(locale, "Review", "समीक्षा")}</span>
        </Link>
      )}
      <div className="flex flex-wrap items-center gap-3">
        <Tabs selectedKey={tab} onSelectionChange={(k) => { setTab(k as "issued" | "uploaded"); setType(null); }} className="min-w-0">
          <Tabs.ListContainer><Tabs.List aria-label="Document origin">
            <Tabs.Tab id="issued"><span className="flex items-center gap-1.5"><ShieldCheck className="size-4" />{tr(locale, "Issued", "जारी")} <span className="text-ink-3">{docs.filter((d) => d.origin === "digilocker").length}</span></span><Tabs.Indicator /></Tabs.Tab>
            <Tabs.Tab id="uploaded"><span className="flex items-center gap-1.5"><Upload className="size-4" />{tr(locale, "Uploaded", "अपलोड")} <span className="text-ink-3">{docs.filter((d) => d.origin !== "digilocker").length}</span></span><Tabs.Indicator /></Tabs.Tab>
          </Tabs.List></Tabs.ListContainer>
        </Tabs>
        <Button className="cta ml-auto" onPress={() => { setShow(true); setTab("uploaded"); }} data-testid="add-document"><Plus className="size-4" />{tr(locale, "Add document", "दस्तावेज़ जोड़ें")}</Button>
      </div>
      {show && (
        <DocUpload locale={locale} docTypes={UPLOAD_TYPES.map((id) => ({ id, label: docTypeLabel(id, locale) }))}
          getUploadUrl={(file, docType) => api<{ documentId: string; url: string }>(`/profiles/${profileId}/documents/upload-url`, { method: "POST", json: { filename: file.name, mime: file.type, size: file.size, docType } })}
          complete={(id, meta) => api(`/documents/${id}/complete`, { method: "POST", json: meta }).then(() => undefined)}
          onDone={() => { toast.success(tr(locale, "Uploaded — reading it now", "अपलोड हुआ — पढ़ रहे हैं")); router.refresh(); }} />
      )}
      {(types.length > 1 || inTab.some((d) => d.validUntil)) && (
        <div className="flex flex-wrap gap-2" aria-label="Filters">
          {types.length > 1 && <><button type="button" className={chip(!type)} onClick={() => setType(null)}>{tr(locale, "All types", "सभी प्रकार")}</button>{types.map((t) => <button key={t} type="button" className={chip(type === t)} onClick={() => setType(type === t ? null : t)}>{docTypeLabel(t, locale)}</button>)}</>}
          {inTab.some((d) => d.validUntil) && <span className="mx-1 self-center text-ink-3">·</span>}
          {inTab.some((d) => d.validUntil) && (["all", "valid", "expiring", "expired"] as Validity[]).map((v) => <button key={v} type="button" className={chip(validity === v)} onClick={() => setValidity(v)}>{{ all: tr(locale, "Any validity", "कोई भी वैधता"), valid: tr(locale, "Valid", "वैध"), expiring: tr(locale, "Expiring ≤60d", "≤60 दिन में समाप्त"), expired: tr(locale, "Expired", "समाप्त") }[v]}</button>)}
        </div>
      )}
      {list.length === 0 ? (
        tab === "issued"
          ? <EmptyState icon={<ShieldCheck className="size-7" />} title={tr(locale, "No issued documents yet", "अभी कोई जारी दस्तावेज़ नहीं")} blurb={tr(locale, "Connect DigiLocker and your Aadhaar, PAN and marksheets appear here, verified by their issuers.", "DigiLocker जोड़ें — आधार, पैन और मार्कशीट यहाँ जारीकर्ता-सत्यापित दिखेंगे।")} action={<LinkButton variant="outline" href="/app/verify">{tr(locale, "Connect DigiLocker", "DigiLocker जोड़ें")}</LinkButton>} />
          : <EmptyState icon={<Upload className="size-7" />} title={tr(locale, "Nothing uploaded yet", "अभी कुछ अपलोड नहीं")} blurb={tr(locale, "Upload a certificate and we read the facts out of it for you to confirm.", "प्रमाण पत्र अपलोड करें — हम तथ्य पढ़कर आपसे पुष्टि लेंगे।")} action={<Button variant="outline" onPress={() => setShow(true)}>{tr(locale, "Upload a document", "दस्तावेज़ अपलोड करें")}</Button>} />
      ) : (
        <div className="grid min-w-0 grid-cols-1 gap-3 md:grid-cols-2" data-testid="doc-grid">
          {list.map((d) => <DocCard key={d.id} doc={d} href={`/app/documents/${d.id}`} locale={locale} action={d.needsReview ? <span className="self-center rounded-pill bg-info-50 px-2.5 py-1 text-xs font-semibold text-info-500">{tr(locale, "Review facts", "तथ्य समीक्षा")}</span> : undefined} />)}
        </div>
      )}
    </div>
  );
}
