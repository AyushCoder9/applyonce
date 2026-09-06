import Link from "next/link";
import { Lock } from "lucide-react";

export const metadata = { title: "Share with your consent" };

/** Bare shell for the embeddable share flow — no citizen navigation, one column, 640 max. */
export default function ShareLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-dvh bg-bg">
      <header className="flex h-14 items-center gap-2 border-b border-line bg-surface px-4">
        <img src="/icon.svg" alt="" className="size-7 rounded-md" /><span className="font-display font-bold">ApplyOnce</span>
        <span className="ml-auto inline-flex items-center gap-1 text-xs text-ink-3"><Lock className="size-3.5" />Encrypted · shared only with your consent</span>
      </header>
      <main className="mx-auto w-full max-w-[640px] px-4 py-6 sm:py-10 rise">{children}</main>
      <footer className="mx-auto max-w-[640px] px-4 pb-8 text-center text-xs text-ink-3"><Link href="/privacy" className="underline">Privacy</Link> · <Link href="/app/connections" className="underline">Your connections</Link></footer>
    </div>
  );
}
