"use client";
import { useState } from "react";
import { Eye, EyeOff, FileText, MoreHorizontal, Pencil, RotateCw, History } from "lucide-react";
import { Dropdown } from "@heroui/react";
import { field, type Fact } from "@praman/schema";
import { SourceChip } from "./source-chip";
import { fmtValue, label, cx, type Locale } from "./format";

export interface FactRowProps {
  fact: Fact;
  locale?: Locale;
  masked?: boolean;                          // sensitive & not stepped-up
  onReveal?: (fact: Fact) => Promise<unknown> | void;
  onEdit?: (fact: Fact) => void;
  onReverify?: (fact: Fact) => void;
  onHistory?: (fact: Fact) => void;
  evidenceHref?: string | null;
  highlight?: boolean;                       // autofill sweep
}

export function FactRow({ fact, locale = "en", masked, onReveal, onEdit, onReverify, onHistory, evidenceHref, highlight }: FactRowProps) {
  const [shown, setShown] = useState(false);
  const def = field(fact.key);
  const verified = fact.source === "issuer_verified" || fact.source === "provider_verified";
  const value = masked && !shown ? String(fact.value) : fmtValue(fact.key, fact.value, locale);
  return (
    <div data-testid="fact-row" data-key={fact.key} className={cx("group grid grid-cols-[1fr_auto] items-start gap-x-3 gap-y-1 border-b border-line py-3 last:border-b-0 sm:grid-cols-[minmax(160px,1fr)_2fr_auto] sm:items-center", highlight && "sweep rounded-md")}>
      <div className="text-sm text-ink-2 sm:text-[15px]">{label(fact.key, locale)}{def.repeat && fact.repeatIndex > 0 ? ` #${fact.repeatIndex + 1}` : ""}</div>
      <div className="col-span-2 flex min-w-0 flex-wrap items-center gap-2 sm:col-span-1">
        <span className={cx("min-w-0 break-words font-medium tabular", def.sensitive && "font-mono text-[15px]")}>{value}</span>
        {def.sensitive && onReveal && (
          <button type="button" aria-label={shown ? "Hide" : "Reveal"} className="grid size-8 place-items-center rounded-pill text-ink-3 hover:bg-surface-2" onClick={async () => { if (!shown) await onReveal(fact); setShown((s) => !s); }}>{shown ? <EyeOff className="size-4" /> : <Eye className="size-4" />}</button>
        )}
        <SourceChip source={fact.source} verifiedBy={fact.verifiedBy} expiresAt={fact.expiresAt} locale={locale} />
        {evidenceHref && <a href={evidenceHref} className="inline-flex items-center gap-1 text-xs text-brand-600 underline"><FileText className="size-3.5" />Evidence</a>}
      </div>
      <div className="row-start-1 col-start-2 sm:col-start-3 sm:row-auto">
        {(onEdit || onReverify || onHistory) && (
          <Dropdown>
            <Dropdown.Trigger aria-label="More" className="grid size-9 place-items-center rounded-pill text-ink-3 hover:bg-surface-2"><MoreHorizontal className="size-5" /></Dropdown.Trigger>
            <Dropdown.Popover><Dropdown.Menu aria-label="Fact actions" onAction={(k) => ({ edit: onEdit, reverify: onReverify, history: onHistory } as Record<string, ((f: Fact) => void) | undefined>)[String(k)]?.(fact)}>
              {onEdit && !def.derived && !verified && <Dropdown.Item id="edit" textValue="Edit"><span className="flex items-center gap-2"><Pencil className="size-4" />Edit</span></Dropdown.Item>}
              {onEdit && verified && <Dropdown.Item id="edit" textValue="Verified value" isDisabled><span className="flex items-center gap-2 text-ink-3"><Pencil className="size-4" />Verified — can’t edit. Re-verify to update.</span></Dropdown.Item>}
              {onReverify && <Dropdown.Item id="reverify" textValue="Re-verify"><span className="flex items-center gap-2"><RotateCw className="size-4" />Re-verify</span></Dropdown.Item>}
              {onHistory && <Dropdown.Item id="history" textValue="History"><span className="flex items-center gap-2"><History className="size-4" />History</span></Dropdown.Item>}
            </Dropdown.Menu></Dropdown.Popover>
          </Dropdown>
        )}
      </div>
    </div>
  );
}
