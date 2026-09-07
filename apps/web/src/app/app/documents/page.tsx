import { documentAllowed } from "@applyonce/schema";
import Link from "next/link";
import { LinkButton } from "@/components/vault/link-button";
import { db, t, eq, desc, inArray } from "@applyonce/db";
import { PageHeader } from "@applyonce/ui";
import { requireUser, requireProfileAccess } from "@/lib/session";
import { localeOf, tr } from "@/components/vault/i18n";
import { DocumentsView, type DocItem } from "@/components/documents/documents-view";

export const metadata = { title: "Documents" };
export default async function DocumentsPage({ searchParams }: { searchParams: Promise<{ upload?: string }> }) {
  const { upload } = await searchParams;
  const s = await requireUser("/app/documents");
  const locale = localeOf(s.user);
  const a = await requireProfileAccess(s);
  const rows = (await db.select().from(t.documents).where(eq(t.documents.profileId, a.profile.id)).orderBy(desc(t.documents.createdAt))).filter(d => documentAllowed(a.scope, d.docType));
  const ex = rows.length ? await db.select({ documentId: t.documentExtractions.documentId, reviewedAt: t.documentExtractions.reviewedAt }).from(t.documentExtractions).where(inArray(t.documentExtractions.documentId, rows.map((d) => d.id))) : [];
  const review = new Set(ex.filter((e) => !e.reviewedAt).map((e) => e.documentId));
  const docs: DocItem[] = rows.map((d) => ({ id: d.id, title: d.title, docType: d.docType, issuerName: d.issuerName, origin: d.origin, status: d.status, validUntil: d.validUntil?.toISOString() ?? null, issuedAt: d.issuedAt?.toISOString() ?? null, sha256: d.sha256, needsReview: review.has(d.id), createdAt: d.createdAt.toISOString() }));
  return (
    <div>
      <PageHeader title={tr(locale, "Documents", "दस्तावेज़")} subtitle={tr(locale, "Review private uploads and source documents here. Issuer documents are synthetic in this sandbox; every extracted fact needs your confirmation.", "निजी अपलोड और स्रोत दस्तावेज़ यहाँ जाँचें। इस सैंडबॉक्स में जारीकर्ता दस्तावेज़ नकली हैं; हर निकाले गए तथ्य की पुष्टि जरूरी है।")}
        actions={!rows.some((d) => d.origin === "digilocker") ? <LinkButton variant="outline" href="/app/verify">{tr(locale, "Connect DigiLocker", "DigiLocker जोड़ें")}</LinkButton> : undefined} />
      <DocumentsView profileId={a.profile.id} docs={docs} locale={locale} openUpload={upload === "1"} />
    </div>
  );
}
