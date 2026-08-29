"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  ArrowRight,
  BadgeCheck,
  Bell,
  Check,
  CheckCircle2,
  ChevronRight,
  CircleAlert,
  Clock3,
  Copy,
  Download,
  FileCheck2,
  FileText,
  Fingerprint,
  GraduationCap,
  Info,
  LayoutDashboard,
  LockKeyhole,
  MapPin,
  School,
  Send,
  Settings2,
  ShieldCheck,
  Sparkles,
  WalletCards,
} from "lucide-react";
import { Button, Chip } from "@heroui/react";

type DemoStep = "dashboard" | "review" | "form" | "receipt";

const applicationFields = [
  ["Full name", "Aanya Mehta"],
  ["Date of birth", "14 August 2005"],
  ["Parent / guardian", "Nikhil Mehta"],
  ["Category", "General"],
  ["Annual family income", "₹4,80,000"],
  ["Mobile number", "+91 98••• 48126"],
  ["Email address", "aanya.mehta.demo@example.com"],
  ["Academic record", "Class XII · 91.4%"],
];

const sourceRows = [
  { name: "MeriPehchaan", detail: "Identity, address, mobile", icon: Fingerprint, tone: "indigo" },
  { name: "DigiLocker", detail: "Class X & XII certificates", icon: FileCheck2, tone: "mint" },
  { name: "APAAR", detail: "Academic record · updated today", icon: GraduationCap, tone: "blue" },
];

function Brand() {
  return <Link className="brand" href="/"><span className="brand-mark"><Sparkles /></span>ApplyOnce</Link>;
}

function DemoTopbar({ backendReady }: { backendReady: boolean }) {
  return <header className="demo-topbar">
    <div className="demo-topbar-left"><Brand /><span className="demo-divider" /><span className="demo-label">Citizen application wallet</span></div>
    <div className="demo-topbar-right"><span className="demo-badge"><Sparkles /> Synthetic demo{backendReady ? " · live data" : ""}</span><button className="icon-button" aria-label="Notifications"><Bell /></button><span className="avatar">AM</span></div>
  </header>;
}

function DemoSidebar({ step, onNavigate }: { step: DemoStep; onNavigate: (step: DemoStep) => void }) {
  return <aside className="demo-sidebar">
    <div className="sidebar-caption">Workspace</div>
    <nav className="sidebar-nav" aria-label="Demo navigation">
      <button className={`sidebar-link ${step === "dashboard" ? "active" : ""}`} onClick={() => onNavigate("dashboard")}><LayoutDashboard /> Overview</button>
      <button className={`sidebar-link ${step === "form" ? "active" : ""}`} onClick={() => onNavigate("form")}><WalletCards /> My profile <Chip color="success" variant="soft" size="sm">98%</Chip></button>
      <button className={`sidebar-link ${step === "review" ? "active" : ""}`} onClick={() => onNavigate("review")}><FileText /> Applications <span className="sidebar-count">1</span></button>
      <button className={`sidebar-link ${step === "receipt" ? "active" : ""}`} onClick={() => onNavigate("receipt")}><ShieldCheck /> Consent log</button>
    </nav>
    <div className="sidebar-bottom"><div className="sidebar-user"><span className="avatar">AM</span><div><strong>Aanya Mehta</strong><span>Student profile</span></div><Settings2 /></div></div>
  </aside>;
}

function Dashboard({ onStart }: { onStart: () => void }) {
  return <>
    <div className="demo-welcome"><div><h1>Good evening, Aanya.</h1><p>Your profile is ready for the next application.</p></div><div className="status-line"><CheckCircle2 /> Profile verified · 14 Aug 2026</div></div>
    <div className="dashboard-grid">
      <section className="dashboard-card">
        <div className="card-kicker">Next best action</div>
        <h2>Apply for National STEM Entrance 2026</h2>
        <p>The portal needs 38 fields. ApplyOnce can assemble 35 from your approved profile and ask you only for what is new.</p>
        <div className="dashboard-action-row"><Button className="primary-action" variant="primary" onPress={onStart}>Open exam portal <ArrowRight className="inline-arrow" /></Button><span className="state-pill warning"><Clock3 /> Closes in 12 days</span></div>
        <div className="data-note"><LockKeyhole /> You control what gets shared</div>
      </section>
      <section className="readiness-card"><div className="card-kicker">Application readiness</div><h3>Almost everything is already here.</h3><div className="readiness-meter"><div className="meter-ring"><strong>92%</strong></div><div className="readiness-copy"><strong>35 / 38 fields ready</strong><span>Three fields will be requested from you at submission.</span></div></div><div className="readiness-links"><span>Last verified</span><strong>Today, 6:42 PM</strong></div></section>
    </div>
    <div className="dashboard-grid">
      <section className="application-card"><div className="card-heading"><div><div className="card-kicker">Your applications</div><h3>Keep every outcome in one place</h3></div><a className="text-link" href="#activity">View timeline <ChevronRight /></a></div><div className="application-row"><span className="application-logo"><School /></span><div className="application-details"><strong>National STEM Entrance 2026</strong><span>Engineering · Undergraduate · 38 fields</span></div><span className="state-pill warning"><Clock3 /> Draft</span><Button className="secondary-action" variant="outline" onPress={onStart}>Resume</Button></div></section>
      <section className="service-card" id="sources"><div className="card-heading"><div><div className="card-kicker">Connected sources</div><h3>Trusted by you</h3></div><a className="text-link" href="#sources">Manage <ChevronRight /></a></div><div className="service-list">{sourceRows.map((source) => { const Icon = source.icon; return <div className="service-row" key={source.name}><span className={`service-badge ${source.tone}`}><Icon /></span><strong>{source.name}</strong><span>Connected</span></div>; })}</div></section>
    </div>
    <section className="timeline-card" id="activity"><div className="card-heading"><div><div className="card-kicker">Activity</div><h3>Nothing gets lost after you press apply</h3></div><a className="text-link" href="#activity">See consent log <ChevronRight /></a></div><div className="timeline-list"><div className="timeline-item"><span className="timeline-dot"><Check /></span><div><strong>Academic record refreshed</strong><span>APAAR matched the latest Class XII record.</span></div><time>Today</time></div><div className="timeline-item"><span className="timeline-dot"><FileCheck2 /></span><div><strong>Profile packet prepared</strong><span>35 fields are ready for National STEM Entrance.</span></div><time>Today</time></div><div className="timeline-item"><span className="timeline-dot"><LockKeyhole /></span><div><strong>Consent preferences saved</strong><span>Nothing is shared until you approve an application packet.</span></div><time>Yesterday</time></div></div></section>
  </>;
}

function Progress({ step }: { step: DemoStep }) {
  const current = step === "review" ? 1 : step === "form" ? 2 : step === "receipt" ? 3 : 0;
  return <div className="journey-progress" aria-label="Application progress"><div className={`progress-step ${current >= 1 ? current === 1 ? "active" : "done" : ""}`}><span>{current > 1 ? <Check /> : "1"}</span> Connect</div><div className={`progress-line ${current >= 2 ? "done" : ""}`} /><div className={`progress-step ${current >= 2 ? current === 2 ? "active" : "done" : ""}`}><span>{current > 2 ? <Check /> : "2"}</span> Review</div><div className={`progress-line ${current >= 3 ? "done" : ""}`} /><div className={`progress-step ${current === 3 ? "active" : ""}`}><span>3</span> Submit</div></div>;
}

function JourneyHeader({ step, onBack }: { step: DemoStep; onBack: () => void }) {
  const title = step === "review" ? "Connect to the exam portal" : step === "form" ? "Review and submit" : "Application submitted";
  const sub = step === "review" ? "National STEM Entrance 2026 · Undergraduate engineering" : step === "form" ? "Your approved profile has been mapped to every required field." : "Your receipt and consent history are ready.";
  return <div className="journey-header"><div><button className="text-link" onClick={onBack}><ArrowLeft /> Back to overview</button><h1>{title}</h1><p>{sub}</p></div><Progress step={step} /></div>;
}

function ExamPortal() {
  return <div className="exam-shell"><div className="exam-portal-bar"><div className="exam-portal-brand"><span><School /></span> National STEM Entrance <small>Candidate application portal</small></div><span className="demo-label">Secure form</span></div><div className="exam-body"><div className="eyebrow"><span className="eyebrow-dot" /> External portal · mock for demo</div><h2>Candidate application form</h2><p>Complete your profile once. This portal accepts a verified ApplyOnce packet.</p><div className="exam-section-label">Personal details</div><div className="exam-field-grid"><div className="fake-field"><label>Full name</label><span>Required</span></div><div className="fake-field"><label>Date of birth</label><span>Required</span></div><div className="fake-field"><label>Parent / guardian</label><span>Required</span></div><div className="fake-field"><label>Category</label><span>Required</span></div></div><div className="exam-section-label">Documents & eligibility</div><div className="requirements"><div className="requirement-row"><FileCheck2 /><span>Class XII marksheet</span><small>Required</small></div><div className="requirement-row"><Fingerprint /><span>Identity verification</span><small>Required</small></div><div className="requirement-row"><MapPin /><span>Exam city preference</span><small>You choose</small></div></div><div className="exam-section-label">What ApplyOnce can fill</div><div className="fake-field full"><label>Application payload</label><span>35 of 38 fields can be prefilled after your consent</span></div></div></div>;
}

function PacketPanel({ onContinue }: { onContinue: () => void }) {
  const [consented, setConsented] = useState(false);
  return <aside className="packet-panel"><div className="panel-kicker">ApplyOnce packet</div><h2>One consent. The right fields. Nothing extra.</h2><p>Review what this exam portal is requesting before your profile travels anywhere.</p><div className="consent-banner"><strong>Purpose: National STEM Entrance 2026</strong>Only application fields and documents required for this form will be shared.</div><div className="source-stack">{sourceRows.map((source) => { const Icon = source.icon; return <div className="source-card" key={source.name}><span className={`service-badge ${source.tone}`}><Icon /></span><div><strong>{source.name}</strong><span>{source.detail}</span></div><Check /></div>; })}</div><div className="consent-footer"><label><input type="checkbox" checked={consented} onChange={(event) => setConsented(event.target.checked)} /> <span>I understand what will be shared and approve this one-time application packet.</span></label><Button className="primary-action" variant="primary" isDisabled={!consented} onPress={onContinue}>Continue with ApplyOnce <ArrowRight className="inline-arrow" /></Button><p className="packet-note"><Info /> You can revoke this connection later. This is synthetic data for the hackathon demo.</p></div></aside>;
}

function ReviewStage({ onContinue, onBack }: { onContinue: () => void; onBack: () => void }) {
  return <><JourneyHeader step="review" onBack={onBack} /><div className="journey-grid"><ExamPortal /><PacketPanel onContinue={onContinue} /></div></>;
}

function FormStage({ issueResolved, onResolve, onSubmit, onBack }: { issueResolved: boolean; onResolve: () => void; onSubmit: () => void; onBack: () => void }) {
  return <><JourneyHeader step="form" onBack={onBack} /><div className="journey-grid"><section className="form-shell"><div className="form-top"><strong>National STEM Entrance 2026</strong><span><BadgeCheck /> 35 fields prefilled</span></div><div className="form-content"><div className="eyebrow"><span className="eyebrow-dot" /> Review before submission</div><h2>Everything in place.</h2><p>We matched your profile to the receiving portal. You only need to confirm what is new.</p>{!issueResolved ? <div className="form-alert"><CircleAlert /><div><strong>One field needs your attention</strong>Your income certificate was issued 11 months ago. <button onClick={onResolve}>Confirm it is still valid</button> to continue.</div></div> : <div className="form-alert resolved"><CheckCircle2 /><div><strong>Field confirmed</strong>Your profile is complete and ready to submit.</div></div>}<div className="prefill-grid">{applicationFields.map(([label, value]) => <div className="fake-field verified" key={label}><label>{label}</label><span>{value}</span><CheckCircle2 className="verified-mark" /></div>)}<div className="fake-field"><label>Exam city preference · You choose</label><span>Pune</span></div><div className="fake-field"><label>Declaration · You confirm</label><span>I agree to the terms</span></div></div><div className="form-actions"><small><LockKeyhole /> Signed by your consent</small><Button className="primary-action" variant="primary" isDisabled={!issueResolved} onPress={onSubmit}>Submit application <Send className="inline-arrow" /></Button></div></div></section><aside className="journey-side-note"><div className="panel-kicker">What just happened</div><h2>A messy form became a clear packet.</h2><p>Instead of typing the same identity, family, and academic details again, you reviewed the source and confirmed the two things that only you can decide.</p><div className="side-stat-list"><div className="side-stat"><span>Fields mapped</span><strong>35 / 38</strong></div><div className="side-stat"><span>Sources checked</span><strong>3</strong></div><div className="side-stat"><span>Extra typing</span><strong>3 fields</strong></div><div className="side-stat"><span>Consent scope</span><strong>Exam only</strong></div></div></aside></div></>;
}

function ReceiptStage({ onRestart, onBack }: { onRestart: () => void; onBack: () => void }) {
  const [copied, setCopied] = useState(false);
  const copyReceipt = async () => {
    try {
      await navigator.clipboard.writeText("NSE26-AM-004281");
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1800);
    } catch {
      setCopied(false);
    }
  };

  return <><JourneyHeader step="receipt" onBack={onBack} /><div className="receipt-wrap"><section className="receipt-card"><div className="receipt-hero"><span className="success-orb"><Check /></span><h1>Application submitted.</h1><p>Your packet was accepted by National STEM Entrance 2026. Keep this receipt — your consent trail is attached.</p></div><div className="receipt-details"><div className="receipt-detail"><span>Submitted at</span><strong>29 Aug 2026 · 8:18 PM</strong></div><div className="receipt-detail"><span>Application ID</span><strong>NSE26-AM-004281</strong></div><div className="receipt-detail"><span>Next update</span><strong>Within 48 hours</strong></div></div><div className="receipt-footer"><span className="receipt-id">RECEIPT / NSE26-AM-004281</span><div className="receipt-actions"><button className="secondary-action" onClick={() => window.print()}><Download className="inline-arrow" /> Save receipt</button><button className="secondary-action" onClick={() => void copyReceipt()}><Copy className="inline-arrow" /> {copied ? "Copied" : "Copy ID"}</button></div></div></section><aside className="next-card"><div className="panel-kicker">Consent trail</div><h2>Clear after you apply.</h2><p>Here is the proof of what moved, why it moved, and what is still under your control.</p><div className="receipt-timeline"><div className="receipt-timeline-row"><CheckCircle2 /><span>3 sources verified against your profile</span></div><div className="receipt-timeline-row"><CheckCircle2 /><span>35 fields shared for one stated purpose</span></div><div className="receipt-timeline-row"><CheckCircle2 /><span>Receipt generated and saved to your wallet</span></div><div className="receipt-timeline-row"><LockKeyhole /><span>Connection can be revoked from Consent log</span></div></div><Button className="primary-action" variant="primary" onPress={onRestart} style={{ marginTop: 25, width: "100%" }}>Run it again <ArrowRight className="inline-arrow" /></Button></aside></div></>;
}

export default function DemoPage() {
  const [step, setStep] = useState<DemoStep>("dashboard");
  const [issueResolved, setIssueResolved] = useState(false);
  const [backendReady, setBackendReady] = useState(false);

  useEffect(() => {
    let active = true;
    fetch("/api/demo", { cache: "no-store" })
      .then((response) => {
        if (active) {
          setBackendReady(response.ok);
        }
      })
      .catch(() => {
        if (active) {
          setBackendReady(false);
        }
      });

    return () => {
      active = false;
    };
  }, []);

  const restart = () => { setIssueResolved(false); setStep("dashboard"); };

  return <main className="demo-page"><DemoTopbar backendReady={backendReady} /><div className="demo-layout"><DemoSidebar step={step} onNavigate={setStep} /><section className="demo-main">{step === "dashboard" && <Dashboard onStart={() => setStep("review")} />}{step === "review" && <ReviewStage onContinue={() => setStep("form")} onBack={() => setStep("dashboard")} />}{step === "form" && <FormStage issueResolved={issueResolved} onResolve={() => setIssueResolved(true)} onSubmit={() => setStep("receipt")} onBack={() => setStep("review")} />}{step === "receipt" && <ReceiptStage onRestart={restart} onBack={() => setStep("dashboard")} />}</section></div></main>;
}
