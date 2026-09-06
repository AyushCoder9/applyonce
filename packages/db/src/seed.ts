/** Seed for mock env. Idempotent-ish: run after reset. Demo users per docs/03 §4. */
import { and, eq, isNull } from "drizzle-orm";
import { db, sql } from "./client";
import * as t from "./schema";
import { getDek } from "./keys";
import { putFact } from "./facts";
import { AARAV, SUNITA, VIKRAM, RIYA, KAMLA, docToFacts, sampleDocument, type DemoPerson } from "@applyonce/providers/fixtures";
import { sha256, encrypt, kekFromEnv } from "@applyonce/crypto";
import { hkdfSync } from "node:crypto";

const sysKey = () => Buffer.from(hkdfSync("sha256", kekFromEnv(), "applyonce", "system-payload-key", 32));
const days = (d: number) => new Date(Date.now() + d * 864e5);

async function seedPerson(p: DemoPerson) {
  await db.insert(t.user).values({ id: p.id, name: p.name, email: p.email, emailVerified: true, phoneNumber: `+91${p.phone}`, phoneNumberVerified: true, locale: p.locale }).onConflictDoNothing();
  let prof = await db.query.profiles.findFirst({ where: and(eq(t.profiles.ownerUserId, p.id), eq(t.profiles.kind, "self"), eq(t.profiles.status, "active"), isNull(t.profiles.claimedByUserId)) });
  if (!prof) [prof] = await db.insert(t.profiles).values({ ownerUserId: p.id, kind: "self", displayName: p.name, dobYear: Number(p.dob.slice(0, 4)) }).returning();
  const dek = await getDek(p.id);
  const pid = prof!.id;
  await db.insert(t.providerLinks).values({ userId: p.id, provider: "digilocker", status: "linked", lastSyncAt: new Date(), meta: { ref: `dl_${p.id}` } })
    .onConflictDoUpdate({ target: [t.providerLinks.userId, t.providerLinks.provider], set: { status: "linked", lastSyncAt: new Date(), meta: { ref: `dl_${p.id}` } } });
  // documents + issuer-verified facts (as if DigiLocker sync ran)
  for (const d of p.docs) {
    const sample = sampleDocument(d.docType,d.name);
    let doc = await db.query.documents.findFirst({ where: and(eq(t.documents.profileId, pid), eq(t.documents.docUri, d.uri)) });
    if (!doc) [doc] = await db.insert(t.documents).values({ profileId: pid, docType: d.docType, title: d.name, issuerId: d.issuerId, issuerName: d.issuerName, docUri: d.uri, storageKey: `mock/${p.id}/${d.uri}.pdf`, mime: sample.mime, size: sample.bytes.length, sha256: sha256(sample.bytes), origin: "digilocker", issuedAt: d.issuedAt ? new Date(d.issuedAt) : null, validUntil: d.validUntil ? new Date(d.validUntil) : null, status: "ready", meta: d.data ?? {} }).returning();
    for (const f of docToFacts(d, p)) await putFact(dek, { profileId: pid, key: f.key, value: f.value as never, source: "issuer_verified", verifiedBy: f.verifiedBy, evidenceDocumentId: doc!.id, expiresAt: f.expiresAt ? new Date(f.expiresAt) : null, verifiedAt: new Date() });
    const fileKey = ({ marksheet_10: "education.class10.marksheet", marksheet_12: "education.class12.marksheet", category_cert: "category.certificate", income_cert: "family.income_certificate", domicile_cert: "category.domicile_certificate", degree: "education.graduation.certificate" } as Record<string, string>)[d.docType];
    if (fileKey) await putFact(dek, { profileId: pid, key: fileKey, value: doc!.id, source: "issuer_verified", verifiedBy: "digilocker", evidenceDocumentId: doc!.id });
  }
  for (const docType of ["photo","signature"]) {
    const title = `Sample ${docType} - replace for a real application`;
    const sample = sampleDocument(docType,title);
    const storageKey = `mock/${p.id}/${docType}.png`;
    const exists = await db.query.documents.findFirst({ where: and(eq(t.documents.profileId, pid), eq(t.documents.storageKey, storageKey)) });
    if (!exists) await db.insert(t.documents).values({profileId:pid,docType,title,storageKey,mime:sample.mime,size:sample.bytes.length,sha256:sha256(sample.bytes),origin:"generated",status:"ready",meta:{sample:true}});
  }
  await putFact(dek, { profileId: pid, key: "contact.mobile_primary", value: p.phone, source: "provider_verified", verifiedBy: "otp" });
  if (p.apaar) await putFact(dek, { profileId: pid, key: "identity.apaar_id", value: p.apaar, source: "issuer_verified", verifiedBy: "apaar" });
  if (p.abha) await putFact(dek, { profileId: pid, key: "identity.abha_id", value: p.abha, source: "provider_verified", verifiedBy: "abdm" });
  for (const [k, v] of Object.entries(p.selfFacts)) await putFact(dek, { profileId: pid, key: k, value: v as never, source: "self_declared" });
  return { pid, dek };
}

async function seedDependent(ownerUserId: string, guardianPid: string, d: { name: string; dob: string; facts: Record<string, unknown> }, basis: "minor" | "elder_consent", relation: string, scope: string[]) {
  let prof = await db.query.profiles.findFirst({ where: and(eq(t.profiles.ownerUserId, ownerUserId), eq(t.profiles.kind, "dependent"), eq(t.profiles.displayName, d.name), eq(t.profiles.status, "active")) });
  if (!prof) [prof] = await db.insert(t.profiles).values({ ownerUserId, kind: "dependent", displayName: d.name, dobYear: Number(d.dob.slice(0, 4)) }).returning();
  await db.insert(t.relations).values({ guardianProfileId: guardianPid, wardProfileId: prof!.id, relation, basis, scope, validUntil: basis === "elder_consent" ? days(365) : null }).onConflictDoNothing();
  const dek = await getDek(ownerUserId);
  for (const [k, v] of Object.entries(d.facts)) await putFact(dek, { profileId: prof!.id, key: k, value: v as never, source: "self_declared" });
  return prof!.id;
}

async function seedPartner(o: { slug: string; name: string; kind: typeof t.partnerKind.enumValues[number]; website: string; apiKey: string; webhookSecret?: string; webhookUrl?: string; ownerUserId: string }) {
  let p = await db.query.partners.findFirst({ where: eq(t.partners.slug, o.slug) });
  if (!p) [p] = await db.insert(t.partners).values({ slug: o.slug, name: o.name, legalName: o.name, kind: o.kind, website: o.website, status: "verified", dpoEmail: `dpo@${o.slug}.example` }).returning();
  await db.insert(t.partnerMembers).values({ partnerId: p!.id, userId: o.ownerUserId, role: "owner" }).onConflictDoNothing();
  await db.insert(t.partnerApiKeys).values({ partnerId: p!.id, env: "sandbox", keyHash: sha256(o.apiKey), prefix: o.apiKey.slice(0, 14), label: "Demo sandbox key" }).onConflictDoNothing();
  if (o.webhookUrl && o.webhookSecret) {
    const hook = await db.query.partnerWebhooks.findFirst({ where: and(eq(t.partnerWebhooks.partnerId, p!.id), eq(t.partnerWebhooks.url, o.webhookUrl)) });
    if (!hook) await db.insert(t.partnerWebhooks).values({ partnerId: p!.id, url: o.webhookUrl, secretEnc: encrypt(sysKey(), o.webhookSecret, `webhook:${p!.id}`) });
  }
  return p!.id;
}

const req = (keys: string[], optional: string[] = []) => [...keys.map((key) => ({ key, required: true })), ...optional.map((key) => ({ key, required: false }))];
async function seedForm(values: typeof t.forms.$inferInsert) {
  let form = await db.query.forms.findFirst({ where: eq(t.forms.slug, values.slug) });
  if (!form) [form] = await db.insert(t.forms).values(values).returning();
  return form!;
}

async function main() {
  console.log("seeding…");
  const aarav = await seedPerson(AARAV);
  const sunita = await seedPerson(SUNITA);
  const vikram = await seedPerson(VIKRAM);
  const riya = await seedDependent(SUNITA.id, sunita.pid, RIYA, "minor", "child", ["*"]);
  await seedDependent(SUNITA.id, sunita.pid, KAMLA, "elder_consent", "grandparent", ["identity", "health", "bank"]);

  // partner staff user
  await db.insert(t.user).values({ id: "usr_bta_admin", name: "BTA Admin", email: "admin@bta.example", emailVerified: true, phoneNumber: "+919000000001", phoneNumberVerified: true, role: "citizen" }).onConflictDoNothing();
  await db.insert(t.user).values({ id: "usr_admin", name: "ApplyOnce Ops", email: "ops@applyonce.example", emailVerified: true, phoneNumber: "+919000000000", phoneNumberVerified: true, role: "admin" }).onConflictDoNothing();
  if (!await db.query.profiles.findFirst({ where: and(eq(t.profiles.ownerUserId, "usr_bta_admin"), eq(t.profiles.kind, "self")) }))
    await db.insert(t.profiles).values({ ownerUserId: "usr_bta_admin", kind: "self", displayName: "BTA Admin" });
  if (!await db.query.profiles.findFirst({ where: and(eq(t.profiles.ownerUserId, "usr_admin"), eq(t.profiles.kind, "self")) }))
    await db.insert(t.profiles).values({ ownerUserId: "usr_admin", kind: "self", displayName: "ApplyOnce Ops" });

  const demoUrl = process.env.NEXT_PUBLIC_DEMO_PORTAL_URL ?? "http://localhost:3301";
  const bta = await seedPartner({ slug: "bta", name: "Bharat Test Agency", kind: "exam_board", website: "https://bta.example", apiKey: process.env.BTA_APPLYONCE_API_KEY ?? "pk_sandbox_bta_demo_key_0001", webhookSecret: process.env.BTA_WEBHOOK_SECRET ?? "whsec_bta_demo_0001", webhookUrl: `${demoUrl}/api/applyonce/webhook`, ownerUserId: "usr_bta_admin" });
  const nova = await seedPartner({ slug: "nova-university", name: "Nova University", kind: "university", website: "https://nova.example", apiKey: "pk_sandbox_nova_demo_key_0002", ownerUserId: "usr_bta_admin" });
  const bank = await seedPartner({ slug: "axis-style-bank", name: "Axis-style Bank (sandbox)", kind: "bank", website: "https://bank.example", apiKey: "pk_sandbox_bank_demo_key_0003", ownerUserId: "usr_bta_admin" });

  const EXAM = [
    "identity.full_name", "identity.dob", "identity.gender", "identity.nationality", "identity.photo", "identity.signature", "identity.apaar_id",
    "contact.mobile_primary", "contact.email_primary",
    "address.permanent.line1", "address.permanent.line2", "address.permanent.village_town", "address.permanent.district", "address.permanent.state", "address.permanent.pincode",
    "address.current.line1", "address.current.village_town", "address.current.district", "address.current.state", "address.current.pincode",
    "family.father.name", "family.father.occupation", "family.father.mobile", "family.mother.name", "family.mother.occupation", "family.annual_income_total",
    "category.social", "category.certificate_no", "category.valid_until", "category.certificate", "category.pwd", "category.domicile_state",
    "education.class10.board", "education.class10.year", "education.class10.roll_no", "education.class10.percentage", "education.class10.school_name", "education.class10.marksheet",
    "education.class12.board", "education.class12.year", "education.class12.roll_no", "education.class12.percentage", "education.class12.school_name", "education.class12.stream", "education.class12.marksheet",
  ];
  const btaForm = await seedForm({ partnerId: bta, slug: process.env.BTA_APPLYONCE_FORM_ID ?? "bta-jee-2026", name: "BTA-JEE 2026 Registration", description: "Joint Entrance Examination (Sample) — Session 1", purpose: "exam_application", kind: "exam",
    requestedFields: req(EXAM, ["identity.aadhaar_last4", "identity.blood_group", "category.udid_no", "category.pwd_type", "category.scribe_required", "family.parent_govt_servant"]),
    customFields: [
      { id: "exam_city_1", label: "Exam city preference 1", type: "enum", required: true, options: ["Lucknow", "Kanpur", "Delhi", "Mumbai", "Hyderabad", "Bengaluru", "Kolkata", "Patna"] },
      { id: "exam_city_2", label: "Exam city preference 2", type: "enum", required: true, options: ["Lucknow", "Kanpur", "Delhi", "Mumbai", "Hyderabad", "Bengaluru", "Kolkata", "Patna"] },
      { id: "paper", label: "Paper", type: "enum", required: true, options: ["Paper 1 (B.E./B.Tech)", "Paper 2A (B.Arch)", "Paper 2B (B.Planning)"] },
      { id: "medium", label: "Question paper medium", type: "enum", required: true, options: ["English", "Hindi", "Gujarati", "Bengali", "Tamil"] },
      { id: "declaration", label: "I declare the information is true", type: "bool", required: true },
    ],
    retentionDays: 730, redirectUrl: `${demoUrl}/apply/return`, webhookUrl: `${demoUrl}/api/applyonce/webhook`, deadlineAt: days(21) });

  await seedForm({ partnerId: nova, slug: "nova-btech-2026", name: "Nova University B.Tech Admissions 2026", purpose: "college_admission", kind: "admission",
    requestedFields: req(["identity.full_name", "identity.dob", "identity.gender", "contact.mobile_primary", "contact.email_primary", "address.permanent.state", "address.permanent.pincode", "family.father.name", "family.mother.name", "family.annual_income_total", "category.social", "education.class12.board", "education.class12.percentage", "education.class12.marksheet", "education.exam_scores.exam", "education.exam_scores.percentile"]),
    customFields: [{ id: "branch_pref", label: "Branch preference", type: "enum", required: true, options: ["CSE", "ECE", "Mechanical", "Civil", "AI & DS"] }], redirectUrl: "https://nova.example/return", deadlineAt: days(45) });
  await seedForm({ partnerId: bank, slug: "savings-account-kyc", name: "Savings Account KYC", purpose: "kyc_financial", kind: "kyc",
    requestedFields: req(["identity.full_name", "identity.dob", "identity.gender", "identity.pan", "identity.aadhaar_last4", "identity.photo", "identity.signature", "contact.mobile_primary", "contact.email_primary", "address.permanent.line1", "address.permanent.village_town", "address.permanent.district", "address.permanent.state", "address.permanent.pincode", "family.father.name", "family.mother.name", "identity.marital_status", "employment.current.employer", "employment.current.ctc", "family.nominee.name", "family.nominee.relation"]),
    customFields: [{ id: "branch_code", label: "Preferred branch", type: "string", required: false }], redirectUrl: "https://bank.example/return" });

  // Aarav: an older application to show tracker history
  let app = await db.query.applications.findFirst({ where: and(eq(t.applications.profileId, aarav.pid), eq(t.applications.externalRef, "NOVA-2026-001742")) });
  if (!app) {
    [app] = await db.insert(t.applications).values({ profileId: aarav.pid, partnerId: nova, title: "Nova University B.Tech Admissions 2026", orgName: "Nova University", kind: "admission", status: "under_review", externalRef: "NOVA-2026-001742", submittedAt: days(-6), deadlineAt: days(45), source: "sdk" }).returning();
    await db.insert(t.applicationEvents).values([
      { applicationId: app!.id, type: "created", title: "Application submitted via ApplyOnce", actor: "citizen", createdAt: days(-6) },
      { applicationId: app!.id, type: "status", title: "Received by Nova University", body: "Reference NOVA-2026-001742", actor: "partner", createdAt: days(-6) },
      { applicationId: app!.id, type: "status", title: "Under review", body: "Documents verified. Merit list expected in 3 weeks.", actor: "partner", createdAt: days(-2) },
    ]);
  }
  if (!await db.query.applications.findFirst({ where: and(eq(t.applications.profileId, aarav.pid), eq(t.applications.title, "NSP Post-Matric Scholarship 2026-27")) }))
    await db.insert(t.applications).values({ profileId: aarav.pid, title: "NSP Post-Matric Scholarship 2026-27", orgName: "National Scholarship Portal", kind: "scholarship", status: "draft", deadlineAt: days(12), source: "manual", portalUrl: "https://scholarships.gov.in" });
  for (const notification of [
    { userId: AARAV.id, category: "expiry", title: "OBC-NCL certificate expires in 40 days", body: "Re-fetch a fresh certificate from DigiLocker before your next application.", link: "/app/verify" },
    { userId: AARAV.id, category: "application", title: "Nova University: under review", body: "Merit list expected in 3 weeks.", link: `/app/applications/${app!.id}` },
  ]) if (!await db.query.notifications.findFirst({ where: and(eq(t.notifications.userId, notification.userId), eq(t.notifications.title, notification.title)) }))
    await db.insert(t.notifications).values(notification);
  await db.insert(t.flags).values([{ key: "extension", enabled: true }, { key: "partner_self_serve", enabled: true }, { key: "hindi_ui", enabled: true }]).onConflictDoNothing();
  console.log(`seeded: aarav=${aarav.pid} sunita=${sunita.pid} riya=${riya} vikram=${vikram.pid} bta=${bta} form=${btaForm!.id}`);
}

await main();
await sql.end();
