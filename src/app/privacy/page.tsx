import { Database, FileLock2, RefreshCcw, ShieldCheck, Trash2, UserRoundCheck } from "lucide-react";
import PublicPageShell from "@/components/marketing/PublicPageShell";

const rights = [
  { icon: UserRoundCheck, title: "Review before sharing", copy: "You see the recipient, purpose, exact fields, documents, and application version before consent." },
  { icon: RefreshCcw, title: "Revoke future access", copy: "Revocation blocks future ApplyOnce retrieval. It does not falsely promise erasure from a partner that already received a copy." },
  { icon: Database, title: "Export your information", copy: "A citizen can request a portable copy of profile, application, consent, and activity records." },
  { icon: Trash2, title: "Request deletion", copy: "Deletion is tracked as a durable request with visible progress and permitted retention exceptions." },
  { icon: FileLock2, title: "Private documents", copy: "Files are owner-scoped and shared only through explicit application consent." },
  { icon: ShieldCheck, title: "No hidden biometrics", copy: "ApplyOnce does not store raw face, fingerprint, iris, payment, or password data." },
];

export default function PrivacyPage() {
  return <PublicPageShell eyebrow="Privacy controls" title="Your data should move with permission, not momentum." description="ApplyOnce separates profile storage, application submission, connector access, withdrawal, revocation, export, and deletion into visible actions."><section className="ao-public-grid ao-public-grid--three">{rights.map(({ icon: Icon, title, copy }) => <article className="ao-public-card" key={title}><Icon className="ao-public-card-icon" /><h3>{title}</h3><p>{copy}</p></article>)}</section><section className="ao-public-split ao-public-split--indigo"><div><div className="ao-eyebrow ao-eyebrow--mint"><span className="ao-eyebrow-mark" /> Honest retention</div><h2>Submission and deletion are not the same action.</h2><p>A submitted partner copy may remain under that organization’s lawful retention policy. ApplyOnce shows the distinction instead of hiding it inside a checkbox.</p></div><ShieldCheck /></section></PublicPageShell>;
}
