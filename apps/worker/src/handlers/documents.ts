import { sha256 } from "@praman/crypto";
/** documents queue: document.process (AV stub + OCR -> proposed facts) */
import { db, eq, documents, documentExtractions } from "@praman/db";
import { isFactKey, coerce, validateFact, DOCUMENT_MIMES, MAX_DOCUMENT_BYTES, detectedMime } from "@praman/schema";
import { providers } from "@praman/providers";
import { enqueue, type JobMap } from "@praman/jobs";
import { getObject } from "../s3";

const ALLOWED_MIME: readonly string[] = DOCUMENT_MIMES;
const MAX_SIZE_BYTES = MAX_DOCUMENT_BYTES;

export async function documentProcess(data: JobMap["document.process"]) {
  const { documentId, userId } = data;
  const doc = await db.query.documents.findFirst({ where: eq(documents.id, documentId) });
  if (!doc) throw new Error(`document ${documentId} not found`);

  if (!ALLOWED_MIME.includes(doc.mime) || doc.size > MAX_SIZE_BYTES) {
    await db.update(documents).set({ status: "rejected" }).where(eq(documents.id, documentId));
    return { status: "rejected" as const };
  }

  const bytes = doc.storageKey && !doc.storageKey.startsWith("mock/") ? await getObject(doc.storageKey) : new Uint8Array();
  if (doc.storageKey && !doc.storageKey.startsWith("mock/") && (!bytes.length || bytes.length > MAX_SIZE_BYTES || detectedMime(bytes) !== doc.mime || (doc.sha256 && sha256(Buffer.from(bytes)) !== doc.sha256))) {
    await db.update(documents).set({ status: "rejected", meta: { ...doc.meta, rejection: "File content, size or fingerprint does not match the upload." } }).where(eq(documents.id, documentId));
    await enqueue("notify", { userId, category: "verification", title: "Upload could not be validated. Please upload a new file.", link: `/app/documents/${documentId}` });
    return { status: "rejected" as const };
  }
  if (doc.status === "ready") return { status: "ready" as const };
  const { fields, confidence } = await providers.ocr.extract(bytes, doc.docType);

  const proposedFacts: { key: string; value: unknown; confidence: number }[] = [];
  for (const [key, raw] of Object.entries(fields)) {
    if (!isFactKey(key)) continue;
    const coerced = coerce(key, raw);
    if (coerced === null || coerced === undefined) continue;
    const parsed = validateFact(key, coerced);
    if (!parsed.success) continue;
    proposedFacts.push({ key, value: parsed.data, confidence });
  }

  const [ext] = await db.insert(documentExtractions).values({ documentId, provider: "ocr", rawJson: fields, proposedFacts, confidence }).returning();
  await db.update(documents).set({ status: "ready", size: bytes.length || doc.size, sha256: bytes.length ? sha256(Buffer.from(bytes)) : doc.sha256 }).where(eq(documents.id, documentId));
  await enqueue("notify", { userId, category: "verification", title: `We found ${proposedFacts.length} facts in ${doc.title} — review them`, link: `/app/documents/${documentId}` });
  return { extractionId: ext!.id, count: proposedFacts.length };
}
