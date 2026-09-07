"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { House, UserRound, Send, ListChecks, FileText, BadgeCheck, Link2, Users, Settings, Menu, FlaskConical, type LucideIcon } from "lucide-react";
const icons: Record<string, LucideIcon> = { House, UserRound, Send, ListChecks, FileText, BadgeCheck, Link2, Users, Settings, Menu };
import { Avatar } from "@heroui/react";
import { CITIZEN_NAV, MOBILE_TABS } from "./nav";
import { ProfileSwitcher, type SwitchableProfile } from "./profile-switcher";
import { NotificationsBell } from "./notifications-bell";

const Icon = ({ name, className }: { name: string; className?: string }) => {
  const C = icons[name];
  return C ? <C className={className} strokeWidth={1.75} /> : null;
};

export function CitizenShell({ children, user, profiles, activeProfileId, unread, isSandbox = false }: { children: React.ReactNode; user: { name: string; image?: string | null }; profiles: SwitchableProfile[]; activeProfileId: string; unread: number; isSandbox?: boolean }) {
  const path = usePathname();
  const active = (href: string) => (href === "/app" ? path === "/app" : path.startsWith(href));
  return (
    <div className="min-h-dvh lg:grid lg:grid-cols-[240px_1fr]">
      <aside className="hidden lg:flex flex-col gap-1 border-r border-line bg-surface px-4 py-6 sticky top-0 h-dvh">
        <Link href="/app" className="flex items-center gap-2 px-2 mb-6"><img src="/icon.svg" alt="" className="size-8 rounded-lg" /><span className="font-display text-xl font-bold">ApplyOnce</span></Link>
        {CITIZEN_NAV.map((n) => (
          <Link key={n.href} href={n.href} aria-current={active(n.href) ? "page" : undefined}
            className={`flex items-center gap-3 rounded-md px-3 py-2.5 text-[15px] font-medium transition-colors ${active(n.href) ? "bg-brand-50 text-brand-700" : "text-ink-2 hover:bg-surface-2 hover:text-ink"}`}>
            <Icon name={n.icon} className="size-5" />{n.label}
          </Link>
        ))}
        {isSandbox && <Link href="/demo" className="mt-3 flex items-center gap-2 rounded-md border border-pending-500/35 bg-pending-50 px-3 py-2 text-xs font-semibold text-pending-700"><FlaskConical className="size-4" />Synthetic sandbox</Link>}
        <div className="mt-auto px-2 text-xs text-ink-3">v0.9 · <Link href="/privacy" className="underline">Privacy</Link> · <Link href="/dpo" className="underline">Your rights</Link></div>
      </aside>
      <div className="flex min-h-dvh flex-col">
        <header className="sticky top-0 z-30 flex h-14 items-center gap-2 border-b border-line bg-surface/90 px-3 backdrop-blur sm:px-4 lg:px-8">
          <Link href="/app" aria-label="ApplyOnce home" className="hidden items-center gap-2 min-[360px]:flex lg:hidden"><img src="/icon.svg" alt="" className="size-7 rounded-md" /><span className="hidden font-display font-bold sm:inline">ApplyOnce</span></Link>
          <details className="relative lg:hidden">
            <summary aria-label="All pages" className="cursor-pointer list-none rounded-md p-2"><Icon name="Menu" className="size-5" /></summary>
            <nav aria-label="All pages" className="absolute left-0 top-10 z-50 grid min-w-52 gap-1 rounded-xl border border-line bg-surface p-2 shadow-lg">
              {CITIZEN_NAV.map(n => <Link key={n.href} href={n.href} onClick={event => event.currentTarget.closest("details")?.removeAttribute("open")} className="flex items-center gap-3 rounded-md px-3 py-2.5 text-sm hover:bg-surface-2"><Icon name={n.icon} className="size-4" />{n.label}</Link>)}
            </nav>
          </details>
          <div className="ml-auto flex items-center gap-2">
            {isSandbox && <Link href="/demo" aria-label="Synthetic sandbox details" title="This environment uses synthetic people and mock provider records" className="inline-flex min-h-8 items-center gap-1.5 rounded-pill border border-pending-500/35 bg-pending-50 px-2 text-xs font-semibold text-pending-700 sm:px-2.5"><FlaskConical className="size-3.5" /><span className="hidden sm:inline">Synthetic sandbox</span><span className="hidden min-[360px]:inline sm:hidden">Demo</span></Link>}
            <ProfileSwitcher profiles={profiles} activeId={activeProfileId} />
            <NotificationsBell unread={unread} />
            <Link href="/app/settings" aria-label="Settings"><Avatar size="sm"><Avatar.Image src={user.image ?? undefined} alt="" /><Avatar.Fallback>{user.name.slice(0, 1).toUpperCase()}</Avatar.Fallback></Avatar></Link>
          </div>
        </header>
        <main className="flex-1 px-4 py-6 pb-24 lg:px-8 lg:py-8 lg:pb-8 max-w-[1200px] w-full mx-auto rise">{children}</main>
        <nav className="lg:hidden fixed inset-x-0 bottom-0 z-30 grid grid-cols-5 border-t border-line bg-surface safe-bottom" aria-label="Primary">
          {CITIZEN_NAV.filter((n) => (MOBILE_TABS as readonly string[]).includes(n.href)).map((n) => (
            <Link key={n.href} href={n.href} aria-current={active(n.href) ? "page" : undefined} className={`flex min-h-14 flex-col items-center justify-center gap-0.5 text-[11px] font-medium ${active(n.href) ? "text-brand-600" : "text-ink-3"}`}>
              <Icon name={n.icon} className="size-6" />{n.label}
            </Link>
          ))}
        </nav>
      </div>
    </div>
  );
}
