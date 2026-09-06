import Link from "next/link";
export default function PublicLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-dvh flex flex-col">
      <header className="mx-auto flex w-full max-w-[1120px] items-center justify-between px-4 py-4 md:px-6">
        <Link href="/" className="flex items-center gap-2"><img src="/icon.svg" alt="" className="size-8 rounded-lg" /><span className="font-display text-xl font-bold">ApplyOnce</span></Link>
        <nav className="flex items-center gap-4 text-sm font-medium">
          <Link href="/for-institutions" className="hidden sm:inline text-ink-2 hover:text-ink">For institutions</Link>
          <Link href="/security" className="hidden sm:inline text-ink-2 hover:text-ink">Security</Link>
          <Link href="/demo" className="hidden sm:inline text-ink-2 hover:text-ink">Demo</Link>
          <Link href="/auth/login" className="rounded-pill border border-line px-4 py-2 hover:bg-surface-2">Log in</Link>
          <Link href="/auth/login?mode=register" className="cta px-4 py-2">Get started</Link>
        </nav>
      </header>
      <div className="flex-1">{children}</div>
      <footer className="border-t border-line bg-surface">
        <div className="mx-auto grid w-full max-w-[1120px] gap-6 px-4 py-10 text-sm text-ink-2 md:grid-cols-4 md:px-6">
          <div><div className="font-display text-lg font-bold text-ink">ApplyOnce</div><p className="mt-2">Verify once. Apply anywhere.</p><p className="mt-1 hi">एक बार सत्यापित करें। कहीं भी आवेदन करें।</p></div>
          <div className="grid gap-1"><span className="font-semibold text-ink">Product</span><Link href="/demo">Live demo</Link><Link href="/for-institutions">For institutions</Link><Link href="/app/extension">Browser extension</Link></div>
          <div className="grid gap-1"><span className="font-semibold text-ink">Trust</span><Link href="/security">Security</Link><Link href="/privacy">Privacy</Link><Link href="/dpo">Your data rights (DPDP)</Link><Link href="/status">Status</Link></div>
          <div className="grid gap-1"><span className="font-semibold text-ink">Legal</span><Link href="/terms">Terms</Link><span>© {new Date().getFullYear()} ApplyOnce</span></div>
        </div>
      </footer>
    </div>
  );
}
