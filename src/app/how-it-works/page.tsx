import { ArrowRight, BadgeCheck, FileText, LockKeyhole, MousePointer2 } from "lucide-react";
import Link from "next/link";
import PublicPageShell from "@/components/marketing/PublicPageShell";

const steps = [
  { number: "01", icon: FileText, title: "Create your profile once", copy: "Keep the identity, education, contact, and document details you use again and again." },
  { number: "02", icon: MousePointer2, title: "Open an application", copy: "ApplyOnce explains what the receiving form needs and finds the values already available." },
  { number: "03", icon: LockKeyhole, title: "Review and consent", copy: "You see the purpose, scope, sources, and documents before anything leaves your workspace." },
  { number: "04", icon: BadgeCheck, title: "Submit and keep the proof", copy: "The partner receives a clean packet. You receive a receipt and a visible status trail." },
];

export default function HowItWorksPage() {
  return (
    <PublicPageShell eyebrow="How ApplyOnce works" title="The same information should not feel new every time." description="ApplyOnce turns the repeated work of admissions, exams, and scholarships into a reviewable, consented handoff.">
      <section className="ao-public-step-list">{steps.map(({ number, icon: Icon, title, copy }) => <article key={number}><span className="ao-public-step-number">{number}</span><span className="ao-public-step-icon"><Icon /></span><div><h2>{title}</h2><p>{copy}</p></div></article>)}</section>
      <section className="ao-public-split ao-public-split--indigo"><div><div className="ao-eyebrow ao-eyebrow--mint"><span className="ao-eyebrow-mark" /> Start safely</div><h2>Try the complete citizen path with synthetic data.</h2><p>The demo shows the problem, the consent moment, the field review, and the receipt without asking for real personal information.</p></div><Link className="ao-button ao-button--primary" href="/demo">Open the demo <ArrowRight /></Link></section>
    </PublicPageShell>
  );
}
