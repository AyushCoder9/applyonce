/** documents queue: document.process (AV stub + OCR -> proposed facts) */
import { db, eq, documents, documentExtractions } from "@praman/db";
import { isFactKey, coerce, validateFact } from "@praman/schema";
import { providers } from "@praman/providers";
import { enqueue, type JobMap } from "@praman/jobs";
import { getObject } from "../s3";

const ALLOWED_MIME = ["application/pdf", "image/jpeg", "image/png"];
const MAX_SIZE_BYTES = 10 * 1024 * 1024;

export async function documentProcess(data: JobMap["document.process"]) {
  const { documentId, userId } = data;
  const doc = await db.query.documents.findFirst({ where: eq(documents.id, documentId) });
  if (!doc) throw new Error(`document ${documentId} not found`);

  if (!ALLOWED_MIME.includes(doc.mime) || doc.size > MAX_SIZE_BYTES) {
    await db.update(documents).set({ status: "rejected" }).where(eq(documents.id, documentId));
    return { status: "rejected" as const };
  }

  const bytes = doc.storageKey && !doc.storageKey.startsWith("mock/") ? await getObject(doc.storageKey) : new Uint8Array();
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
  await db.update(documents).set({ status: "ready" }).where(eq(documents.id, documentId));
  await enqueue("notify", { userId, category: "verification", title: `We found ${proposedFacts.length} facts in ${doc.title} — review them`, link: `/app/documents/${documentId}` });
  return { extractionId: ext!.id, count: proposedFacts.length };
}
