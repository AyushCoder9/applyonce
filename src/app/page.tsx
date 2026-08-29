import Link from "next/link";
import {
  ArrowRight,
  BadgeCheck,
  Blocks,
  Check,
  ChevronRight,
  FileCheck2,
  Fingerprint,
  LockKeyhole,
  Sparkles,
  UserRoundCheck,
} from "lucide-react";
import { Card } from "@heroui/react";

const sources = [
  { name: "MeriPehchaan", detail: "identity & address", icon: Fingerprint, className: "indigo" },
  { name: "DigiLocker", detail: "verified documents", icon: FileCheck2, className: "mint" },
  { name: "APAAR", detail: "academic record", icon: Blocks, className: "blue" },
];

export default function Home() {
  return (
    <main className="marketing-page">
      <div className="shell">
        <nav className="marketing-nav" aria-label="Primary navigation">
          <Link className="brand" href="/" aria-label="ApplyOnce home">
            <span className="brand-mark"><Sparkles /></span>
            ApplyOnce
          </Link>

          <div className="nav-links">
            <a href="#how-it-works">How it works</a>
            <a href="#why-now">Why this matters</a>
            <Link href="/demo">Product demo</Link>
          </div>

          <div className="nav-cta">
            <a className="secondary-action" href="#why-now">For partners</a>
            <Link className="primary-action" href="/demo">Try the demo <ArrowRight className="inline-arrow" /></Link>
          </div>
        </nav>

        <section className="hero" aria-labelledby="hero-title">
          <div>
            <div className="eyebrow"><span className="eyebrow-dot" /> Citizen application wallet</div>
            <h1 id="hero-title">Your details. <em>Once.</em> Anywhere.</h1>
            <p className="hero-copy">
              ApplyOnce turns the repetitive part of every application into one clear, consented moment. Keep your verified profile ready, then share only what a portal needs.
            </p>
            <div className="hero-actions">
              <Link className="primary-action large" href="/demo">Open the student demo <ArrowRight className="inline-arrow" /></Link>
              <a className="secondary-action" href="#how-it-works">See how it works <ChevronRight className="inline-arrow" /></a>
            </div>
            <div className="hero-note"><LockKeyhole /> Synthetic data only · no government login required</div>
          </div>

          <div className="hero-visual-wrap" aria-label="ApplyOnce packet preview">
            <div className="hero-visual">
              <div className="visual-topbar">
                <div className="visual-profile">
                  <span className="avatar">AK</span>
                  <div><strong>Ayush Kumar</strong><span>Student profile · Ready to share</span></div>
                </div>
                <span className="live-chip">Demo mode</span>
              </div>
              <div className="visual-heading">
                <p>Application packet</p>
                <h3>One consent.<br />Three trusted sources.</h3>
                <Sparkles className="heading-spark" />
              </div>
              <div className="visual-packet">
                <div className="visual-packet-header"><strong>National STEM Entrance 2026</strong><span>98% ready</span></div>
                {sources.map((source) => {
                  const Icon = source.icon;
                  return <div className="packet-row" key={source.name}>
                    <span className={`packet-icon ${source.className}`}><Icon /></span>
                    <div><strong>{source.name}</strong><span>{source.detail}</span></div>
                    <span className="packet-check"><Check /></span>
                  </div>;
                })}
              </div>
              <p className="visual-footnote"><BadgeCheck /> Every field is traceable to its source.</p>
            </div>
          </div>
        </section>

        <div className="proof-strip" aria-label="Product principles">
          <div className="proof-label">Designed for the high-friction moments that decide access.</div>
          <div className="proof-items">
            <div className="proof-item"><Fingerprint /> Verify once</div>
            <div className="proof-item"><UserRoundCheck /> Share with consent</div>
            <div className="proof-item"><FileCheck2 /> Keep the receipt</div>
          </div>
        </div>

        <section className="section" id="how-it-works" aria-labelledby="how-title">
          <div className="section-heading">
            <div><div className="eyebrow"><span className="eyebrow-dot" /> The simple version</div><h2 id="how-title">Stop retyping your life.</h2></div>
            <p>Every application asks for a slightly different slice of the same citizen profile. ApplyOnce makes that slice explicit.</p>
          </div>
          <div className="flow-grid">
            <Card className="flow-card"><span className="flow-index">01</span><h3>Source once</h3><p>Bring verified identity, academic records, certificates, and preferences into one citizen-controlled profile.</p><Fingerprint /></Card>
            <Card className="flow-card"><span className="flow-index">02</span><h3>Shape once</h3><p>See exactly which fields a portal requests, resolve a mismatch, and approve a purpose-bound packet.</p><FileCheck2 /></Card>
            <Card className="flow-card"><span className="flow-index">03</span><h3>Apply anywhere</h3><p>Send the right fields to public or private portals, then keep the receipt and status in one timeline.</p><ArrowRight /></Card>
          </div>
        </section>

        <section className="gap-section" id="why-now" aria-labelledby="gap-title">
          <div className="gap-inner">
            <div>
              <div className="eyebrow"><span className="eyebrow-dot" /> Why this matters</div>
              <h2 id="gap-title">The citizen sees one form. The system sees five silos.</h2>
              <p className="gap-copy">Existing services already help with identity, documents, and academic records. The missing layer is the moment where a citizen actually completes a new application.</p>
            </div>
            <div className="gap-points">
              <div className="gap-point"><Fingerprint /><div><strong>Portable, not trapped</strong><span>Carry verified claims across an exam, scholarship, college, or job application without handing over your whole profile.</span></div></div>
              <div className="gap-point"><BadgeCheck /><div><strong>Transparent, not magical</strong><span>Every prefilled field shows its source, freshness, and why the receiving portal needs it.</span></div></div>
              <div className="gap-point"><LockKeyhole /><div><strong>Consent is the action</strong><span>Approve the packet once. Revoke access later. Keep a human-readable history of what moved and when.</span></div></div>
            </div>
          </div>
        </section>

        <section className="cta-section" aria-labelledby="cta-title">
          <div><h2 id="cta-title">One profile.<br /><span>Many doors.</span></h2><p>See the full journey in a 60-second interactive demo built for citizens, not portals.</p></div>
          <div><a className="secondary-action" href="#how-it-works">Read the concept</a><Link className="primary-action large" href="/demo">Run the demo <ArrowRight className="inline-arrow" /></Link></div>
        </section>

        <footer className="marketing-footer">
          <Link className="brand" href="/"><span className="brand-mark"><Sparkles /></span>ApplyOnce</Link>
          <span>Build What Moves India · synthetic prototype · 2026</span>
          <span>Built for faster, clearer public access.</span>
        </footer>
      </div>
    </main>
  );
}
