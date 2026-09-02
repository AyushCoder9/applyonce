import type { Metadata } from "next";
import Link from "next/link";
import { ExternalLink } from "lucide-react";
import { Container, CtaLink } from "@/components/public/blocks";
export const metadata: Metadata = { title: "Live demo", description: "Try Praman end to end with the Bharat Test Agency demo exam portal and seeded citizen accounts." };
export default function Demo() {
  const portal = process.env.NEXT_PUBLIC_DEMO_PORTAL_URL ?? "http://localhost:3301";
  const STEPS = [
    ["Feel the pain", `Open the BTA-JEE 2026 form → "Fill manually". 6 steps, 48 fields, a timer. Give it 20 seconds.`],
    ["Apply with Praman", "Back → the orange button. Log in as Aarav. The consent screen lists 44 fields: 36 verified by CBSE/UIDAI/NSDL, 5 missing. Fill the 5, confirm with OTP 123456."],
    ["Everything filled", "Back on BTA: every field filled with a verified badge, marksheet and category certificate attached. Submit → application ref."],
    ["Status flows back", `In Praman → Track, the application is there. On the portal's /status page press "Admit card released" → a notification lands in Praman.`],
    ["Receipts", "Connections → open the BTA consent → the exact payload they received. Revoke → BTA's webhook fires."],
    ["Family", "Switch to daughter Riya (log in as Sunita) → same form, filled as guardian."],
  ];
  return (
    <Container className="py-14 md:py-20">
      <div className="max-w-2xl"><div className="text-xs font-semibold uppercase tracking-[0.08em] text-brand-600">Live demo · ~3 minutes</div><h1 className="mt-3 font-display text-4xl font-bold md:text-5xl">Bharat Test Agency wants 48 fields. Give it one tap.</h1><p className="mt-4 text-lg text-ink-2">A deliberately government-looking exam portal with two buttons. Everything below runs on seeded data in mock mode — no real issuer is called.</p>
        <div className="mt-6 flex flex-wrap gap-3"><a href={portal} target="_blank" rel="noreferrer" className="cta inline-flex items-center gap-2 px-6 py-3">Open the demo portal <ExternalLink className="size-4" /></a><CtaLink href="/auth/login" variant="secondary">Log in to Praman</CtaLink></div></div>
      <div className="mt-12 grid gap-8 md:grid-cols-[1.2fr_1fr]">
        <ol className="grid gap-3">{STEPS.map(([t, d], i) => <li key={t} className="card flex gap-4 p-5"><span className="grid size-8 shrink-0 place-items-center rounded-pill bg-brand-50 font-bold text-brand-700">{i + 1}</span><div><h3 className="font-semibold">{t}</h3><p className="mt-1 text-sm text-ink-2">{d}</p></div></li>)}</ol>
        <aside className="card h-fit p-5">
          <h2 className="font-display text-lg font-bold">Seeded logins</h2><p className="mt-1 text-sm text-ink-2">OTP is always <b>123456</b> in mock mode.</p>
          <ul className="mt-3 divide-y divide-line text-sm">
            {[["9876543210", "Aarav Sharma", "Student, Class 12 CBSE, OBC-NCL. Full vault."], ["9876500002", "Sunita Sharma", "Parent (Hindi UI). Guardian of Riya (minor) and Kamla (elder)."], ["9123456780", "Vikram", "Working professional, KYC-ready."], ["9000000001", "BTA Admin", "Partner console for Bharat Test Agency."], ["9000000000", "Praman Ops", "Internal admin console at /admin."]].map(([p, n, d]) => <li key={p} className="py-2.5"><div className="flex items-center justify-between"><b>{n}</b><code className="text-xs">{p}</code></div><div className="text-xs text-ink-2">{d}</div></li>)}
          </ul>
          <p className="mt-4 text-xs text-ink-3">Reset everything: <code>pnpm db:reset</code>. Browser extension: <Link href="/app/extension" className="underline">install guide</Link>.</p>
        </aside>
      </div>
    </Container>
  );
}
