import { BadgeCheck, Database, FileLock2, Fingerprint, GitBranch, LockKeyhole, ShieldCheck, UserRoundCheck } from "lucide-react";
import PublicPageShell from "@/components/marketing/PublicPageShell";

const controls = [
  { icon: UserRoundCheck, title: "Citizen control", copy: "People see the requested fields, purpose, source, and destination before an application is shared." },
  { icon: FileLock2, title: "Private documents", copy: "Documents use private storage, short-lived access, file type limits, and ownership checks." },
  { icon: Database, title: "Tenant isolation", copy: "Partner records are organization-scoped. Client-supplied organization IDs are never trusted for access." },
  { icon: Fingerprint, title: "Official rails only", copy: "ApplyOnce does not scrape protected portals, bypass CAPTCHA, or store face, fingerprint, or iris templates." },
  { icon: LockKeyhole, title: "Auditable consent", copy: "Consent hashes, revocations, status changes, and important actions are recorded as durable events." },
  { icon: ShieldCheck, title: "Honest state", copy: "Sandbox, approval-pending, unavailable, degraded, and connected states remain visibly different to users." },
];

export default function SecurityPage() {
  return (
    <PublicPageShell eyebrow="Security and privacy" title="Trust is part of the product, not a footer link." description="ApplyOnce is designed around minimum necessary data, explicit consent, private documents, and clear recovery when something changes.">
      <section className="ao-public-callout ao-public-callout--mint"><BadgeCheck /><div><strong>A measurable baseline, not an absolute promise.</strong><span>This public beta uses Clerk authentication, server-side authorization, Neon/Postgres, private Vercel Blob storage, validation, audit events, and explicit integration boundaries. Production operators still need monitoring, incident response, retention, and credential reviews.</span></div></section>
      <section className="ao-public-section"><div className="ao-public-section-head"><div><div className="ao-eyebrow"><span className="ao-eyebrow-mark" /> The control model</div><h2>Every sensitive step has a visible owner.</h2></div><p>Citizens decide what to share. Partners declare why they need it. ApplyOnce keeps the handoff reviewable.</p></div><div className="ao-public-grid ao-public-grid--three">{controls.map(({ icon: Icon, title, copy }) => <article className="ao-public-card" key={title}><Icon className="ao-public-card-icon" /><h3>{title}</h3><p>{copy}</p></article>)}</div></section>
      <section className="ao-public-split"><div><div className="ao-eyebrow"><span className="ao-eyebrow-mark" /> What we do not do</div><h2>No unofficial shortcuts with citizen identity.</h2><p>Official identity and document providers remain the source of truth. ApplyOnce stores the minimum claim or reference needed for a declared application purpose.</p></div><div className="ao-boundary-list"><span><GitBranch /> No protected-portal scraping</span><span><GitBranch /> No CAPTCHA bypass</span><span><GitBranch /> No silent submission</span><span><GitBranch /> No biometric vault</span></div></section>
    </PublicPageShell>
  );
}
