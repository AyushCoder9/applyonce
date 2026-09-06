"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, FileInput, Users, Code2, UserPlus, Settings, Building2, Plug, ListOrdered, Flag, ScrollText, Inbox, type LucideIcon } from "lucide-react";
const icons: Record<string, LucideIcon> = { LayoutDashboard, FileInput, Users, Code2, UserPlus, Settings, Building2, Plug, ListOrdered, Flag, ScrollText, Inbox };

export function SideShell({ children, nav, title, subtitle, footer }: { children: React.ReactNode; nav: readonly { href: string; label: string; icon: string }[]; title: string; subtitle?: string; footer?: React.ReactNode }) {
  const path = usePathname();
  const root = nav[0]!.href;
  const active = (href: string) => (href === root ? path === root : path.startsWith(href));
  return (
    <div className="min-h-dvh md:grid md:grid-cols-[240px_1fr]">
      <aside className="border-b border-line bg-surface p-4 md:sticky md:top-0 md:h-dvh md:border-b-0 md:border-r md:px-4 md:py-6">
        <Link href={root} className="mb-6 flex items-center gap-2 px-2"><img src="/icon.svg" alt="" className="size-8 rounded-lg" /><div><div className="font-display text-lg font-bold leading-tight">{title}</div>{subtitle && <div className="text-xs text-ink-3">{subtitle}</div>}</div></Link>
        <nav className="flex gap-1 overflow-x-auto md:flex-col">
          {nav.map((n) => { const C = icons[n.icon]; return (
            <Link key={n.href} href={n.href} aria-current={active(n.href) ? "page" : undefined} className={`flex shrink-0 items-center gap-3 rounded-md px-3 py-2.5 text-[15px] font-medium ${active(n.href) ? "bg-brand-50 text-brand-700" : "text-ink-2 hover:bg-surface-2"}`}>{C && <C className="size-5" />}{n.label}</Link>
          ); })}
        </nav>
        {footer && <div className="mt-6 md:mt-auto">{footer}</div>}
      </aside>
      <main className="mx-auto w-full max-w-[1280px] px-4 py-6 md:px-8 md:py-8 rise">{children}</main>
    </div>
  );
}
