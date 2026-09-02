import { cx } from "./format";
/** One sentence, one next action. */
export function EmptyState({ icon, title, blurb, action, className }: { icon?: React.ReactNode; title: string; blurb?: string; action?: React.ReactNode; className?: string }) {
  return (
    <div className={cx("card grid place-items-center gap-3 px-6 py-12 text-center", className)}>
      {icon && <div className="grid size-14 place-items-center rounded-pill bg-brand-50 text-brand-600">{icon}</div>}
      <h3 className="font-display text-xl font-bold">{title}</h3>
      {blurb && <p className="max-w-md text-ink-2">{blurb}</p>}
      {action}
    </div>
  );
}
