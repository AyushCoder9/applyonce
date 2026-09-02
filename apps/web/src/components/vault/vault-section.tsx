"use client";
/** /app/vault/[section] body: grouped FactRows, missing-field chips, add/edit sheet, reveal (step-up), history drawer. */
import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Button, Chip, Tooltip, toast } from "@heroui/react";
import { Plus, EyeOff, Lock, RotateCw } from "lucide-react";
import { fieldsInSection, field, type Fact, type FieldDef, type Section } from "@praman/schema";
import { FactRow, EmptyState, cx, daysUntil } from "@praman/ui";
import { api, tr, type ApiErr, type Locale } from "./i18n";
import { FactSheet } from "./fact-sheet";
import { HistoryDrawer } from "./history-drawer";
import { useStepUp } from "./step-up-dialog";

export type FactOut = Fact & { masked?: boolean };
const SUB: Record<string, { en: string; hi: string }> = {
  permanent: { en: "Permanent address", hi: "स्थायी पता" }, current: { en: "Current address", hi: "वर्तमान पता" }, correspondence: { en: "Correspondence address", hi: "पत्राचार पता" },
  father: { en: "Father", hi: "पिता" }, mother: { en: "Mother", hi: "माता" }, guardian: { en: "Guardian", hi: "अभिभावक" }, spouse: { en: "Spouse", hi: "जीवनसाथी" }, siblings: { en: "Siblings", hi: "भाई-बहन" }, nominee: { en: "Nominee", hi: "नामांकित" },
  class10: { en: "Class 10", hi: "कक्षा 10" }, class12: { en: "Class 12", hi: "कक्षा 12" }, graduation: { en: "Graduation", hi: "स्नातक" }, postgrad: { en: "Post-graduation", hi: "स्नातकोत्तर" }, diploma: { en: "Diploma", hi: "डिप्लोमा" }, exam_scores: { en: "Exam scores", hi: "परीक्षा स्कोर" }, gap_years: { en: "Gap years", hi: "गैप वर्ष" },
  history: { en: "Past employment", hi: "पिछला रोज़गार" }, primary: { en: "Primary account", hi: "प्राथमिक खाता" }, insurance: { en: "Insurance", hi: "बीमा" },
};
const subOf = (key: string) => (key.split(".").length > 2 ? key.split(".")[1]! : "");
const subLabel = (s: string, l: Locale) => SUB[s]?.[l] ?? s.replace(/_/g, " ").replace(/^\w/, (c) => c.toUpperCase());
const editable = (d: FieldDef) => !d.system && !d.derived && d.sources.includes("self_declared");

export function VaultSection({ profileId, section, initialFacts, documents, locale = "en", readOnly = false }: { profileId: string; section: Section; initialFacts: FactOut[]; documents: { id: string; title: string }[]; locale?: Locale; readOnly?: boolean }) {
  const router = useRouter();
  const [facts, setFacts] = useState<FactOut[]>(initialFacts);
  const [revealed, setRevealed] = useState(false);
  const [sheet, setSheet] = useState<{ def: FieldDef; repeatIndex: number; existing?: FactOut } | null>(null);
  const [history, setHistory] = useState<Fact | null>(null);
  const { stepUp, dialog } = useStepUp(locale);
  const defs = useMemo(() => fieldsInSection(section).filter((d) => !d.system), [section]);

  const reload = async (reveal: boolean) => {
    try { const r = await api<{ facts: FactOut[] }>(`/profiles/${profileId}/facts?section=${section}${reveal ? "&reveal=1" : ""}`); setFacts(r.facts); setRevealed(reveal); router.refresh(); return true; }
    catch (e) { const ae = e as ApiErr; if (ae.code === "STEP_UP_REQUIRED" && reveal) { if (await stepUp()) return reload(true); } else toast.danger(ae.message); return false; }
  };
  const reverify = async () => {
    try { const r = await api<{ jobId: string }>("/providers/digilocker/sync", { method: "POST", json: {} }); toast.info(tr(locale, "Re-fetching from DigiLocker…", "DigiLocker से फिर ला रहे हैं…")); router.push(`/app/verify?job=${r.jobId}`); }
    catch (e) { toast.danger((e as Error).message); }
  };
  const openAdd = (def: FieldDef, repeatIndex = 0) => setSheet({ def, repeatIndex, existing: facts.find((f) => f.key === def.key && f.repeatIndex === repeatIndex) });

  // ---- layout: singles grouped by sub-prefix; repeat groups by repeatIndex ----
  const singles = defs.filter((d) => !d.repeat);
  const groups = [...new Set(defs.filter((d) => d.repeat).map((d) => d.repeat!))];
  const present = (d: FieldDef) => facts.filter((f) => f.key === d.key);
  const missing = singles.filter((d) => editable(d) && !present(d).length);
  const subs = [...new Set(singles.map((d) => subOf(d.key)))];
  const rowProps = (f: FactOut) => ({
    fact: f, locale, masked: !!f.masked && !revealed,
    onReveal: field(f.key).sensitive ? async () => { if (!revealed) await reload(true); } : undefined,
    onEdit: readOnly ? undefined : (x: Fact) => openAdd(field(x.key), x.repeatIndex),
    onReverify: (f.source === "issuer_verified" || (f.expiresAt && (daysUntil(f.expiresAt) ?? 999) <= 60)) && !readOnly ? reverify : undefined,
    onHistory: (x: Fact) => setHistory(x),
    evidenceHref: f.evidenceDocumentId ? `/app/documents/${f.evidenceDocumentId}` : null,
  });
  const hasSensitive = facts.some((f) => field(f.key).sensitive);
  const total = facts.length;

  return (
    <div className="grid gap-6">
      {dialog}
      {/* missing fields quick list */}
      {missing.length > 0 && !readOnly && (
        <div className="card p-5" data-testid="missing-fields">
          <div className="flex items-baseline justify-between gap-3"><h2 className="font-display text-lg font-bold">{tr(locale, "Missing here", "यहाँ अधूरा")}</h2><span className="text-sm text-ink-3">{missing.length} {tr(locale, "fields", "फ़ील्ड")}</span></div>
          <p className="mt-0.5 text-sm text-ink-2">{tr(locale, "Tap one to add it. Self-declared values show amber until verified.", "जोड़ने के लिए टैप करें। स्व-घोषित मान सत्यापन तक पीले दिखेंगे।")}</p>
          <div className="mt-3 flex flex-wrap gap-2">
            {missing.slice(0, 24).map((d) => <button key={d.key} type="button" onClick={() => openAdd(d)} className="inline-flex min-h-9 items-center gap-1 rounded-pill border border-dashed border-pending-500/60 bg-pending-50 px-3 text-sm font-medium text-pending-700 hover:bg-pending-100"><Plus className="size-3.5" />{d.label[locale]}</button>)}
            {missing.length > 24 && <span className="self-center text-sm text-ink-3">+{missing.length - 24}</span>}
          </div>
        </div>
      )}
      {hasSensitive && (
        <div className="flex items-center gap-2 text-sm text-ink-2">
          <Lock className="size-4" />{revealed ? tr(locale, "Sensitive values are visible for 5 minutes.", "संवेदनशील मान 5 मिनट तक दिख रहे हैं।") : tr(locale, "Sensitive values are masked. Tap the eye to reveal (passkey/OTP).", "संवेदनशील मान छिपे हैं। देखने हेतु आँख पर टैप करें (पासकी/OTP)।")}
          {revealed && <Button size="sm" variant="ghost" onPress={() => reload(false)}><EyeOff className="size-4" />{tr(locale, "Hide", "छिपाएँ")}</Button>}
        </div>
      )}
      {total === 0 && missing.length === 0 && <EmptyState title={tr(locale, "Nothing here yet", "अभी यहाँ कुछ नहीं")} blurb={tr(locale, "Connect DigiLocker to fill this section automatically.", "इस भाग को अपने आप भरने के लिए DigiLocker जोड़ें।")} action={<Button className="cta" onPress={() => router.push("/app/verify")}>{tr(locale, "Go to Verify", "सत्यापन पर जाएँ")}</Button>} />}
      {subs.map((s) => {
        const rows = singles.filter((d) => subOf(d.key) === s).flatMap(present);
        if (!rows.length) return null;
        return (
          <section key={s || "_"} className="card p-5" data-testid="fact-group">
            {s && <h2 className="mb-2 font-display text-lg font-bold">{subLabel(s, locale)}</h2>}
            {rows.map((f) => <FactRow key={`${f.key}:${f.repeatIndex}`} {...rowProps(f)} />)}
          </section>
        );
      })}
      {groups.map((g) => {
        const gdefs = defs.filter((d) => d.repeat === g);
        const idx = [...new Set(facts.filter((f) => gdefs.some((d) => d.key === f.key)).map((f) => f.repeatIndex))].sort((a, b) => a - b);
        const first = gdefs[0]!;
        return (
          <section key={g} className="card p-5" data-testid="repeat-group">
            <div className="mb-2 flex items-center justify-between gap-3">
              <h2 className="font-display text-lg font-bold">{subLabel(subOf(first.key), locale)}</h2>
              {!readOnly && <Button size="sm" variant="outline" onPress={() => openAdd(first, idx.length ? Math.max(...idx) + 1 : 0)}><Plus className="size-4" />{tr(locale, idx.length ? "Add another" : "Add", idx.length ? "एक और जोड़ें" : "जोड़ें")}</Button>}
            </div>
            {idx.length === 0 && <p className="text-sm text-ink-2">{tr(locale, "None added yet.", "अभी कुछ नहीं जोड़ा।")}</p>}
            {idx.map((i) => {
              const rows = facts.filter((f) => f.repeatIndex === i && gdefs.some((d) => d.key === f.key));
              const miss = gdefs.filter((d) => editable(d) && !rows.some((f) => f.key === d.key));
              return (
                <div key={i} className={cx("rounded-md border border-line p-3", i > 0 && "mt-3")}>
                  <div className="mb-1 text-xs font-semibold uppercase tracking-[0.04em] text-ink-3">#{i + 1}</div>
                  {rows.map((f) => <FactRow key={`${f.key}:${f.repeatIndex}`} {...rowProps(f)} />)}
                  {miss.length > 0 && !readOnly && <div className="mt-2 flex flex-wrap gap-1.5">{miss.map((d) => <Chip key={d.key} size="sm" variant="soft" color="warning" className="cursor-pointer" onClick={() => openAdd(d, i)}>+ {d.label[locale]}</Chip>)}</div>}
                </div>
              );
            })}
          </section>
        );
      })}
      {facts.some((f) => f.source === "issuer_verified") && (
        <Tooltip><Tooltip.Trigger className="justify-self-start"><span className="inline-flex items-center gap-1 text-sm text-ink-3"><RotateCw className="size-3.5" />{tr(locale, "Why can’t I edit verified values?", "सत्यापित मान क्यों नहीं बदल सकते?")}</span></Tooltip.Trigger><Tooltip.Content>{tr(locale, "They come straight from the issuer (UIDAI, CBSE…). To change one, re-sync DigiLocker or upload a newer certificate.", "ये सीधे जारीकर्ता (UIDAI, CBSE…) से आते हैं। बदलने के लिए DigiLocker सिंक करें या नया प्रमाण पत्र अपलोड करें।")}</Tooltip.Content></Tooltip>
      )}
      <FactSheet open={!!sheet} onClose={() => setSheet(null)} def={sheet?.def ?? null} initial={sheet?.existing?.masked ? null : sheet?.existing?.value ?? null} repeatIndex={sheet?.repeatIndex ?? 0} existing={sheet?.existing ?? null} profileId={profileId} locale={locale} documents={documents}
        onSaved={() => reload(revealed)} onDeleted={() => reload(revealed)} />
      <HistoryDrawer fact={history} profileId={profileId} onClose={() => setHistory(null)} locale={locale} />
    </div>
  );
}
