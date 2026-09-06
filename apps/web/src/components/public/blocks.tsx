import Link from "next/link";
/** Public-site building blocks. Server-safe. */
export const Container = ({ children, className = "" }: { children: React.ReactNode; className?: string }) => <div className={`mx-auto w-full max-w-[1120px] px-4 md:px-6 ${className}`}>{children}</div>;
export function Section({ eyebrow, title, blurb, children, className = "", id }: { eyebrow?: string; title?: string; blurb?: string; children?: React.ReactNode; className?: string; id?: string }) {
  return (
    <section id={id} className={`py-16 md:py-24 ${className}`}><Container>
      {(eyebrow || title) && <div className="mb-10 max-w-2xl">{eyebrow && <div className="mb-2 text-xs font-semibold uppercase tracking-[0.08em] text-brand-600">{eyebrow}</div>}{title && <h2 className="font-display text-3xl font-bold md:text-4xl">{title}</h2>}{blurb && <p className="mt-3 text-lg text-ink-2">{blurb}</p>}</div>}
      {children}
    </Container></section>
  );
}
/** Legal / long-form pages. */
export function Prose({ title, updated, intro, children }: { title: string; updated?: string; intro?: string; children: React.ReactNode }) {
  return (
    <Container className="py-14 md:py-20">
      <div className="max-w-3xl">
        <h1 className="font-display text-4xl font-bold md:text-5xl">{title}</h1>
        {updated && <p className="mt-2 text-sm text-ink-3">Last updated {updated}</p>}
        {intro && <p className="mt-4 text-lg text-ink-2">{intro}</p>}
        <div className="prose-applyonce mt-10 grid gap-8">{children}</div>
      </div>
    </Container>
  );
}
export const H2 = ({ children, id }: { children: React.ReactNode; id?: string }) => <h2 id={id} className="font-display text-2xl font-bold">{children}</h2>;
export const P = ({ children }: { children: React.ReactNode }) => <p className="text-ink-2 leading-relaxed">{children}</p>;
export const UL = ({ items }: { items: React.ReactNode[] }) => <ul className="grid gap-2 text-ink-2">{items.map((x, i) => <li key={i} className="flex gap-3"><span className="mt-2.5 size-1.5 shrink-0 rounded-pill bg-brand-500" /><span>{x}</span></li>)}</ul>;
export const Block = ({ children }: { children: React.ReactNode }) => <div className="grid gap-3">{children}</div>;
export const CtaLink = ({ href, children, variant = "primary" }: { href: string; children: React.ReactNode; variant?: "primary" | "secondary" }) => <Link href={href} className={variant === "primary" ? "cta inline-flex items-center gap-2 px-6 py-3 text-base" : "inline-flex items-center gap-2 rounded-pill border border-line bg-surface px-6 py-3 text-base font-semibold hover:bg-surface-2"}>{children}</Link>;
