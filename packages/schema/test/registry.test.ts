import { describe, it, expect } from "vitest";
import { REGISTRY, REGISTRY_MAP, SECTIONS, field, validateFact, canShare, scopeForPurpose, registryJsonSchema, coerce, fieldsInSection } from "../src";

// every key named in docs/03-DATA-MODEL.md §1 must exist
const DOC_KEYS = [
  "identity.full_name","identity.first_name","identity.middle_name","identity.last_name","identity.dob","identity.gender","identity.photo","identity.nationality",
  "identity.aadhaar_last4","identity.aadhaar_ref_key","identity.aadhaar_xml_hash","identity.pan","identity.voter_id","identity.passport_no","identity.passport_expiry",
  "identity.driving_licence_no","identity.dl_expiry","identity.apaar_id","identity.abha_id","identity.signature","identity.blood_group","identity.marital_status",
  "identity.mother_tongue","identity.languages_known",
  "contact.mobile_primary","contact.mobile_secondary","contact.email_primary","contact.email_secondary","contact.whatsapp_optin",
  "address.permanent.line1","address.permanent.pincode","address.current.state","address.correspondence.district","address.permanent.since",
  "family.father.name","family.father.occupation","family.father.mobile","family.father.email","family.father.education","family.father.annual_income","family.father.is_alive",
  "family.mother.name","family.guardian.name","family.guardian.relation","family.spouse.name","family.siblings.name","family.siblings.dob",
  "family.annual_income_total","family.income_certificate","family.nominee.name","family.parent_govt_servant","identity.place_of_birth",
  "category.social","category.certificate_no","category.issue_date","category.valid_until","category.issuing_authority","category.pwd","category.pwd_type",
  "category.pwd_percentage","category.udid_no","category.scribe_required","category.ex_serviceman_ward","category.kashmiri_migrant","category.defence_ward",
  "category.single_girl_child","category.minority","category.domicile_state","category.domicile_certificate","category.religion",
  "education.class10.board","education.class10.school_name","education.class10.school_udise","education.class10.year","education.class10.roll_no","education.class10.medium",
  "education.class10.total_marks","education.class10.obtained_marks","education.class10.percentage","education.class10.cgpa","education.class10.subjects",
  "education.class12.stream","education.class12.pcm_pct","education.class12.pcb_pct","education.class12.subjects",
  "education.graduation.university","education.graduation.college","education.graduation.aishe_code","education.graduation.degree","education.graduation.branch",
  "education.graduation.start_year","education.graduation.end_year","education.graduation.cgpa","education.graduation.percentage","education.graduation.backlogs","education.graduation.status",
  "education.postgrad.degree","education.diploma.degree","education.gap_years.years","education.gap_years.reason",
  "education.exam_scores.exam","education.exam_scores.year","education.exam_scores.roll","education.exam_scores.score","education.exam_scores.percentile","education.exam_scores.rank","education.exam_scores.category_rank",
  "employment.current.employer","employment.current.designation","employment.current.sector","employment.current.start","employment.current.ctc","employment.current.uan","employment.current.employee_id",
  "employment.history.employer","employment.experience_total_months",
  "health.allergies","health.chronic_conditions","health.emergency_contacts","health.insurance.insurer","health.insurance.policy_no","health.insurance.valid_until",
  "bank.primary.account_last4","bank.primary.ifsc","bank.primary.bank_name","bank.primary.holder_name","bank.primary.account_type",
  "prefs.language","prefs.exam_city_choices","prefs.notification_channels",
];

describe("registry", () => {
  it("has every key from docs/03", () => {
    const missing = DOC_KEYS.filter((k) => !REGISTRY_MAP.has(k));
    expect(missing).toEqual([]);
  });
  it("has unique keys, valid sections, and key prefix == section", () => {
    expect(new Set(REGISTRY.map((d) => d.key)).size).toBe(REGISTRY.length);
    for (const d of REGISTRY) {
      expect(SECTIONS).toContain(d.section);
      expect(d.key.startsWith(d.section + ".")).toBe(true);
      expect(d.label.en.length).toBeGreaterThan(0);
      expect(d.label.hi.length).toBeGreaterThan(0);
      if (d.type === "enum") expect(d.options?.length).toBeGreaterThan(0);
    }
  });
  it("every section has fields", () => { for (const s of SECTIONS) expect(fieldsInSection(s).length).toBeGreaterThan(0); });
  it("throws on unknown key", () => { expect(() => field("identity.nope")).toThrow(); });
});

describe("validation", () => {
  it("validates typed values", () => {
    expect(validateFact("identity.pan", "ABCDE1234F").success).toBe(true);
    expect(validateFact("identity.pan", "abcde1234f").success).toBe(true); // uppercased
    expect(validateFact("identity.pan", "ABC123").success).toBe(false);
    expect(validateFact("contact.mobile_primary", "9876543210").success).toBe(true);
    expect(validateFact("contact.mobile_primary", "1234567890").success).toBe(false);
    expect(validateFact("address.permanent.pincode", "226001").success).toBe(true);
    expect(validateFact("identity.dob", "2007-03-14").success).toBe(true);
    expect(validateFact("identity.dob", "14/03/2007").success).toBe(false);
    expect(validateFact("category.social", "OBC-NCL").success).toBe(true);
    expect(validateFact("category.social", "OBC").success).toBe(false);
    expect(validateFact("education.class12.percentage", 91.2).success).toBe(true);
    expect(validateFact("education.class12.percentage", 101).success).toBe(false);
    expect(validateFact("bank.primary.ifsc", "SBIN0001234").success).toBe(true);
  });
  it("coerces raw strings", () => {
    expect(coerce("education.class12.percentage", " 91.2 ")).toBe(91.2);
    expect(coerce("family.annual_income_total", "₹ 4,50,000")).toBe(450000);
    expect(coerce("category.pwd", "No")).toBe(false);
    expect(coerce("identity.languages_known", "Hindi, English")).toEqual(["Hindi", "English"]);
    expect(coerce("identity.pan", "abcde1234f")).toBe("ABCDE1234F");
  });
  it("exports JSON schema", () => {
    const js = registryJsonSchema() as { properties: Record<string, unknown> };
    expect(Object.keys(js.properties)).toContain("identity.full_name");
    expect(Object.keys(js.properties)).not.toContain("identity.aadhaar_ref_key");
  });
});

describe("consent gating", () => {
  it("blocks sensitive groups outside their purposes", () => {
    expect(canShare("health.allergies", "exam_application")).toBe(false);
    expect(canShare("health.allergies", "healthcare")).toBe(true);
    expect(canShare("bank.primary.account_no", "college_admission")).toBe(false);
    expect(canShare("bank.primary.account_no", "scholarship")).toBe(true);
    expect(canShare("identity.aadhaar_ref_key", "kyc_financial")).toBe(false); // system
    expect(canShare("identity.full_name", "age_verification_only")).toBe(true);
  });
  it("splits scope", () => {
    const r = scopeForPurpose(["identity.full_name", "health.allergies", "identity.dob"], "exam_application");
    expect(r.allowed).toEqual(["identity.full_name", "identity.dob"]);
    expect(r.blocked).toEqual(["health.allergies"]);
  });
});
