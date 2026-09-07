/**
 * Inline job runner (APPLYONCE_INLINE_JOBS=1). Mirrors the worker's verification/document handlers using @applyonce/providers
 * so the demo works before/without apps/worker. Fire-and-forget: `enqueue()` returns at once, progress streams via SSE.
 */
import { db, t, eq, and, getDek, putFact, getFacts } from "@applyonce/db";
import type { JobMap, JobName } from "@applyonce/jobs";
import { providers, docToFacts } from "@applyonce/providers";
import { isFactKey, field } from "@applyonce/schema";
import { encrypt, sha256 } from "@applyonce/crypto";
import { getBytes, isMockKey } from "./storage";

type Progress = { step: string; pct: number; log: string[] };
const FILE_KEY: Record<string, string> = { marksheet_10: "education.class10.marksheet", marksheet_12: "education.class12.marksheet", category_cert: "category.certificate", income_cert: "family.income_certificate", domicile_cert: "category.domicile_certificate", degree: "education.graduation.certificate" };
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

async function progress(jobId: string, p: Progress, status: "running" | "succeeded" | "failed" = "running", extra: Partial<typeof t.verificationJobs.$inferInsert> = {}) {
  await db.update(t.verificationJobs).set({ status, progress: p, ...(status !== "running" ? { finishedAt: new Date() } : {}), ...extra }).where(eq(t.verificationJobs.id, jobId));
}
const notify = (userId: string, category: string, title: string, body?: string, link?: string) => db.insert(t.notifications).values({ userId, category, title, body, link });
async function linkProvider(userId: string, provider: typeof t.providerName.enumValues[number], ref: string, meta: Record<string, unknown> = {}) {
  const dek = await getDek(userId);
  const row = { userId, provider, providerRefEnc: encrypt(dek, ref, `provider:${userId}:${provider}`), status: "linked", lastSyncAt: new Date(), meta };
  await db.insert(t.providerLinks).values(row).onConflictDoUpdate({ target: [t.providerLinks.userId, t.providerLinks.provider], set: row });
}

async function digilockerSync({ jobId, userId, profileId, providerRef }: JobMap["digilocker.sync"]) {
  const log: string[] = [];
  const step = (s: string, pct: number) => { log.push(s); return progress(jobId, { step: s, pct, log: log.slice(-12) }); };
  const dek = await getDek(userId);
  await step("Connecting to DigiLocker…", 5);
  const [docs, aadhaar] = await Promise.all([providers.digilocker.listIssuedDocs(providerRef), providers.digilocker.fetchAadhaarXml(providerRef).catch(() => null)]);
  await step(`Found ${docs.length} issued documents`, 15);
  let factCount = 0;
  for (const [i, d] of docs.entries()) {
    const pct = 15 + Math.round(((i + 1) / docs.length) * 80);
    const existing = await db.query.documents.findFirst({ where: and(eq(t.documents.profileId, profileId), eq(t.documents.docUri, d.uri)) });
    let docId = existing?.id;
    if (!docId) {
      const fetched = await providers.digilocker.fetchDoc(providerRef, d.uri).catch(() => null);
      const [ins] = await db.insert(t.documents).values({ profileId, docType: d.docType, title: d.name, issuerId: d.issuerId, issuerName: d.issuerName, docUri: d.uri, storageKey: `mock/${userId}/${d.uri}.pdf`, mime: d.mime, size: fetched?.bytes.length ?? 0, sha256: fetched ? sha256(Buffer.from(fetched.bytes)) : null, origin: "digilocker", issuedAt: d.issuedAt ? new Date(d.issuedAt) : null, validUntil: d.validUntil ? new Date(d.validUntil) : null, status: "ready", meta: d.data ?? {} }).returning({ id: t.documents.id });
      docId = ins!.id;
    }
    const person = { aadhaar: aadhaar ?? { name: "", dob: "", gender: "M" as const, address: { vtc: "", district: "", state: "", pincode: "", country: "" }, last4: "", referenceKey: "", xmlHash: "", generatedAt: "" }, pan: undefined as string | undefined };
    const facts = d.docType === "aadhaar" && !aadhaar ? [] : docToFacts(d, person);
    for (const f of facts) {
      if (!isFactKey(f.key) || f.value == null || f.value === "") continue;
      const r = await putFact(dek, { profileId, key: f.key, value: f.value as never, source: "issuer_verified", verifiedBy: f.verifiedBy, evidenceDocumentId: docId, expiresAt: f.expiresAt ? new Date(f.expiresAt) : null, verifiedAt: new Date() }).catch(() => null);
      if (r && r.status !== "unchanged") factCount++;
    }
    const fileKey = FILE_KEY[d.docType];
    if (fileKey) await putFact(dek, { profileId, key: fileKey, value: docId, source: "issuer_verified", verifiedBy: "digilocker", evidenceDocumentId: docId }).catch(() => null);
    await step(`${d.issuerName} · ${d.name}`, pct);
    await sleep(350); // let the UI show the stamp sweep
  }
  await db.update(t.providerLinks).set({ lastSyncAt: new Date(), status: "linked" }).where(and(eq(t.providerLinks.userId, userId), eq(t.providerLinks.provider, "digilocker")));
  await progress(jobId, { step: "Done", pct: 100, log }, "succeeded", { resultJson: { documents: docs.length, facts: factCount } });
  await notify(userId, "verification", `DigiLocker synced: ${docs.length} documents`, `${factCount} source-asserted facts added. Check Status for the provider mode.`, "/app/vault");
}

async function documentProcess({ documentId, userId, profileId }: JobMap["document.process"]) {
  const doc = await db.query.documents.findFirst({ where: eq(t.documents.id, documentId) });
  if (!doc) return;
  const bytes = isMockKey(doc.storageKey) ? new Uint8Array() : await getBytes(doc.storageKey!).catch(() => new Uint8Array());
  const ocr = await providers.ocr.extract(bytes, doc.docType);
  const proposedFacts = Object.entries(ocr.fields).filter(([k]) => isFactKey(k) && !field(k).system).map(([key, value]) => ({ key, value, confidence: ocr.confidence }));
  await db.insert(t.documentExtractions).values({ documentId, provider: "ocr", rawJson: (ocr.raw ?? ocr.fields) as never, proposedFacts, confidence: ocr.confidence });
  await db.update(t.documents).set({ status: "ready", size: doc.size || bytes.length }).where(eq(t.documents.id, documentId));
  await notify(userId, "verification", `We found ${proposedFacts.length} facts in ${doc.title}`, "Review them before adding them to your profile.", `/app/documents/${documentId}`);
  void profileId;
}

async function panVerify({ jobId, userId, profileId, pan }: JobMap["pan.verify"]) {
  const dek = await getDek(userId);
  await progress(jobId, { step: "Checking with Income Tax Dept…", pct: 30, log: [] });
  const facts = await getFacts(dek, profileId, { keys: ["identity.full_name", "identity.dob"] });
  const name = String(facts.find((f) => f.key === "identity.full_name")?.value ?? ""), dob = String(facts.find((f) => f.key === "identity.dob")?.value ?? "");
  const r = await providers.pan.verify(pan, name, dob);
  if (!r.valid) return progress(jobId, { step: "PAN not valid", pct: 100, log: [] }, "failed", { error: `PAN status: ${r.status ?? "INVALID"}` });
  const put = await putFact(dek, { profileId, key: "identity.pan", value: pan, source: "provider_verified", verifiedBy: "nsdl_pan", confidence: r.nameMatch, verifiedAt: new Date() });
  await linkProvider(userId, "pan", pan.slice(-4), { nameMatch: r.nameMatch });
  await progress(jobId, { step: put.status === "mismatch" ? "PAN valid but name differs — see mismatches" : "PAN verified", pct: 100, log: [] }, "succeeded", { resultJson: { ...r, put: put.status } });
  await notify(userId, "verification", "PAN verified", `Name match ${Math.round(r.nameMatch * 100)}%`, "/app/vault/identity");
}

async function abhaLink({ jobId, userId, profileId, providerRef }: JobMap["abha.link"]) {
  const dek = await getDek(userId);
  await progress(jobId, { step: "Fetching ABHA profile…", pct: 40, log: [] });
  const p = await providers.abha.profile(providerRef);
  await putFact(dek, { profileId, key: "identity.abha_id", value: p.abhaNumber, source: "provider_verified", verifiedBy: "abdm", verifiedAt: new Date() }).catch(() => null);
  if (p.bloodGroup) await putFact(dek, { profileId, key: "identity.blood_group", value: p.bloodGroup, source: "provider_verified", verifiedBy: "abdm", verifiedAt: new Date() }).catch(() => null);
  await linkProvider(userId, "abha", providerRef, { abhaAddress: p.abhaAddress });
  await progress(jobId, { step: "ABHA linked", pct: 100, log: [] }, "succeeded", { resultJson: { abhaAddress: p.abhaAddress } });
  await notify(userId, "verification", "ABHA linked", p.abhaAddress, "/app/vault/identity");
}

async function aaIncome({ jobId, userId, profileId, consentHandle }: JobMap["aa.income"]) {
  const dek = await getDek(userId);
  await progress(jobId, { step: "Fetching bank statement summary…", pct: 40, log: [] });
  const s = await providers.aa.fetchIncomeSummary(consentHandle);
  await putFact(dek, { profileId, key: "family.annual_income_total", value: s.annualIncome, source: "provider_verified", verifiedBy: "account_aggregator", verifiedAt: new Date(), expiresAt: new Date(Date.now() + 365 * 864e5) }).catch(() => null);
  await linkProvider(userId, "aa", consentHandle, { period: s.period, accounts: s.accounts });
  await progress(jobId, { step: "Income verified", pct: 100, log: [] }, "succeeded", { resultJson: s });
  await notify(userId, "verification", "Income verified via Account Aggregator", `₹${s.annualIncome.toLocaleString("en-IN")} · ${s.period}`, "/app/vault/family");
}

const HANDLERS: { [N in JobName]?: (d: JobMap[N]) => Promise<unknown> } = { "digilocker.sync": digilockerSync, "document.process": documentProcess, "pan.verify": panVerify, "abha.link": abhaLink, "aa.income": aaIncome };

export async function runInline(name: string, data: unknown) {
  const h = HANDLERS[name as JobName] as ((d: unknown) => Promise<unknown>) | undefined;
  if (!h) { console.log(`[inline-jobs] no inline handler for ${name}; left for worker`); return; }
  try { await h(data); }
  catch (e) {
    console.error(`[inline-jobs] ${name} failed`, e);
    const jobId = (data as { jobId?: string }).jobId;
    if (jobId) await progress(jobId, { step: "Failed", pct: 100, log: [] }, "failed", { error: String((e as Error).message) }).catch(() => {});
  }
}

export function registerInlineJobs() {
  const g = globalThis as { __applyonceInlineJobs?: (n: string, d: unknown) => Promise<void> };
  // Serverless functions can be suspended as soon as a response completes, so
  // the production fallback must finish its supported work before returning.
  g.__applyonceInlineJobs = async (name, data) => { await runInline(name, data); };
  console.log("[inline-jobs] registered (APPLYONCE_INLINE_JOBS=1)");
}
