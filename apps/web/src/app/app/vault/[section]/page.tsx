import { notFound } from "next/navigation";
import { LinkButton } from "@/components/vault/link-button";
import Link from "next/link";
import { db, t, eq, completion } from "@praman/db";
import { SECTIONS, sectionMeta, fieldsInSection, type Section } from "@praman/schema";
import { PageHeader, EmptyState, ProgressRing } from "@praman/ui";
import { requireUser, requireProfileAccess, scopeAllows } from "@/lib/session";
import { loadFacts } from "@/app/api/v1/profiles/_lib";
import { localeOf, tr } from "@/components/vault/i18n";
import { VaultSection } from "@/components/vault/vault-section";

export async function generateMetadata({ params }: { params: Promise<{ section: string }> }) { const { section } = await params; return { title: (SECTIONS as readonly string[]).includes(section) ? sectionMeta(section as Section).label.en : "Vault" }; }

export default async function VaultSectionPage({ params }: { params: Promise<{ section: string }> }) {
  const { section } = await params;
  if (!(SECTIONS as readonly string[]).includes(section)) notFound();
  const sec = section as Section;
  const s = await requireUser(`/app/vault/${section}`);
  const locale = localeOf(s.user);
  const a = await requireProfileAccess(s);
  const meta = sectionMeta(sec);
  if (!scopeAllows(a.scope, sec)) return <div><PageHeader back={{ href: "/app/vault", label: tr(locale, "Vault", "वॉल्ट") }} title={meta.label[locale]} /><EmptyState title={tr(locale, "Not shared with you", "आपके साथ साझा नहीं")} blurb={tr(locale, `${a.profile.displayName} hasn’t given you access to this section.`, `${a.profile.displayName} ने आपको इस भाग की अनुमति नहीं दी है।`)} action={<LinkButton variant="outline" href="/app/family">{tr(locale, "Manage family access", "पारिवारिक पहुँच प्रबंधित करें")}</LinkButton>} /></div>;
  const facts = await loadFacts(a, { section: sec });
  const c = completion(facts, fieldsInSection(sec).map((d) => d.key));
  const documents = await db.select({ id: t.documents.id, title: t.documents.title }).from(t.documents).where(eq(t.documents.profileId, a.profile.id));
  return (
    <div>
      <PageHeader back={{ href: "/app/vault", label: tr(locale, "Vault", "वॉल्ट") }} eyebrow={a.profile.displayName} title={meta.label[locale]} subtitle={meta.blurb[locale]} actions={<ProgressRing value={c.filled} max={c.total} label={tr(locale, `${c.verified} verified`, `${c.verified} सत्यापित`)} />} />
      <VaultSection profileId={a.profile.id} section={sec} initialFacts={facts} documents={documents} locale={locale} />
    </div>
  );
}
