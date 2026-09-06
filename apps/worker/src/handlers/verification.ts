/** verification queue: digilocker.sync, pan.verify, aa.income, abha.link */
import { randomUUID } from "node:crypto";
import { db, eq, and, getDek, putFact, getFacts, documents, providerLinks, verificationJobs, mismatches } from "@applyonce/db";
import { decryptString, sha256 } from "@applyonce/crypto";
import { providers, docToFacts, type AadhaarOfflineKyc } from "@applyonce/providers";
import { enqueue, type JobMap } from "@applyonce/jobs";
import { putObject } from "../s3";
import { logger } from "../logger";

/** file facts linked to the underlying document id, keyed by docType (see docs/05 F1 step 3) */
const FILE_FACT_KEY: Record<string, string> = {
  marksheet_10: "education.class10.marksheet",
  marksheet_12: "education.class12.marksheet",
  category_cert: "category.certificate",
  income_cert: "family.income_certificate",
  domicile_cert: "category.domicile_certificate",
  degree: "education.graduation.certificate",
};

async function setProgress(jobId: string, step: string, pct: number, logLine?: string) {
  const row = await db.query.verificationJobs.findFirst({ where: eq(verificationJobs.id, jobId) });
  const log = row?.progress?.log ?? [];
  await db.update(verificationJobs).set({ status: "running", progress: { step, pct, log: logLine ? [...log, logLine] : log } }).where(eq(verificationJobs.id, jobId));
}
async function finishJob(jobId: string, resultJson: unknown) {
  await db.update(verificationJobs).set({ status: "succeeded", resultJson: resultJson as never, finishedAt: new Date() }).where(eq(verificationJobs.id, jobId));
}
async function failJob(jobId: string, message: string) {
  await db.update(verificationJobs).set({ status: "failed", error: message, finishedAt: new Date() }).where(eq(verificationJobs.id, jobId));
}

export async function digilockerSync(data: JobMap["digilocker.sync"]) {
  const { jobId, userId, profileId } = data;
  try {
    await setProgress(jobId, "starting", 5);
    const dek = await getDek(userId);
    const link = await db.query.providerLinks.findFirst({ where: and(eq(providerLinks.userId, userId), eq(providerLinks.provider, "digilocker")) });
    const metaRef = (link?.meta as { ref?: string } | null)?.ref;
    const ref = metaRef ?? (link?.providerRefEnc ? decryptString(dek, link.providerRefEnc, `provider:${userId}:digilocker`) : data.providerRef);
    if (!ref) throw new Error("no digilocker provider ref for user");

    const docs = await providers.digilocker.listIssuedDocs(ref);
    let created = 0, updated = 0, mismatchCount = 0, factCount = 0;
    let aadhaarXml: AadhaarOfflineKyc | undefined;

    for (let i = 0; i < docs.length; i++) {
      const doc = docs[i]!;
      const year = (doc.data?.year as number | string | undefined) ?? (doc.issuedAt ? new Date(doc.issuedAt).getFullYear() : undefined);
      await setProgress(jobId, "processing", Math.round(10 + ((i + 1) / docs.length) * 80), `Found ${doc.name}${year ? " · " + year : ""}`);

      const fetched = await providers.digilocker.fetchDoc(ref, doc.uri);
      const key = `users/${userId}/docs/${randomUUID()}.pdf`;
      await putObject(key, fetched.bytes, fetched.mime);

      const existingDoc = await db.query.documents.findFirst({ where: and(eq(documents.profileId, profileId), eq(documents.docUri, doc.uri)) });
      const docRow = existingDoc
        ? (await db.update(documents).set({ title: doc.name, issuerId: doc.issuerId, issuerName: doc.issuerName, storageKey: key, mime: fetched.mime, size: fetched.bytes.byteLength, sha256: sha256(Buffer.from(fetched.bytes)), origin: "digilocker", issuedAt: doc.issuedAt ? new Date(doc.issuedAt) : null, validUntil: doc.validUntil ? new Date(doc.validUntil) : null, status: "ready", meta: doc.data ?? {} }).where(eq(documents.id, existingDoc.id)).returning())[0]
        : (await db.insert(documents).values({ profileId, docType: doc.docType, title: doc.name, issuerId: doc.issuerId, issuerName: doc.issuerName, docUri: doc.uri, storageKey: key, mime: fetched.mime, size: fetched.bytes.byteLength, sha256: sha256(Buffer.from(fetched.bytes)), origin: "digilocker", issuedAt: doc.issuedAt ? new Date(doc.issuedAt) : null, validUntil: doc.validUntil ? new Date(doc.validUntil) : null, status: "ready", meta: doc.data ?? {} }).returning())[0];
      if (existingDoc) updated++; else created++;

      if (doc.docType === "aadhaar" && !aadhaarXml) aadhaarXml = await providers.digilocker.fetchAadhaarXml(ref);
      const person = { aadhaar: aadhaarXml ?? ({} as AadhaarOfflineKyc) };
      for (const f of docToFacts(doc, person)) {
        const res = await putFact(dek, { profileId, key: f.key, value: f.value as never, source: "issuer_verified", verifiedBy: f.verifiedBy, evidenceDocumentId: docRow!.id, expiresAt: f.expiresAt ? new Date(f.expiresAt) : null, verifiedAt: new Date() });
        if (res.status === "mismatch") mismatchCount++;
        else if (res.status === "created" || res.status === "updated") factCount++;
      }
      const fileKey = FILE_FACT_KEY[doc.docType];
      if (fileKey) await putFact(dek, { profileId, key: fileKey, value: docRow!.id, source: "issuer_verified", verifiedBy: "digilocker", evidenceDocumentId: docRow!.id });
    }

    await db.update(providerLinks).set({ lastSyncAt: new Date() }).where(and(eq(providerLinks.userId, userId), eq(providerLinks.provider, "digilocker")));
    const result = { docs: created + updated, facts: factCount, mismatches: mismatchCount };
    await finishJob(jobId, result);
    await enqueue("notify", { userId, category: "verification", title: `DigiLocker sync complete: ${factCount} verified facts`, link: "/app/verify" });
    return result;
  } catch (err) {
    const message = (err as Error).message;
    logger.error({ err, jobId }, "digilocker.sync failed");
    await failJob(jobId, message);
    throw err;
  }
}

export async function panVerify(data: JobMap["pan.verify"]) {
  const { userId, profileId, pan } = data;
  const dek = await getDek(userId);
  const existing = await getFacts(dek, profileId, { keys: ["identity.full_name", "identity.dob"] });
  const nameFact = existing.find((f) => f.key === "identity.full_name");
  const dobFact = existing.find((f) => f.key === "identity.dob");
  const name = (nameFact?.value as string) ?? "";
  const dob = (dobFact?.value as string) ?? "";
  const res = await providers.pan.verify(pan, name, dob);
  if (res.valid) {
    await putFact(dek, { profileId, key: "identity.pan", value: pan, source: "provider_verified", verifiedBy: "nsdl_pan" });
    if (res.nameMatch < 0.8) {
      await db.insert(mismatches).values({ profileId, factKey: "identity.full_name", sourceA: nameFact?.source ?? "self_declared", valueA: name, sourceB: "nsdl_pan", valueB: `PAN ${pan} name match ${Math.round(res.nameMatch * 100)}%`, severity: "high" });
    }
  }
  return res;
}

export async function aaIncome(data: JobMap["aa.income"]) {
  const { userId, profileId, consentHandle } = data;
  const dek = await getDek(userId);
  const res = await providers.aa.fetchIncomeSummary(consentHandle);
  await putFact(dek, { profileId, key: "family.annual_income_total", value: res.annualIncome, source: "provider_verified", verifiedBy: "account_aggregator" });
  return res;
}

export async function abhaLink(data: JobMap["abha.link"]) {
  const { userId, profileId, providerRef } = data;
  const dek = await getDek(userId);
  const p = await providers.abha.profile(providerRef);
  await putFact(dek, { profileId, key: "identity.abha_id", value: p.abhaNumber, source: "provider_verified", verifiedBy: "abdm" });
  if (p.bloodGroup) await putFact(dek, { profileId, key: "identity.blood_group", value: p.bloodGroup, source: "provider_verified", verifiedBy: "abdm" });
  return p;
}
