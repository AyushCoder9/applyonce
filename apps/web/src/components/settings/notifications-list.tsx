"use client";
import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button, Chip, toast } from "@heroui/react";
import { Bell, CheckCheck, Settings2 } from "lucide-react";
import { EmptyState, type Locale } from "@applyonce/ui";
import { CATEGORIES, type Category } from "./prefs";

export type Notif = { id: string; category: string; title: string; body: string | null; link: string | null; readAt: string | null; createdAt: string };
const CAT: Record<Category | "all", { en: string; hi: string }> = { all: { en: "All", hi: "सभी" }, application: { en: "Applications", hi: "आवेदन" }, verification: { en: "Verification", hi: "सत्यापन" }, expiry: { en: "Expiry", hi: "समाप्ति" }, consent: { en: "Consent", hi: "सहमति" }, system: { en: "System", hi: "सिस्टम" } };
const COLOR: Record<string, "accent" | "success" | "warning" | "danger" | "default"> = { application: "accent", verification: "success", expiry: "warning", consent: "danger", system: "default" };
const rel = (d: string, l: Locale, now: number) => { const m = Math.round((now - new Date(d).getTime()) / 60000); if (m < 60) return l === "hi" ? `${m} मिनट पहले` : `${m}m ago`; const h = Math.round(m / 60); if (h < 24) return l === "hi" ? `${h} घंटे पहले` : `${h}h ago`; return new Date(d).toLocaleDateString(l === "hi" ? "hi-IN" : "en-IN", { day: "numeric", month: "short", timeZone: "Asia/Kolkata" }); };

export function NotificationsList({ items, locale: l, renderedAt }: { items: Notif[]; locale: Locale; renderedAt: number }) {
  const router = useRouter();
  const [, start] = useTransition();
  const [cat, setCat] = useState<Category | "all">("all");
  const [read, setRead] = useState<Set<string>>(new Set());
  const list = useMemo(() => items.filter((n) => cat === "all" || n.category === cat), [items, cat]);
  const dayStart = new Date(renderedAt); dayStart.setHours(0, 0, 0, 0);
  const today = list.filter((n) => new Date(n.createdAt) >= dayStart), earlier = list.filter((n) => new Date(n.createdAt) < dayStart);
  const isUnread = (n: Notif) => !n.readAt && !read.has(n.id);
  const mark = async (body: { ids?: string[]; all?: boolean }) => {
    const r = await fetch("/api/v1/notifications/read", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(body) });
    if (!r.ok) return toast.danger("Could not update");
    setRead((s) => new Set([...s, ...(body.all ? items.map((n) => n.id) : body.ids ?? [])]));
    start(() => router.refresh());
  };
  const unread = items.filter(isUnread).length;
  const group = (title: string, rows: Notif[]) => rows.length ? (
    <section className="mb-6"><h2 className="mb-2 text-xs font-semibold uppercase tracking-[0.04em] text-ink-3">{title}</h2>
      <ul className="card divide-y divide-line">{rows.map((n, i) => { const inner = (
        <div className="flex items-start gap-3 px-4 py-3">
          <span className={`mt-2 size-2 shrink-0 rounded-pill ${isUnread(n) ? "bg-accent-500" : "bg-transparent"}`} aria-label={isUnread(n) ? "unread" : undefined} />
          <div className="min-w-0 flex-1"><div className="flex items-center gap-2"><span className={`truncate ${isUnread(n) ? "font-semibold" : "font-medium"}`}>{n.title}</span><Chip size="sm" variant="soft" color={COLOR[n.category] ?? "default"}>{CAT[n.category as Category]?.[l] ?? n.category}</Chip></div>{n.body && <p className="text-sm text-ink-2">{n.body}</p>}</div>
          <span className="shrink-0 text-xs text-ink-3">{rel(n.createdAt, l, renderedAt)}</span>
        </div>); return (
        <li key={n.id} className="rise" style={{ animationDelay: `${Math.min(i, 8) * 30}ms` }}>
          {n.link ? <Link href={n.link} onClick={() => isUnread(n) && mark({ ids: [n.id] })} className="block hover:bg-surface-2">{inner}</Link> : <button type="button" className="block w-full text-left hover:bg-surface-2" onClick={() => isUnread(n) && mark({ ids: [n.id] })}>{inner}</button>}
        </li>); })}</ul>
    </section>) : null;
  return (
    <>
      <div className="mb-4 flex flex-wrap items-center gap-2">
        {(["all", ...CATEGORIES] as const).map((c) => <button key={c} type="button" onClick={() => setCat(c)} aria-pressed={cat === c} className={`rounded-pill border px-3 py-1.5 text-sm font-medium ${cat === c ? "border-brand-500 bg-brand-50 text-brand-700" : "border-line text-ink-2 hover:bg-surface-2"}`}>{CAT[c][l]}</button>)}
        <div className="ml-auto flex gap-2">
          <Button size="sm" variant="ghost" onPress={() => mark({ all: true })} isDisabled={!unread}><CheckCheck className="size-4" />{l === "hi" ? "सभी पढ़े" : "Mark all read"}</Button>
          <Link href="/app/settings/notifications" className="inline-flex items-center gap-1 rounded-pill border border-line px-3 py-1.5 text-sm font-medium hover:bg-surface-2"><Settings2 className="size-4" />{l === "hi" ? "प्राथमिकताएँ" : "Preferences"}</Link>
        </div>
      </div>
      {list.length === 0 ? <EmptyState icon={<Bell className="size-7" />} title={l === "hi" ? "कोई सूचना नहीं" : "You're all caught up"} blurb={l === "hi" ? "आवेदन, समाप्ति और सहमति की सूचनाएँ यहाँ आएँगी।" : "Application updates, expiring certificates and consent events land here."} action={<Link href="/app/apply" className="cta px-4 py-2">{l === "hi" ? "आवेदन करें" : "Apply somewhere"}</Link>} />
        : <>{group(l === "hi" ? "आज" : "Today", today)}{group(l === "hi" ? "पहले" : "Earlier", earlier)}</>}
    </>
  );
}
