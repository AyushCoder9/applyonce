import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { ProgressRing } from "./progress-ring";
import { cx } from "./format";

export function SectionCard({ title, blurb, href, filled, total, verified, icon, cta, className, children }: { title: string; blurb?: string; href?: string; filled?: number; total?: number; verified?: number; icon?: React.ReactNode; cta?: React.ReactNode; className?: string; children?: React.ReactNode }) {
  const body = (
    <>
      <div className="flex items-start gap-3">
        {icon && <div className="grid size-11 shrink-0 place-items-center rounded-md bg-brand-50 text-brand-600">{icon}</div>}
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2"><h3 className="font-display text-lg font-bold leading-tight">{title}</h3>{href && <ChevronRight className="ml-auto size-5 text-ink-3 transition-transform group-hover:translate-x-0.5" />}</div>
          {blurb && <p className="mt-0.5 text-sm text-ink-2">{blurb}</p>}
        </div>
      </div>
      {total != null && <div className="mt-4 flex items-center justify-between gap-3"><ProgressRing value={filled ?? 0} max={total} size="sm" label={verified != null ? `${verified} verified` : undefined} />{cta}</div>}
      {children && <div className="mt-4">{children}</div>}
    </>
  );
  const cls = cx("card group block p-5 transition-shadow hover:shadow-pop", className);
  return href ? <Link href={href} className={cls}>{body}</Link> : <section className={cls}>{body}</section>;
}
