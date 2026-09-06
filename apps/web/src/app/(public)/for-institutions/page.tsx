import type { Metadata } from "next";
import Link from "next/link";
import { Check, Webhook, KeyRound, FileJson2 } from "lucide-react";
import { Container, Section, CtaLink } from "@/components/public/blocks";
export const metadata: Metadata = { title: "For institutions", description: "Add 'Apply with Praman' to any exam, admission, scholarship or KYC form. Verified applicant data, signed payloads, consent receipts. Free for public bodies." };

const SNIPPET = `<form action="/api/praman/session" method="POST">\n  <button>Apply with Praman</button>\n</form>\n// Your server creates a session and redirects with HTTP 303.`;
const SERVER = `import { createPraman } from "@praman/sdk";\nconst praman = createPraman({\n  apiKey: process.env.PRAMAN_API_KEY,\n  baseUrl: process.env.PRAMAN_API_URL\n});\n// Store a random state nonce in a server session first.\nconst session = await praman.createShareSession({\n  formSlug: "bta-jee-2026",\n  returnUrl: "https://your-portal.example/api/praman/callback",\n  state: savedNonce\n});\n// In your callback, validate state before exchanging:\nconst { payload, consent_id } = await praman.exchange(shareToken);`;

export default function ForInstitutions() {
  return (
    <>
      <Container className="grid items-center gap-10 py-14 md:grid-cols-2 md:py-24">
        <div>
          <div className="text-xs font-semibold uppercase tracking-[0.08em] text-brand-600">For institutions</div>
          <h1 className="mt-3 font-display text-4xl font-bold leading-tight md:text-6xl">Stop verifying PDFs. Receive verified facts.</h1>
          <p className="mt-5 text-lg text-ink-2">One button on your form. The applicant consents, and you get a signed payload where every field says who verified it — CBSE, UIDAI, Income Tax, their bank — with document identifiers and fingerprints.</p>
          <div className="mt-8 flex flex-wrap gap-3"><CtaLink href="/partner/onboarding">Get sandbox keys</CtaLink><CtaLink href="/demo" variant="secondary">See the demo portal</CtaLink></div>
        </div>
        <ul className="card grid gap-3 p-6">{[["Less repeated entry", "Reuse existing answers; review missing or expired evidence before submission."], ["Fewer rejections", "Name/DOB mismatches with Aadhaar are caught before submission, not at counselling."], ["Consent receipt per applicant", "Purpose, fields, expiry, consent id. Keep an inspectable record for every share."], ["Documents attached, hash-verified", "Marksheets and certificates straight from DigiLocker with issuer URIs."]].map(([t, d]) => <li key={t} className="flex gap-3"><Check className="mt-1 size-5 shrink-0 text-verified-500" /><div><b>{t}</b><div className="text-sm text-ink-2">{d}</div></div></li>)}</ul>
      </Container>

      <Section className="border-y border-line bg-surface" eyebrow="Integration" title="A server-created session. A verified callback." blurb="Or use the REST API directly. Sandbox keys work immediately; live keys after we verify your organisation.">
        <div className="grid gap-4 md:grid-cols-2">
          <pre className="overflow-x-auto rounded-lg bg-ink p-5 text-sm leading-relaxed text-white"><code>{SNIPPET}</code></pre>
          <pre className="overflow-x-auto rounded-lg bg-ink p-5 text-xs leading-relaxed text-white"><code>{SERVER}</code></pre>
        </div>
        <div className="mt-8 grid gap-4 sm:grid-cols-3">
          {[{ I: KeyRound, t: "Bearer keys, sandbox & live", d: "pk_sandbox_… works against seeded demo citizens today." }, { I: FileJson2, t: "Signed JWS payloads", d: "ES256, verify against /api/v1/jwks. Typed schema in @praman/schema." }, { I: Webhook, t: "Webhooks, HMAC-signed", d: "share.completed, consent.revoked, verification.updated, application.withdrawn." }].map((x) => <div key={x.t} className="card p-5"><x.I className="size-5 text-brand-600" /><h3 className="mt-3 font-semibold">{x.t}</h3><p className="mt-1 text-sm text-ink-2">{x.d}</p></div>)}
        </div>
      </Section>

      <Section eyebrow="Pricing" title="Sandbox access is free." blurb="The following tiers are a proposed model. No billing or payment collection is enabled.">
        <div className="grid gap-4 md:grid-cols-3">
          {[["Public bodies", "₹0", "Exam boards, universities, scholarship schemes, state portals. Unlimited applications. Forever."], ["Private institutions", "₹8 / verified application", "Colleges, coaching, employers. First 1,000 free. Volume pricing above 1 lakh."], ["Regulated (KYC)", "Talk to us", "Banks, NBFCs, insurers. Adds PAN, penny-drop and AA income via your own licences."]].map(([t, p, d], i) => <div key={t} className={`card p-6 ${i === 0 ? "border-brand-500 shadow-pop" : ""}`}><div className="text-sm font-semibold text-ink-2">{t}</div><div className="mt-2 font-display text-3xl font-bold">{p}</div><p className="mt-3 text-sm text-ink-2">{d}</p></div>)}
        </div>
        <p className="mt-6 text-sm text-ink-2">Citizens never pay. We never sell data. <Link href="/privacy" className="underline">Privacy notice</Link> · <Link href="/security" className="underline">Security</Link></p>
      </Section>
    </>
  );
}
