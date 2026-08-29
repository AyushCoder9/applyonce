import Link from "next/link";
import {
  ArrowRight,
  BadgeCheck,
  Check,
  ChevronRight,
  FileCheck2,
  Fingerprint,
  GitBranch,
  LockKeyhole,
  MousePointer2,
  UsersRound,
} from "lucide-react";
import AnimatedRail from "@/components/marketing/AnimatedRail";
import { ApplyOnceLogo } from "@/components/brand/ApplyOnceLogo";

const sources = [
  { name: "DigiLocker", detail: "Certificates", icon: FileCheck2, tone: "mint" },
  { name: "MeriPehchaan", detail: "Identity", icon: Fingerprint, tone: "indigo" },
  { name: "Your profile", detail: "Preferences", icon: UsersRound, tone: "sun" },
];

const benefits = [
  {
    number: "01",
    title: "Bring your proof together",
    copy: "Keep identity, academics, certificates, and preferences in one citizen-controlled profile.",
    icon: Fingerprint,
    tone: "indigo",
  },
  {
    number: "02",
    title: "See what is requested",
    copy: "Every field shows its source, freshness, and why the receiving organization needs it.",
    icon: MousePointer2,
    tone: "mint",
  },
  {
    number: "03",
    title: "Apply with confidence",
    copy: "Review the final packet, approve the purpose, and keep a receipt for every application.",
    icon: BadgeCheck,
    tone: "sun",
  },
];

export default function Home() {
  return (
    <main className="ao-site">
      <div className="ao-site-shell">
        <header className="ao-marketing-nav">
          <ApplyOnceLogo size="md" />
          <nav className="ao-marketing-links" aria-label="Primary navigation">
            <a href="#how-it-works">How it works</a>
            <a href="#privacy">Privacy</a>
            <Link href="/docs">For partners</Link>
            <Link href="/demo">Demo</Link>
          </nav>
          <div className="ao-nav-actions">
            <Link className="ao-button ao-button--quiet" href="/sign-in">Sign in</Link>
            <Link className="ao-button ao-button--primary" href="/demo">Try the demo <ArrowRight /></Link>
          </div>
        </header>

        <section className="ao-hero" aria-labelledby="hero-title">
          <div className="ao-hero-copy">
            <div className="ao-eyebrow"><span className="ao-eyebrow-mark" /> Citizen application wallet</div>
            <h1 id="hero-title">Your details.<br /><span>Once.</span> Anywhere.</h1>
            <p>ApplyOnce turns repetitive applications into one clear, consented step. Keep your verified profile ready, then share only what each application needs.</p>
            <div className="ao-hero-actions">
              <Link className="ao-button ao-button--primary ao-button--large" href="/demo">Open the product demo <ArrowRight /></Link>
              <a className="ao-button ao-button--outline ao-button--large" href="#how-it-works">See how it works <ChevronRight /></a>
            </div>
            <div className="ao-trust-note"><LockKeyhole /> Synthetic demo data. Real consent is always explicit.</div>
          </div>
          <AnimatedRail />
        </section>

        <section className="ao-principle-strip" aria-label="ApplyOnce principles">
          <span className="ao-principle-intro">Built for the high-friction moments that decide access.</span>
          <div className="ao-principles">
            <span><Fingerprint /> Verify once</span>
            <span><LockKeyhole /> Share with consent</span>
            <span><FileCheck2 /> Keep the receipt</span>
          </div>
        </section>

        <section className="ao-section ao-section--breathing" id="how-it-works" aria-labelledby="how-title">
          <div className="ao-section-heading">
            <div>
              <div className="ao-eyebrow"><span className="ao-eyebrow-mark" /> The simple version</div>
              <h2 id="how-title">Stop retyping your life.</h2>
            </div>
            <p>Every application asks for a slightly different slice of the same citizen profile. ApplyOnce makes that slice visible.</p>
          </div>
          <div className="ao-benefit-grid">
            {benefits.map(({ number, title, copy, icon: Icon, tone }) => (
              <article className={`ao-benefit ao-benefit--${tone}`} key={number}>
                <span className="ao-benefit-index">{number}</span>
                <Icon className="ao-benefit-icon" />
                <h3>{title}</h3>
                <p>{copy}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="ao-flow-section" id="privacy" aria-labelledby="privacy-title">
          <div className="ao-flow-copy">
            <div className="ao-eyebrow ao-eyebrow--mint"><span className="ao-eyebrow-mark" /> A better handoff</div>
            <h2 id="privacy-title">The citizen sees one form. The system sees five silos.</h2>
            <p>Existing services help with identity, documents, and academic records. ApplyOnce connects those verified pieces at the moment a person actually applies.</p>
            <Link className="ao-text-link ao-text-link--light" href="/security">Explore the security model <ArrowRight /></Link>
          </div>
          <div className="ao-flow-list">
            {sources.map(({ name, detail, icon: Icon, tone }) => (
              <div className="ao-flow-source" key={name}>
                <span className={`ao-source-icon ao-source-icon--${tone}`}><Icon /></span>
                <div><strong>{name}</strong><span>{detail} stays scoped to the application purpose.</span></div>
                <Check className="ao-flow-check" />
              </div>
            ))}
            <div className="ao-flow-result"><BadgeCheck /><span><strong>One reviewable packet</strong><small>Only the fields the receiving form requested.</small></span></div>
          </div>
        </section>

        <section className="ao-partner-section" aria-labelledby="partner-title">
          <div className="ao-partner-art" aria-hidden="true">
            <div className="ao-partner-art-window">
              <div className="ao-art-toolbar"><span /><span /><span /><b>partner form</b></div>
              <div className="ao-art-body"><div className="ao-art-line ao-art-line--long" /><div className="ao-art-line" /><div className="ao-art-fields"><span /><span /><span /></div><div className="ao-art-button" /></div>
            </div>
            <div className="ao-art-bubble ao-art-bubble--top"><BadgeCheck /><span>35 fields mapped</span></div>
            <div className="ao-art-bubble ao-art-bubble--bottom"><LockKeyhole /><span>Consent required</span></div>
          </div>
          <div>
            <div className="ao-eyebrow"><span className="ao-eyebrow-mark" /> For colleges and organizers</div>
            <h2 id="partner-title">Give applicants a calmer way in.</h2>
            <p>Build a hosted form, map the fields you already need, and receive clean submissions without making a student repeat their entire story.</p>
            <div className="ao-inline-points"><span><Check /> Hosted forms</span><span><Check /> REST API</span><span><Check /> Signed webhooks</span></div>
            <Link className="ao-button ao-button--outline" href="/docs">See the partner workflow <ArrowRight /></Link>
          </div>
        </section>

        <section className="ao-cta-section" aria-labelledby="cta-title">
          <div><div className="ao-eyebrow"><span className="ao-eyebrow-mark" /> Start with one application</div><h2 id="cta-title">One profile.<br /><span>Many doors.</span></h2><p>Experience the complete citizen journey in a safe synthetic environment.</p></div>
          <Link className="ao-button ao-button--primary ao-button--large" href="/demo">Run the demo <ArrowRight /></Link>
        </section>

        <footer className="ao-footer">
          <div className="ao-footer-brand"><ApplyOnceLogo size="sm" /><span>Designed for faster, clearer public access.</span></div>
          <div className="ao-footer-links">
            <Link href="/security">Security</Link>
            <Link href="/docs">Partner docs</Link>
            <a href="https://github.com/AyushCoder9/applyonce" target="_blank" rel="noreferrer"><GitBranch /> View source code</a>
          </div>
          <span className="ao-footer-copy">Build What Moves India · 2026</span>
        </footer>
      </div>
    </main>
  );
}
