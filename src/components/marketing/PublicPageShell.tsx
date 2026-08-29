import Link from "next/link";
import { ArrowRight, GitBranch } from "lucide-react";
import { ApplyOnceLogo } from "@/components/brand/ApplyOnceLogo";

export default function PublicPageShell({
  eyebrow,
  title,
  description,
  children,
}: {
  eyebrow: string;
  title: string;
  description: string;
  children: React.ReactNode;
}) {
  return (
    <main className="ao-public-page">
      <div className="ao-public-shell">
        <header className="ao-public-nav">
          <ApplyOnceLogo size="md" />
          <nav aria-label="Public navigation">
            <Link href="/">Home</Link>
            <Link href="/how-it-works">How it works</Link>
            <Link href="/security">Security</Link>
            <Link href="/docs">Partner docs</Link>
          </nav>
          <div className="ao-nav-actions">
            <Link className="ao-button ao-button--quiet" href="/sign-in">Sign in</Link>
            <Link className="ao-button ao-button--primary" href="/demo">Try the demo <ArrowRight /></Link>
          </div>
        </header>

        <section className="ao-public-hero">
          <div className="ao-eyebrow"><span className="ao-eyebrow-mark" /> {eyebrow}</div>
          <h1>{title}</h1>
          <p>{description}</p>
        </section>

        <div className="ao-public-content">{children}</div>

        <footer className="ao-public-footer">
          <div><ApplyOnceLogo size="sm" /><span>One profile. Many applications. Clear consent.</span></div>
          <nav aria-label="Footer navigation"><Link href="/security">Security</Link><Link href="/docs">Docs</Link><a href="https://github.com/AyushCoder9/applyonce" target="_blank" rel="noreferrer"><GitBranch /> View source code</a></nav>
        </footer>
      </div>
    </main>
  );
}
