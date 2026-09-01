import Link from "next/link";
import { connection } from "next/server";
import { ArrowRight, BadgeCheck, GraduationCap, ShieldCheck } from "lucide-react";
import PublicPageShell from "@/components/marketing/PublicPageShell";
import { listPublishedPartnerPrograms } from "@/lib/partner-service";

export default async function ProgramsPage() {
  await connection();
  const programs = await listPublishedPartnerPrograms();

  return <PublicPageShell eyebrow="Verified program directory" title="Know who is asking before you apply." description="Only approved organizations and immutable published form versions appear in this directory."><section className="ao-public-callout ao-public-callout--mint"><ShieldCheck /><div><strong>Publication is versioned.</strong><span>If an organization changes requirements, the new draft must be published as a new version. Existing application receipts keep the version originally reviewed.</span></div></section><section className="ao-public-section"><div className="ao-public-section-head"><div><div className="ao-eyebrow"><span className="ao-eyebrow-mark" /> Available now</div><h2>Start with a clear scope.</h2></div><p>Every program identifies its organization, purpose, fields, and documents before consent.</p></div><div className="ao-public-grid ao-public-grid--three">{programs.map(({ form, version, organization }) => <article className="ao-public-card ao-program-directory-card" key={form.id}><GraduationCap className="ao-public-card-icon" /><span className="ao-status-pill ao-status-pill--positive"><span />Published v{version.version}</span><h3>{version.name}</h3><p>{organization.name} · {version.category}</p><p>{version.description}</p><div className="ao-program-requirements"><span><BadgeCheck /> {version.formSchema.fields.length} fields</span><span><BadgeCheck /> {version.formSchema.documents.length} documents</span></div><Link className="ao-button ao-button--primary ao-button--full" href={`/portal/${form.slug}`}>Review and apply<ArrowRight /></Link></article>)}</div>{programs.length === 0 ? <div className="ao-public-callout"><GraduationCap /><div><strong>No verified programs are published yet.</strong><span>Approved partners can publish their first immutable program version from the partner workspace.</span></div></div> : null}</section></PublicPageShell>;
}
