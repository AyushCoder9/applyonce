import { Check, Minus, ShieldCheck, ScanLine, PenLine, Ban } from "lucide-react";
import type { FieldDiffRow } from "@praman/schema";
import { fmtValue, label, verifierName, cx, type Locale } from "./format";

const STATUS = {
  verified: { icon: ShieldCheck, cls: "text-verified-700", en: "Verified", hi: "सत्यापित" },
  extracted: { icon: ScanLine, cls: "text-info-500", en: "From document", hi: "दस्तावेज़ से" },
  self: { icon: PenLine, cls: "text-pending-700", en: "Self-declared", hi: "स्व-घोषित" },
  missing: { icon: Minus, cls: "text-danger-500", en: "Missing", hi: "अनुपलब्ध" },
  blocked: { icon: Ban, cls: "text-ink-3", en: "Not shareable for this purpose", hi: "इस उद्देश्य हेतु साझा नहीं" },
};

/** Requested vs have vs missing — the consent screen's core table. */
export function FieldDiff({ rows, locale = "en", masked, selected, onToggle }: { rows: FieldDiffRow[]; locale?: Locale; masked?: boolean; selected?: Set<string>; onToggle?: (key: string) => void }) {
  return (
    <ul className="divide-y divide-line rounded-lg border border-line bg-surface" data-testid="field-diff">
      {rows.map((r) => { const s = STATUS[r.status]; const I = s.icon; const optional = !r.required && onToggle && r.status !== "missing" && r.status !== "blocked"; const on = selected ? selected.has(r.key) : true; return (
        <li key={r.key} className={cx("grid grid-cols-[auto_1fr_auto] items-center gap-3 px-3 py-2.5 text-sm", !on && "opacity-50")}>
          <I className={cx("size-4", s.cls)} aria-label={s[locale]} />
          <div className="min-w-0"><div className="font-medium">{label(r.key, locale)}{r.required && <span className="text-danger-500"> *</span>}</div>
            <div className="truncate text-ink-2">{r.status === "missing" ? (locale === "hi" ? "आपको यह भरना होगा" : "You’ll fill this in") : r.status === "blocked" ? s[locale] : masked && r.value != null ? "••••" : fmtValue(r.key, r.value, locale)}{r.status === "verified" && r.verifiedBy ? ` · ${verifierName(r.verifiedBy)}` : ""}</div></div>
          {optional ? <button type="button" onClick={() => onToggle(r.key)} aria-pressed={on} className={cx("grid size-7 place-items-center rounded-pill border", on ? "border-brand-500 bg-brand-500 text-white" : "border-line")}>{on && <Check className="size-4" />}</button> : <span className={cx("text-xs", s.cls)}>{s[locale]}</span>}
        </li>
      ); })}
    </ul>
  );
}
