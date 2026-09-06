/**
 * DEMO_OFFLINE fixture — a hand-built ApplyOncePayload standing in for a real
 * `POST /partner/share-sessions/:id/exchange` response, so `/apply/return` and
 * `/status/[ref]` can be demoed with WP2's ApplyOnce partner API not running.
 *
 * Values are taken from `packages/providers/src/fixtures.ts`'s AARAV demo person,
 * mapped onto exactly the `bta-jee-2026` form's requested fields (see
 * `packages/db/src/seed.ts`) — not imported (this package can't depend on
 * `@applyonce/providers`), just mirrored by hand.
 */
import { createHash } from "node:crypto";
import type { ApplyOncePayload, SharedFact } from "@applyonce/schema";

const inDays = (d: number) => new Date(Date.now() + d * 864e5).toISOString().slice(0, 10);
const sha256 = (s: string) => createHash("sha256").update(s).digest("hex");

function verified(key: string, value: SharedFact["value"], verifiedBy: string, evidenceTitle?: string, provider = false): SharedFact {
  const fact: SharedFact = { key, value, source: provider ? "provider_verified" : "issuer_verified", verifiedBy, verifiedAt: new Date().toISOString() };
  if (evidenceTitle) fact.evidence = { documentId: `doc_offline_${sha256(key).slice(0, 8)}`, sha256: sha256(evidenceTitle), title: evidenceTitle };
  return fact;
}

function selfDeclared(key: string, value: SharedFact["value"], evidenceTitle?: string): SharedFact {
  const fact: SharedFact = { key, value, source: "self_declared" };
  if (evidenceTitle) fact.evidence = { documentId: `doc_offline_${sha256(key).slice(0, 8)}`, sha256: sha256(evidenceTitle), title: evidenceTitle };
  return fact;
}

/** All 47 shared facts (45 required + 2 of the 6 optional fields) for AARAV, mapped onto BTA's requested keys. */
function buildFacts(): SharedFact[] {
  return [
    // ---- issuer / provider verified (green) ----
    verified("identity.full_name", "Aarav Sharma", "uidai"),
    verified("identity.dob", "2007-03-14", "uidai"),
    verified("identity.gender", "M", "uidai"),
    verified("identity.aadhaar_last4", "4321", "uidai"),
    verified("identity.apaar_id", "123456789012", "apaar"),
    verified("address.permanent.line1", "B-14, Gomti Nagar Extension", "uidai"),
    verified("address.permanent.line2", "Sector 4", "uidai"),
    verified("address.permanent.village_town", "Lucknow", "uidai"),
    verified("address.permanent.district", "Lucknow", "uidai"),
    verified("address.permanent.state", "Uttar Pradesh", "uidai"),
    verified("address.permanent.pincode", "226010", "uidai"),
    verified("contact.mobile_primary", "9876543210", "otp", undefined, true),
    verified("education.class10.board", "CBSE", "cbse"),
    verified("education.class10.year", 2023, "cbse"),
    verified("education.class10.roll_no", "4512345", "cbse"),
    verified("education.class10.percentage", 94.2, "cbse"),
    verified("education.class10.school_name", "City Montessori School, Gomti Nagar", "cbse"),
    verified("education.class10.marksheet", "doc_offline_class10", "digilocker", "Class X Marksheet cum Certificate 2023"),
    verified("education.class12.board", "CBSE", "cbse"),
    verified("education.class12.year", 2025, "cbse"),
    verified("education.class12.roll_no", "4587654", "cbse"),
    verified("education.class12.percentage", 91.2, "cbse"),
    verified("education.class12.school_name", "City Montessori School, Gomti Nagar", "cbse"),
    verified("education.class12.stream", "PCM", "cbse"),
    verified("education.class12.marksheet", "doc_offline_class12", "digilocker", "Class XII Marksheet cum Certificate 2025"),
    verified("category.social", "OBC-NCL", "edistrict"),
    verified("category.certificate_no", "UP/OBC/2025/778899", "edistrict"),
    verified("category.valid_until", inDays(40), "edistrict"),
    verified("category.certificate", "doc_offline_category", "digilocker", "OBC (Non-Creamy Layer) Certificate"),
    verified("category.domicile_state", "Uttar Pradesh", "edistrict"),
    verified("family.annual_income_total", 450000, "edistrict"),

    // ---- self-declared during the "5 missing fields" step of consent (amber) ----
    selfDeclared("identity.nationality", "IN"),
    selfDeclared("identity.blood_group", "B+"),
    selfDeclared("identity.photo", "doc_offline_photo", "Candidate photograph.jpg"),
    selfDeclared("identity.signature", "doc_offline_signature", "Candidate signature.jpg"),
    selfDeclared("contact.email_primary", "aarav@example.in"),
    selfDeclared("address.current.line1", "B-14, Gomti Nagar Extension"),
    selfDeclared("address.current.village_town", "Lucknow"),
    selfDeclared("address.current.district", "Lucknow"),
    selfDeclared("address.current.state", "Uttar Pradesh"),
    selfDeclared("address.current.pincode", "226010"),
    selfDeclared("family.father.name", "Rajesh Sharma"),
    selfDeclared("family.father.occupation", "private"),
    selfDeclared("family.father.mobile", "9876500001"),
    selfDeclared("family.mother.name", "Sunita Sharma"),
    selfDeclared("family.mother.occupation", "homemaker"),
    selfDeclared("category.pwd", false),
  ];
}

export function buildOfflinePayload(opts: { formId: string; applicationId: string; consentId: string; audience: string }): ApplyOncePayload {
  const facts = buildFacts();
  const custom = { exam_city_1: "Lucknow", exam_city_2: "Kanpur", paper: "Paper 1 (B.E./B.Tech)", medium: "English", declaration: true };
  const now = Math.floor(Date.now() / 1000);
  const sortedFacts = [...facts].sort((a, b) => a.key.localeCompare(b.key));
  return {
    iss: "applyonce",
    sub: sha256(`offline-demo:${opts.audience}`).slice(0, 32),
    aud: opts.audience,
    iat: now,
    exp: now + 600,
    jti: `share_offline_${now}`,
    consent_id: opts.consentId,
    application_id: opts.applicationId,
    form_id: opts.formId,
    form_version: 1,
    purpose: "exam_application",
    profile: { kind: "self", display_name: "Aarav Sharma" },
    facts,
    custom,
    profile_hash: sha256(JSON.stringify(sortedFacts)),
  };
}
