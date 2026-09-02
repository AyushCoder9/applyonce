import Link from "next/link";
import { ArrowLeft } from "lucide-react";
export function PageHeader({ title, subtitle, back, actions, eyebrow }: { title: string; subtitle?: React.ReactNode; back?: { href: string; label?: string }; actions?: React.ReactNode; eyebrow?: string }) {
  return (
    <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
      <div>
        {back && <Link href={back.href} className="mb-2 inline-flex items-center gap-1 text-sm text-ink-2 hover:text-ink"><ArrowLeft className="size-4" />{back.label ?? "Back"}</Link>}
        {eyebrow && <div className="text-xs font-semibold uppercase tracking-[0.04em] text-ink-3">{eyebrow}</div>}
        <h1 className="font-display text-3xl font-bold leading-tight sm:text-4xl">{title}</h1>
        {subtitle && <p className="mt-1 max-w-2xl text-ink-2">{subtitle}</p>}
      </div>
      {actions && <div className="flex shrink-0 flex-wrap gap-2">{actions}</div>}
    </div>
  );
}
