"use client";
/** WizardShell — stepper + progress at top, single 640 px column, sticky footer Back / Continue, autosave + time-left hints. */
import { Button, ProgressBar } from "@heroui/react";
import { ArrowLeft, ArrowRight, Check, Cloud, Loader2 } from "lucide-react";
import { cx, type Locale } from "./format";

export interface WizardStep { id: string; label: string }
export interface WizardShellProps {
  steps: WizardStep[]; current: number; title: string; subtitle?: React.ReactNode;
  onBack?: () => void; onNext?: () => void; nextLabel?: string; backLabel?: string; canNext?: boolean; busy?: boolean;
  secondary?: React.ReactNode; saving?: "saving" | "saved" | null; estMinutes?: number; locale?: Locale; children: React.ReactNode; brand?: React.ReactNode;
}
export function WizardShell({ steps, current, title, subtitle, onBack, onNext, nextLabel, backLabel, canNext = true, busy, secondary, saving, estMinutes, locale = "en", children, brand }: WizardShellProps) {
  const hi = locale === "hi";
  const pct = Math.round(((current) / Math.max(1, steps.length - 1)) * 100);
  return (
    <div className="min-h-dvh bg-bg">
      <header className="sticky top-0 z-20 border-b border-line bg-surface/90 backdrop-blur">
        <div className="mx-auto flex h-14 max-w-[640px] items-center gap-3 px-4">
          {brand}
          <ol className="ml-auto hidden items-center gap-1 sm:flex" aria-label="Steps">
            {steps.map((s, i) => (
              <li key={s.id} className="flex items-center gap-1">
                <span aria-current={i === current ? "step" : undefined} className={cx("grid size-7 place-items-center rounded-pill text-xs font-semibold", i < current ? "bg-verified-500 text-white" : i === current ? "bg-brand-500 text-white" : "bg-surface-2 text-ink-3")}>{i < current ? <Check className="size-3.5" /> : i + 1}</span>
                {i < steps.length - 1 && <span className={cx("h-px w-4", i < current ? "bg-verified-500" : "bg-line")} />}
              </li>
            ))}
          </ol>
          <span className="text-xs text-ink-3 sm:hidden">{hi ? `चरण ${current + 1}/${steps.length}` : `Step ${current + 1} of ${steps.length}`}</span>
        </div>
        <ProgressBar value={pct} aria-label="Progress" color="accent" className="w-full [&_[data-slot=track]]:rounded-none [&_[data-slot=track]]:h-1" />
      </header>
      <main className="mx-auto w-full max-w-[640px] px-4 pb-32 pt-8 sm:pt-10">
        <div className="mb-6 flex items-end justify-between gap-3">
          <div>
            <div className="text-xs font-semibold uppercase tracking-[0.04em] text-ink-3">{steps[current]?.label}</div>
            <h1 className="mt-1 font-display text-3xl font-bold leading-tight sm:text-4xl">{title}</h1>
            {subtitle && <p className="mt-2 max-w-prose text-ink-2">{subtitle}</p>}
          </div>
          {estMinutes != null && <div className="shrink-0 rounded-pill bg-surface-2 px-3 py-1 text-xs font-medium text-ink-2">{hi ? `≈ ${estMinutes} मिनट बाकी` : `≈ ${estMinutes} min left`}</div>}
        </div>
        <div className="rise">{children}</div>
      </main>
      <footer className="fixed inset-x-0 bottom-0 z-20 border-t border-line bg-surface/95 backdrop-blur safe-bottom">
        <div className="mx-auto flex max-w-[640px] items-center gap-3 px-4 py-3">
          {onBack ? <Button variant="ghost" onPress={onBack} isDisabled={busy}><ArrowLeft className="size-4" />{backLabel ?? (hi ? "पीछे" : "Back")}</Button> : <span />}
          <span className="ml-auto flex items-center gap-1 text-xs text-ink-3" aria-live="polite">
            {saving === "saving" && <><Loader2 className="size-3.5 animate-spin" />{hi ? "सहेज रहे हैं" : "Saving"}</>}
            {saving === "saved" && <><Cloud className="size-3.5" />{hi ? "सहेजा गया" : "Saved"}</>}
          </span>
          {secondary}
          {onNext && <Button size="lg" className="cta min-w-36" onPress={onNext} isDisabled={!canNext || busy} isPending={busy}>{nextLabel ?? (hi ? "आगे" : "Continue")}<ArrowRight className="size-4" /></Button>}
        </div>
      </footer>
    </div>
  );
}
