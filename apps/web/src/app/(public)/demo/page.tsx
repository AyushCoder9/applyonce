import type { Metadata } from "next";
import Link from "next/link";
import { ExternalLink } from "lucide-react";
import { Container, CtaLink } from "@/components/public/blocks";
import { DemoSystemProof } from "@/components/public/demo-system-proof";
import { demoPortalUrl } from "@/lib/urls";
export const metadata: Metadata = { title: "Live demo", description: "Try the ApplyOnce citizen application journey end to end with synthetic data." };
export default function Demo() {
  const portal = demoPortalUrl();
  const applyHref = portal ?? "/app/apply/bta-jee-2026";
  const STEPS = [
    ["Open the application", portal ? `Open the BTA-JEE 2026 form → "Fill manually". 6 steps, 56 inputs, a timer. Give it 20 seconds.` : "Open the BTA-JEE 2026 application from ApplyOnce. The complete hosted journey is enabled on this deployment."],
    ["Apply with ApplyOnce", "Log in as Aarav. Evidence readiness shows which reusable fields are verified, missing, expired, conflicting, or editable."],
    ["Review the exact scope", portal ? "Return from BTA to the consent screen, complete any missing values, and review every field and document before sharing." : "Complete any missing values, then review every field, document, purpose, and retention period before sharing."],
    ["Affirm and submit", "Confirm with OTP 123456, select Share and submit, and wait for the persisted success confirmation."],
    ["Track and receive proof", "Open the generated receipt, copy the application reference, and follow the status timeline from Applications."],
    ["Inspect consent", "Connections → open the BTA consent to see the exact payload shared. Revoke future ApplyOnce access whenever you choose."],
  ];
  return (
    <Container className="py-14 md:py-20">
      <div className="max-w-2xl"><div className="text-xs font-semibold uppercase tracking-[0.08em] text-brand-600">Live demo · ~2 minutes</div><h1 className="mt-3 font-display text-4xl font-bold md:text-5xl">BTA asks for 56 answers. 51 map to one reusable profile.</h1><p className="mt-4 text-lg text-ink-2">{portal ? "A separate exam portal demonstrates the full hand-off and return flow." : "The hosted application demonstrates review, explicit consent, submission, receipt, and tracking in one deployment."} Everything runs on synthetic data in mock mode — no real issuer is called.</p>
        <div className="mt-6 flex flex-wrap gap-3"><Link href={applyHref} target={portal ? "_blank" : undefined} rel={portal ? "noreferrer" : undefined} className="cta inline-flex items-center gap-2 px-6 py-3">{portal ? "Open the demo portal" : "Start the demo application"}{portal && <ExternalLink className="size-4" />}</Link><CtaLink href="/auth/login" variant="secondary">Log in to ApplyOnce</CtaLink></div></div>
      <DemoSystemProof />
      <div className="mt-8 grid gap-8 md:grid-cols-[1.2fr_1fr]">
        <ol className="grid gap-3">{STEPS.map(([t, d], i) => <li key={t} className="card flex gap-4 p-5"><span className="grid size-8 shrink-0 place-items-center rounded-pill bg-brand-50 font-bold text-brand-700">{i + 1}</span><div><h3 className="font-semibold">{t}</h3><p className="mt-1 text-sm text-ink-2">{d}</p></div></li>)}</ol>
        <aside className="card h-fit p-5">
          <h2 className="font-display text-lg font-bold">Seeded logins</h2><p className="mt-1 text-sm text-ink-2">OTP is always <b>123456</b> in mock mode.</p>
          <ul className="mt-3 divide-y divide-line text-sm">
            {[["9876543210", "Aarav Sharma", "Student, Class 12 CBSE, OBC-NCL. Full vault."], ["9876500002", "Sunita Sharma", "Parent (Hindi UI). Guardian of Riya (minor) and Kamla (elder)."], ["9123456780", "Vikram", "Working professional, KYC-ready."], ["9000000001", "BTA Admin", "Partner console for Bharat Test Agency."], ["9000000000", "ApplyOnce Ops", "Internal admin console at /admin."]].map(([p, n, d]) => <li key={p} className="py-2.5"><div className="flex items-center justify-between"><b>{n}</b><code className="text-xs">{p}</code></div><div className="text-xs text-ink-2">{d}</div></li>)}
          </ul>
          <p className="mt-4 text-xs text-ink-3">Every account and document shown here is synthetic. Browser extension: <Link href="/app/extension" className="underline">installation guide</Link>.</p>
        </aside>
      </div>
    </Container>
  );
}
