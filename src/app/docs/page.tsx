import Link from "next/link";
import { ArrowRight, BookOpen, Braces, Check, Code2, Link2, ShieldCheck, Webhook } from "lucide-react";
import PublicPageShell from "@/components/marketing/PublicPageShell";

const endpoints = [
  ["GET", "/api/v1/forms/:slug", "Read a published form definition"],
  ["POST", "/api/v1/forms/:slug/submit", "Submit after reviewing purpose-bound consent"],
  ["GET", "/api/v1/partner/forms", "List forms in the authenticated partner workspace"],
  ["POST", "/api/v1/partner/forms", "Create a draft form with fields and requirements"],
  ["POST", "/api/v1/partner/forms/:id/publish", "Publish a form and its hosted URL"],
  ["PATCH", "/api/v1/partner/submissions/:id/status", "Move a submission through review"],
  ["POST", "/api/v1/partner/api-keys", "Create a scoped API key, shown once"],
  ["GET", "/api/v1/partner/webhooks/:id/deliveries", "Inspect signed delivery attempts"],
];

export default function DocsPage() {
  return (
    <PublicPageShell eyebrow="Partner documentation" title="A clearer application API for every form." description="Start with one hosted link. Move to scoped APIs and signed webhooks when your admissions or exam workflow is ready.">
      <section className="ao-public-grid ao-public-grid--feature">
        <article className="ao-public-card ao-public-card--dark"><span className="ao-public-card-icon"><Braces /></span><span className="ao-card-kicker">Hosted forms</span><h2>Ship an applicant experience in one afternoon.</h2><p>Publish a mobile-ready form with a purpose statement, field mapping, consent preview, and receipt included.</p><Link className="ao-text-link ao-text-link--light" href="/partner">Open partner workspace <ArrowRight /></Link></article>
        <article className="ao-public-card ao-public-card--mint"><span className="ao-public-card-icon"><ShieldCheck /></span><span className="ao-card-kicker">Trust by design</span><h2>Ask only for the slice you need.</h2><p>Every form version carries its own requirements, purpose, and data scope. Applicants review it before they share.</p><div className="ao-public-check-list"><span><Check /> Source-aware prefill</span><span><Check /> Consent receipt</span><span><Check /> Duplicate-safe submit</span></div></article>
      </section>

      <section id="hosted-forms" className="ao-public-section"><div className="ao-public-section-head"><div><div className="ao-eyebrow"><span className="ao-eyebrow-mark" /> Integration surface</div><h2>Use the layer that fits your team.</h2></div><p>Forms are the default. APIs and webhooks keep your existing systems in control when you need deeper integration.</p></div><div className="ao-public-grid ao-public-grid--three"><article className="ao-public-card"><Link2 className="ao-public-card-icon" /><h3>Hosted form</h3><p>Share <code>/portal/your-form</code> and let ApplyOnce manage the applicant flow, document handoff, consent, and receipt.</p></article><article className="ao-public-card"><Code2 className="ao-public-card-icon" /><h3>REST API</h3><p>Use versioned contracts, organization-scoped keys, Zod validation, and idempotency keys.</p></article><article className="ao-public-card"><Webhook className="ao-public-card-icon" /><h3>Signed webhooks</h3><p>Receive status changes with timestamped HMAC signatures and retry visibility.</p></article></div></section>

      <section className="ao-public-section"><div className="ao-public-section-head"><div><div className="ao-eyebrow"><span className="ao-eyebrow-mark" /> API shape</div><h2>Small contracts. Clear ownership.</h2></div><p>These are the public contract names. The product keeps official integrations separate from the stable application layer.</p></div><div className="ao-endpoint-table">{endpoints.map(([method, path, description]) => <div className="ao-endpoint-row" key={path}><span className={`ao-method ao-method--${method.toLowerCase()}`}>{method}</span><code>{path}</code><span>{description}</span></div>)}</div><div className="ao-public-actions"><Link className="ao-button ao-button--outline" href="/api/openapi">Open OpenAPI 3.1 contract <Braces /></Link></div></section>

      <section className="ao-public-callout"><BookOpen /><div><strong>Integration status is always explicit.</strong><span>DigiLocker and MeriPehchaan are approval-pending; APAAR is unavailable for production third-party retrieval. Live access appears only after credentials, permissions, and end-to-end requests are verified.</span></div><Link className="ao-button ao-button--outline" href="/security">Read the boundary <ArrowRight /></Link></section>
    </PublicPageShell>
  );
}
