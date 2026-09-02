import type { Metadata } from "next";
import Link from "next/link";
import { ShieldCheck, Lock, ScrollText, EyeOff, ArrowRight, Fingerprint, FileCheck2, Send } from "lucide-react";
import { db, t, count, eq, inArray } from "@praman/db";
import { Container, Section, CtaLink } from "@/components/public/blocks";
import { AutofillDemo } from "@/components/public/autofill-demo";

export const metadata: Metadata = {
  title: "Praman — Verify once. Apply anywhere.",
  description: "Enter your details once, verify them with DigiLocker, CBSE, UIDAI and PAN, then fill any exam, college, scholarship, job or KYC form with one consent tap. DPDP-compliant. Free for citizens.",
  openGraph: { title: "Praman — Verify once. Apply anywhere.", description: "Your verified profile for every Indian form. One consent tap, zero re-typing.", type: "website" },
};
export const revalidate = 300;

const n = async (q: Promise<{ n: number }[]>) => (await q)[0]?.n ?? 0;
async function stats() {
  try {
    const [citizens, verified, partners, shares] = await Promise.all([
      n(db.select({ n: count() }).from(t.profiles).where(eq(t.profiles.kind, "self"))), n(db.select({ n: count() }).from(t.facts).where(inArray(t.facts.source, ["issuer_verified", "provider_verified"]))),
      n(db.select({ n: count() }).from(t.partners).where(eq(t.partners.status, "verified"))), n(db.select({ n: count() }).from(t.shares)),
    ]);
    return { citizens, verified, partners, shares };
  } catch { return { citizens: 0, verified: 0, partners: 0, shares: 0 }; }
}
const fmt = (x: number) => (x >= 1000 ? `${(x / 1000).toFixed(x >= 10000 ? 0 : 1)}k` : String(x));

export default async function Landing() {
  const s = await stats();
  return (
    <>
      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-[520px] bg-[radial-gradient(70%_60%_at_20%_0%,var(--color-brand-50),transparent_70%)]" />
        <Container className="grid items-center gap-12 py-14 md:grid-cols-[1.05fr_1fr] md:py-24">
          <div className="rise">
            <div className="inline-flex items-center gap-2 rounded-pill border border-line bg-surface px-3 py-1 text-xs font-semibold text-ink-2"><span className="size-1.5 rounded-pill bg-verified-500" />DPDP-ready · DigiLocker · Free for citizens</div>
            <h1 className="mt-5 font-display text-[44px] font-bold leading-[1.02] tracking-[-0.02em] sm:text-6xl md:text-[72px]">Verify once.<br />Apply anywhere.</h1>
            <p className="hi mt-3 text-xl font-medium text-brand-700 md:text-2xl">एक बार सत्यापित करें। कहीं भी आवेदन करें।</p>
            <p className="mt-5 max-w-xl text-lg text-ink-2">Your name, marks, category, address and bank — verified by CBSE, UIDAI, PAN and your bank, stored once, encrypted. Every exam, college, scholarship, job or KYC form fills itself with one consent tap.</p>
            <div className="mt-8 flex flex-wrap items-center gap-3">
              <CtaLink href="/auth/login?mode=register">Create your Praman <ArrowRight className="size-5" /></CtaLink>
              <CtaLink href="/demo" variant="secondary">Watch the 3-minute demo</CtaLink>
            </div>
            <ul className="mt-8 flex flex-wrap gap-x-6 gap-y-2 text-sm text-ink-2">
              {["We never store your Aadhaar number", "Consent on every share", "Revoke any time"].map((x) => <li key={x} className="flex items-center gap-1.5"><ShieldCheck className="size-4 text-verified-500" />{x}</li>)}
            </ul>
          </div>
          <div className="rise" style={{ animationDelay: "120ms" }}><AutofillDemo /></div>
        </Container>
      </section>

      {/* Live stats */}
      <Container className="pb-4">
        <dl className="grid grid-cols-2 gap-3 md:grid-cols-4">
          {[["Citizens", fmt(s.citizens)], ["Verified facts", fmt(s.verified)], ["Institutions live", fmt(s.partners)], ["Consented shares", fmt(s.shares)]].map(([l, v]) => <div key={l} className="card px-5 py-4"><dt className="text-sm text-ink-2">{l}</dt><dd className="mt-0.5 font-display text-3xl font-bold tabular">{v}</dd></div>)}
        </dl>
        <p className="mt-2 text-xs text-ink-3">Live from our database · updates every 5 minutes.</p>
      </Container>

      {/* How it works */}
      <Section eyebrow="How it works" title="Three steps. Six minutes. Never again." blurb="Praman is not another form. It's the last form you fill.">
        <ol className="grid gap-4 md:grid-cols-3">
          {[
            { I: Fingerprint, t: "Connect DigiLocker", d: "Log in with your mobile. Pull Aadhaar, Class 10/12 marksheets, category and income certificates straight from the issuer. Each value gets a verified stamp." },
            { I: FileCheck2, t: "Review your vault", d: "Ten sections, one screen each. Fix anything, add what's missing, upload a PDF and we read it. Self-declared stays amber until an issuer confirms it." },
            { I: Send, t: "Apply with one tap", d: "On any portal with 'Apply with Praman', or with our browser extension, review exactly which fields go where, confirm with your passkey, done." },
          ].map((x, i) => <li key={x.t} className="card relative p-6"><span className="absolute right-5 top-4 font-display text-5xl font-bold text-brand-100">{i + 1}</span><div className="grid size-11 place-items-center rounded-md bg-brand-50 text-brand-600"><x.I className="size-5" /></div><h3 className="mt-4 font-display text-xl font-bold">{x.t}</h3><p className="mt-2 text-ink-2">{x.d}</p></li>)}
        </ol>
      </Section>

      {/* Trust */}
      <Section className="bg-surface border-y border-line" eyebrow="Built for the DPDP Act" title="Your data. Your consent. Our receipts." blurb="Consent is the product. Every share is itemised, signed, logged and revocable — the way the DPDP Rules 2025 say it must be.">
        <div className="grid gap-4 sm:grid-cols-2">
          {[
            { I: ScrollText, t: "Consent ledger", d: "Every share carries a consent id, the exact fields, the purpose and an expiry. See what each institution received; revoke and they get a webhook." },
            { I: Lock, t: "Encrypted per person", d: "Sensitive values are encrypted with a key that exists only for you. Documents are hash-verified. Reveals need your passkey or a fresh OTP." },
            { I: EyeOff, t: "We never store your Aadhaar number", d: "Only the last 4 digits and an offline-XML reference. No biometrics, no behavioural tracking, no ads. Ever." },
            { I: ShieldCheck, t: "Source on every fact", d: "Green means an issuer said so — CBSE, UIDAI, Income Tax, your bank. Amber means you typed it. Institutions see the difference too." },
          ].map((x) => <div key={x.t} className="flex gap-4 rounded-lg p-5"><div className="grid size-11 shrink-0 place-items-center rounded-md bg-verified-50 text-verified-700"><x.I className="size-5" /></div><div><h3 className="font-display text-lg font-bold">{x.t}</h3><p className="mt-1 text-ink-2">{x.d}</p></div></div>)}
        </div>
        <div className="mt-8 flex flex-wrap gap-3 text-sm"><Link href="/privacy" className="underline">Privacy notice</Link><Link href="/security" className="underline">Security</Link><Link href="/dpo" className="underline">Your rights (DPDP)</Link><Link href="/status" className="underline">Status</Link></div>
      </Section>

      {/* Institutions */}
      <Section>
        <div className="rounded-xl bg-brand-500 px-6 py-10 text-white md:px-12 md:py-14">
          <div className="grid items-center gap-8 md:grid-cols-[1.4fr_1fr]">
            <div><div className="text-xs font-semibold uppercase tracking-[0.08em] text-brand-100">For exam boards, universities, scholarships, banks</div><h2 className="mt-2 font-display text-3xl font-bold md:text-4xl">Add "Apply with Praman" in an afternoon.</h2><p className="mt-3 max-w-xl text-brand-100">Verified, signed applicant data with per-field provenance. 80% faster applications, fewer rejections, and a consent record you can show a regulator. Free for public bodies.</p></div>
            <div className="flex flex-wrap gap-3 md:justify-end"><Link href="/for-institutions" className="inline-flex items-center gap-2 rounded-pill bg-white px-6 py-3 font-semibold text-brand-700 hover:bg-brand-50">See how it works</Link><Link href="/partner/onboarding" className="inline-flex items-center gap-2 rounded-pill border border-white/40 px-6 py-3 font-semibold text-white hover:bg-white/10">Get sandbox keys</Link></div>
          </div>
        </div>
      </Section>
    </>
  );
}
