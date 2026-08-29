import { Activity, CheckCircle2, CircleDashed, Database, FileKey2, GitBranch, UserRound } from "lucide-react";
import PublicPageShell from "@/components/marketing/PublicPageShell";

const services = [
  { name: "ApplyOnce web app", detail: "Public pages, citizen workspace, partner workspace", icon: Activity, status: "Operational" },
  { name: "Neon/Postgres", detail: "Profiles, applications, consent, partner records", icon: Database, status: "Configured" },
  { name: "Clerk authentication", detail: "Sign in, sign up, protected workspace routes", icon: UserRound, status: "Configured" },
  { name: "Private document storage", detail: "Vercel Blob upload boundary", icon: FileKey2, status: "Configured" },
  { name: "Official identity connectors", detail: "Adapter interface and sandbox states", icon: CircleDashed, status: "Awaiting credentials" },
];

export default function StatusPage() {
  return (
    <PublicPageShell eyebrow="System status" title="See what is live, configured, and still waiting." description="ApplyOnce treats integration state as product information. This page keeps the boundary visible for citizens, partners, and reviewers.">
      <section className="ao-status-summary"><span className="ao-status-summary-mark"><CheckCircle2 /></span><div><strong>Core product operational</strong><span>Public landing, hosted forms, database-backed workspaces, receipts, and partner submissions are available in this deployment.</span></div><span className="ao-mono-label">30 AUG 2026</span></section>
      <section className="ao-public-section"><div className="ao-status-list">{services.map(({ name, detail, icon: Icon, status }) => <article className="ao-status-row" key={name}><span className="ao-status-row-icon"><Icon /></span><div><strong>{name}</strong><span>{detail}</span></div><span className={`ao-status-state ao-status-state--${status === "Operational" ? "positive" : status === "Awaiting credentials" ? "attention" : "neutral"}`}><span />{status}</span></article>)}</div></section>
      <section className="ao-public-callout"><GitBranch /><div><strong>Want to inspect the implementation?</strong><span>The repository, migrations, seed data, and integration boundaries are open for review.</span></div><a className="ao-button ao-button--outline" href="https://github.com/AyushCoder9/applyonce" target="_blank" rel="noreferrer">View source <GitBranch /></a></section>
    </PublicPageShell>
  );
}
