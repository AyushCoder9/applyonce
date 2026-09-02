import { notFound } from "next/navigation";
import { db, t, eq, desc } from "@praman/db";
import { PageHeader } from "@praman/ui";
import { requireUser, requireProfileAccess } from "@/lib/session";
import { loadFacts } from "@/app/api/v1/profiles/_lib";
import { localeOf, tr } from "@/components/vault/i18n";
import { DocumentDetail, type Extraction } from "@/components/documents/document-detail";

export default async function DocumentPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const s = await requireUser(`/app/documents/${id}`);
  const locale = localeOf(s.user);
  const doc = await db.query.documents.findFirst({ where: eq(t.documents.id, id) });
  if (!doc) notFound();
  const a = await requireProfileAccess(s, doc.profileId).catch(() => null);
  if (!a) notFound();
  const extractions = await db.select().from(t.documentExtractions).where(eq(t.documentExtractions.documentId, doc.id)).orderBy(desc(t.documentExtractions.createdAt));
  const facts = await loadFacts(a);
  const linked = facts.filter((f) => f.evidenceDocumentId === doc.id);
  const keys = new Set(extractions.flatMap((e) => e.proposedFacts.map((p) => p.key)));
  const current = Object.fromEntries(facts.filter((f) => keys.has(f.key) && f.repeatIndex === 0).map((f) => [f.key, { value: f.value, source: f.source, verifiedBy: f.verifiedBy }]));
  const ex: Extraction[] = extractions.map((e) => ({ id: e.id, provider: e.provider, proposedFacts: e.proposedFacts, confidence: e.confidence, reviewedAt: e.reviewedAt?.toISOString() ?? null, createdAt: e.createdAt.toISOString() }));
  return (
    <div>
      <PageHeader back={{ href: "/app/documents", label: tr(locale, "Documents", "दस्तावेज़") }} eyebrow={doc.issuerName ?? tr(locale, "Uploaded", "अपलोड")} title={doc.title} />
      <DocumentDetail locale={locale} extractions={ex} linkedFacts={linked} current={current}
        doc={{ id: doc.id, title: doc.title, docType: doc.docType, issuerName: doc.issuerName, issuerId: doc.issuerId, docUri: doc.docUri, storageKey: doc.storageKey, mime: doc.mime, size: doc.size, sha256: doc.sha256, origin: doc.origin, issuedAt: doc.issuedAt?.toISOString() ?? null, validUntil: doc.validUntil?.toISOString() ?? null, status: doc.status, createdAt: doc.createdAt.toISOString(), meta: doc.meta }} />
    </div>
  );
}
