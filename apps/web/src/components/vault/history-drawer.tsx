"use client";
import { useEffect, useState } from "react";
import { Drawer, Skeleton, useMediaQuery } from "@heroui/react";
import type { Fact } from "@praman/schema";
import { fmtValue, fmtDate, SourceChip, verifierName, label } from "@praman/ui";
import { api, tr, type Locale } from "./i18n";

type Row = { id: string; changedAt: string; oldSource: string | null; changedBy: string | null; reason: string | null; oldValue: unknown; newValue: unknown };
export function HistoryDrawer({ fact, profileId, onClose, locale = "en" }: { fact: Fact | null; profileId: string; onClose: () => void; locale?: Locale }) {
  const desktop = useMediaQuery("(min-width: 640px)");
  const [rows, setRows] = useState<Row[] | null>(null);
  useEffect(() => {
    if (!fact) return;
    setRows(null);
    api<{ history: Row[] }>(`/profiles/${profileId}/facts/${encodeURIComponent(fact.key)}/history?repeatIndex=${fact.repeatIndex}`).then((r) => setRows(r.history)).catch(() => setRows([]));
  }, [fact, profileId]);
  return (
    <Drawer isOpen={!!fact} onOpenChange={(o) => { if (!o) onClose(); }}>
      <Drawer.Backdrop variant="blur">
        <Drawer.Content placement={desktop ? "right" : "bottom"} className={desktop ? "w-full max-w-md" : "max-h-[85dvh] rounded-t-xl"}>
          <Drawer.Dialog>
            {!desktop && <Drawer.Handle />}
            <Drawer.Header>
              <div className="text-xs font-semibold uppercase tracking-[0.04em] text-ink-3">{tr(locale, "History", "इतिहास")}</div>
              <Drawer.Heading className="font-display text-xl font-bold">{fact ? label(fact.key, locale) : ""}</Drawer.Heading>
            </Drawer.Header>
            <Drawer.Body className="py-2">
              {fact && (
                <div className="mb-4 rounded-md bg-surface-2 p-3">
                  <div className="text-xs text-ink-3">{tr(locale, "Current", "वर्तमान")}</div>
                  <div className="flex flex-wrap items-center gap-2"><span className="font-medium">{fmtValue(fact.key, fact.value, locale)}</span><SourceChip source={fact.source} verifiedBy={fact.verifiedBy} expiresAt={fact.expiresAt} locale={locale} /></div>
                  {fact.verifiedAt && <div className="mt-1 text-xs text-ink-3">{tr(locale, "Verified", "सत्यापित")} {fmtDate(fact.verifiedAt, locale)}{fact.verifiedBy ? ` · ${verifierName(fact.verifiedBy)}` : ""}</div>}
                </div>
              )}
              {rows == null ? <div className="grid gap-2"><Skeleton className="h-12 rounded-md" /><Skeleton className="h-12 rounded-md" /></div>
                : rows.length === 0 ? <p className="text-ink-2">{tr(locale, "No changes yet. This is the first value.", "अभी कोई बदलाव नहीं। यह पहला मान है।")}</p>
                : <ol className="relative ml-2 border-l border-line pl-5">
                    {rows.map((r) => (
                      <li key={r.id} className="relative pb-5 last:pb-0">
                        <span className="absolute -left-[27px] top-1 size-3 rounded-pill border-2 border-surface bg-brand-500" />
                        <div className="text-sm"><span className="text-ink-3 line-through">{fact ? fmtValue(fact.key, r.oldValue as never, locale) : String(r.oldValue)}</span> → <span className="font-medium">{fact ? fmtValue(fact.key, r.newValue as never, locale) : String(r.newValue)}</span></div>
                        <div className="text-xs text-ink-3">{fmtDate(r.changedAt, locale)}{r.oldSource ? ` · ${tr(locale, "was", "पहले")} ${r.oldSource.replace("_", " ")}` : ""}{r.reason ? ` · ${r.reason}` : ""}</div>
                      </li>
                    ))}
                  </ol>}
            </Drawer.Body>
          </Drawer.Dialog>
        </Drawer.Content>
      </Drawer.Backdrop>
    </Drawer>
  );
}
