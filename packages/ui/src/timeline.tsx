import { User, Building2, Cpu } from "lucide-react";
import { fmtDate, cx, type Locale } from "./format";
export interface TimelineEvent { id: string; title: string; body?: string | null; actor: string; createdAt: string | Date; type?: string }
export function ApplicationTimeline({ events, locale = "en" }: { events: TimelineEvent[]; locale?: Locale }) {
  return (
    <ol className="relative ml-3 border-l border-line pl-6">
      {events.map((e, i) => { const I = e.actor === "partner" ? Building2 : e.actor === "system" ? Cpu : User; return (
        <li key={e.id} className={cx("relative pb-6 last:pb-0", i === 0 && "rise")}>
          <span className={cx("absolute -left-[31px] grid size-6 place-items-center rounded-pill border-2 border-surface", e.actor === "partner" ? "bg-brand-500 text-white" : "bg-surface-2 text-ink-2")}><I className="size-3.5" /></span>
          <div className="font-medium">{e.title}</div>
          {e.body && <div className="text-sm text-ink-2">{e.body}</div>}
          <div className="mt-0.5 text-xs text-ink-3">{fmtDate(e.createdAt, locale)} · {e.actor}</div>
        </li>
      ); })}
    </ol>
  );
}
