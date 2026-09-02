/**
 * Deterministic demo data. Used by mock providers AND the DB seed so the demo works with or without a sync run.
 * Keyed by phone number (the only stable identifier a mock provider sees).
 */
import type { AadhaarOfflineKyc, IssuedDoc } from "./types";

const inDays = (d: number) => new Date(Date.now() + d * 864e5).toISOString().slice(0, 10);

export interface DemoPerson {
  id: string; phone: string; name: string; dob: string; gender: "M" | "F"; email: string; locale: "en" | "hi";
  aadhaar: AadhaarOfflineKyc; pan?: string; apaar?: string; abha?: string;
  docs: IssuedDoc[];
  /** self-declared facts written at seed (amber) */
  selfFacts: Record<string, unknown>;
}

const address = (o: Partial<AadhaarOfflineKyc["address"]> & Pick<AadhaarOfflineKyc["address"], "vtc" | "district" | "state" | "pincode">) => ({ country: "India", ...o });

export const AARAV: DemoPerson = {
  id: "usr_aarav", phone: "9876543210", name: "Aarav Sharma", dob: "2007-03-14", gender: "M", email: "aarav@example.in", locale: "en",
  pan: "BXYPS1234K", apaar: "123456789012", abha: "91-1234-5678-9012",
  aadhaar: {
    name: "Aarav Sharma", dob: "2007-03-14", gender: "M", last4: "4321", referenceKey: "ref_aarav_0001", xmlHash: "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855", generatedAt: "2026-08-20T10:00:00Z",
    address: address({ house: "B-14", street: "Gomti Nagar Extension", locality: "Sector 4", vtc: "Lucknow", district: "Lucknow", state: "Uttar Pradesh", pincode: "226010" }),
  },
  docs: [
    { uri: "in.gov.uidai-ADHAR-4321", docType: "aadhaar", name: "Aadhaar Card", issuerId: "in.gov.uidai", issuerName: "UIDAI", mime: "application/pdf", issuedAt: "2015-06-01" },
    { uri: "in.gov.pan-PANCR-BXYPS1234K", docType: "pan", name: "PAN Verification Record", issuerId: "in.gov.pan", issuerName: "Income Tax Department", mime: "application/pdf", data: { pan: "BXYPS1234K", name: "AARAV SHARMA", dob: "2007-03-14" } },
    { uri: "in.gov.cbse-SSCER-2023-4512345", docType: "marksheet_10", name: "Class X Marksheet cum Certificate 2023", issuerId: "in.gov.cbse", issuerName: "CBSE", mime: "application/pdf", issuedAt: "2023-05-12",
      data: { board: "CBSE", year: 2023, roll_no: "4512345", school_name: "City Montessori School, Gomti Nagar", school_udise: "09100112345", medium: "english", total_marks: 500, obtained_marks: 471, percentage: 94.2,
        subjects: [{ name: "English", marks: 95, max: 100 }, { name: "Hindi", marks: 91, max: 100 }, { name: "Mathematics", marks: 98, max: 100 }, { name: "Science", marks: 96, max: 100 }, { name: "Social Science", marks: 91, max: 100 }] } },
    { uri: "in.gov.cbse-HSCER-2025-4587654", docType: "marksheet_12", name: "Class XII Marksheet cum Certificate 2025", issuerId: "in.gov.cbse", issuerName: "CBSE", mime: "application/pdf", issuedAt: "2025-05-13",
      data: { board: "CBSE", year: 2025, roll_no: "4587654", school_name: "City Montessori School, Gomti Nagar", school_udise: "09100112345", medium: "english", stream: "PCM", total_marks: 500, obtained_marks: 456, percentage: 91.2, pcm_pct: 92.3,
        subjects: [{ name: "English", marks: 88, max: 100 }, { name: "Physics", marks: 92, max: 100 }, { name: "Chemistry", marks: 90, max: 100 }, { name: "Mathematics", marks: 95, max: 100 }, { name: "Computer Science", marks: 91, max: 100 }] } },
    { uri: "in.gov.up.edistrict-CTCER-2025-778899", docType: "category_cert", name: "OBC (Non-Creamy Layer) Certificate", issuerId: "in.gov.up.edistrict", issuerName: "e-District Uttar Pradesh", mime: "application/pdf", issuedAt: inDays(-325), validUntil: inDays(40),
      data: { category: "OBC-NCL", certificate_no: "UP/OBC/2025/778899", issuing_authority: "Tehsildar, Sadar, Lucknow", issue_date: inDays(-325), valid_until: inDays(40) } },
    { uri: "in.gov.up.edistrict-INCER-2025-334455", docType: "income_cert", name: "Income Certificate", issuerId: "in.gov.up.edistrict", issuerName: "e-District Uttar Pradesh", mime: "application/pdf", issuedAt: inDays(-100), validUntil: inDays(265),
      data: { annual_income_total: 450000, certificate_no: "UP/INC/2025/334455", valid_until: inDays(265) } },
    { uri: "in.gov.up.edistrict-DMCER-2024-112233", docType: "domicile_cert", name: "Domicile Certificate", issuerId: "in.gov.up.edistrict", issuerName: "e-District Uttar Pradesh", mime: "application/pdf", issuedAt: "2024-02-10",
      data: { domicile_state: "Uttar Pradesh", certificate_no: "UP/DOM/2024/112233" } },
  ],
  selfFacts: {
    "identity.nationality": "IN", "identity.blood_group": "B+", "identity.mother_tongue": "Hindi", "identity.languages_known": ["Hindi", "English"], "identity.marital_status": "single",
    "contact.email_primary": "aarav@example.in", "contact.whatsapp_optin": true,
    "family.father.name": "Rajesh Sharma", "family.father.occupation": "private", "family.father.mobile": "9876500001", "family.father.education": "graduate", "family.father.annual_income": 350000, "family.father.is_alive": true,
    "family.mother.name": "Sunita Sharma", "family.mother.occupation": "homemaker", "family.mother.mobile": "9876500002", "family.mother.education": "class12", "family.mother.annual_income": 100000, "family.mother.is_alive": true,
    "family.siblings.name": "Riya Sharma", "family.siblings.dob": "2011-08-02",
    "category.pwd": false, "category.minority": false, "category.single_girl_child": false, "category.defence_ward": false, "category.ex_serviceman_ward": false, "category.kashmiri_migrant": false,
    "education.gap_years.years": 0,
    "prefs.language": "en", "prefs.exam_city_choices": ["Lucknow", "Kanpur", "Delhi"],
    "address.same_as_permanent": true,
  },
};

export const SUNITA: DemoPerson = {
  id: "usr_sunita", phone: "9876500002", name: "Sunita Sharma", dob: "1980-11-22", gender: "F", email: "sunita@example.in", locale: "hi", pan: "AKZPS9876L",
  aadhaar: { name: "Sunita Sharma", dob: "1980-11-22", gender: "F", last4: "8765", referenceKey: "ref_sunita_0001", xmlHash: "a1b2c3", generatedAt: "2026-08-20T10:00:00Z", address: AARAV.aadhaar.address },
  docs: [
    { uri: "in.gov.uidai-ADHAR-8765", docType: "aadhaar", name: "Aadhaar Card", issuerId: "in.gov.uidai", issuerName: "UIDAI", mime: "application/pdf" },
    { uri: "in.gov.pan-PANCR-AKZPS9876L", docType: "pan", name: "PAN Verification Record", issuerId: "in.gov.pan", issuerName: "Income Tax Department", mime: "application/pdf", data: { pan: "AKZPS9876L", name: "SUNITA SHARMA", dob: "1980-11-22" } },
  ],
  selfFacts: { "identity.nationality": "IN", "identity.marital_status": "married", "family.spouse.name": "Rajesh Sharma", "prefs.language": "hi", "contact.email_primary": "sunita@example.in" },
};

/** dependents managed by Sunita (no own login) */
export const RIYA = { id: "prof_riya", name: "Riya Sharma", dob: "2011-08-02", gender: "F" as const, facts: {
  "identity.full_name": "Riya Sharma", "identity.dob": "2011-08-02", "identity.gender": "F", "identity.nationality": "IN", "family.father.name": "Rajesh Sharma", "family.mother.name": "Sunita Sharma",
  "education.class10.board": "CBSE", "education.class10.school_name": "City Montessori School, Gomti Nagar", "category.social": "OBC-NCL",
} };
export const KAMLA = { id: "prof_kamla", name: "Kamla Devi", dob: "1954-01-05", gender: "F" as const, facts: {
  "identity.full_name": "Kamla Devi", "identity.dob": "1954-01-05", "identity.gender": "F", "identity.nationality": "IN", "identity.blood_group": "O+", "identity.marital_status": "widowed",
  "health.chronic_conditions": ["Type 2 diabetes", "Hypertension"], "health.emergency_contacts": [{ name: "Sunita Sharma", relation: "daughter", phone: "9876500002" }],
  "bank.primary.bank_name": "State Bank of India", "bank.primary.ifsc": "SBIN0001234", "bank.primary.holder_name": "Kamla Devi", "bank.primary.account_type": "savings", "bank.primary.account_no": "30012345678",
} };

export const VIKRAM: DemoPerson = {
  id: "usr_vikram", phone: "9123456780", name: "Vikram Rao", dob: "2002-07-30", gender: "M", email: "vikram@example.in", locale: "en", pan: "CQWPR4567M", apaar: "987654321098",
  aadhaar: { name: "Vikram Rao", dob: "2002-07-30", gender: "M", last4: "1122", referenceKey: "ref_vikram_0001", xmlHash: "d4e5f6", generatedAt: "2026-08-21T10:00:00Z",
    address: address({ house: "Flat 302, Sai Residency", street: "Madhapur", locality: "Hitech City", vtc: "Hyderabad", district: "Ranga Reddy", state: "Telangana", pincode: "500081" }) },
  docs: [
    { uri: "in.gov.uidai-ADHAR-1122", docType: "aadhaar", name: "Aadhaar Card", issuerId: "in.gov.uidai", issuerName: "UIDAI", mime: "application/pdf" },
    { uri: "in.gov.pan-PANCR-CQWPR4567M", docType: "pan", name: "PAN Verification Record", issuerId: "in.gov.pan", issuerName: "Income Tax Department", mime: "application/pdf", data: { pan: "CQWPR4567M", name: "VIKRAM RAO", dob: "2002-07-30" } },
    { uri: "in.gov.cbse-HSCER-2020-2211334", docType: "marksheet_12", name: "Class XII Marksheet 2020", issuerId: "in.gov.cbse", issuerName: "CBSE", mime: "application/pdf", data: { board: "CBSE", year: 2020, roll_no: "2211334", school_name: "Kendriya Vidyalaya, Picket", medium: "english", stream: "PCM", total_marks: 500, obtained_marks: 442, percentage: 88.4 } },
    { uri: "in.gov.nad-DEGCR-2024-JNTUH-556677", docType: "degree", name: "B.Tech Degree Certificate", issuerId: "in.gov.nad", issuerName: "National Academic Depository", mime: "application/pdf", issuedAt: "2024-07-15",
      data: { university: "JNTU Hyderabad", college: "CVR College of Engineering", degree: "B.Tech", branch: "Computer Science", start_year: 2020, end_year: 2024, cgpa: 8.4, status: "completed" } },
  ],
  selfFacts: { "identity.nationality": "IN", "identity.marital_status": "single", "contact.email_primary": "vikram@example.in", "family.father.name": "Suresh Rao", "family.mother.name": "Lakshmi Rao",
    "category.social": "GEN", "employment.current.employer": "Zeta Labs Pvt Ltd", "employment.current.designation": "Software Engineer", "employment.current.sector": "private", "employment.current.start": "2024-08-01", "employment.current.ctc": 1200000, "prefs.language": "en" },
};

export const DEMO_PEOPLE = [AARAV, SUNITA, VIKRAM];
export const byPhone = (phone: string) => DEMO_PEOPLE.find((p) => p.phone === phone.replace(/^\+91/, ""));
export const byRef = (ref: string) => DEMO_PEOPLE.find((p) => p.aadhaar.referenceKey === ref || `dl_${p.id}` === ref);
/** dev OTP for every number in mock mode */
export const MOCK_OTP = "123456";

/** map an issued doc's structured data → canonical fact keys */
export function docToFacts(doc: IssuedDoc, person: { aadhaar: AadhaarOfflineKyc; pan?: string }): { key: string; value: unknown; verifiedBy: string; expiresAt?: string }[] {
  const d = doc.data ?? {};
  const v = (key: string, value: unknown, verifiedBy: string, expiresAt?: string) => ({ key, value, verifiedBy, expiresAt });
  switch (doc.docType) {
    case "aadhaar": {
      const a = person.aadhaar, adr = a.address;
      return [
        v("identity.full_name", a.name, "uidai"), v("identity.dob", a.dob, "uidai"), v("identity.gender", a.gender, "uidai"),
        v("identity.aadhaar_last4", a.last4, "uidai"), v("identity.aadhaar_ref_key", a.referenceKey, "uidai"), v("identity.aadhaar_xml_hash", a.xmlHash, "uidai"),
        v("address.permanent.line1", [adr.house, adr.street].filter(Boolean).join(", "), "uidai"), v("address.permanent.line2", adr.locality ?? "", "uidai"),
        v("address.permanent.village_town", adr.vtc, "uidai"), v("address.permanent.district", adr.district, "uidai"), v("address.permanent.state", adr.state, "uidai"),
        v("address.permanent.pincode", adr.pincode, "uidai"), v("address.permanent.country", adr.country, "uidai"),
      ].filter((x) => x.value !== "");
    }
    case "pan": return [v("identity.pan", d.pan, "nsdl_pan")];
    case "marksheet_10": case "marksheet_12": {
      const lvl = doc.docType === "marksheet_10" ? "class10" : "class12";
      const keys = ["board", "year", "roll_no", "school_name", "school_udise", "medium", "total_marks", "obtained_marks", "percentage", "subjects", "stream", "pcm_pct", "pcb_pct"];
      return keys.filter((k) => d[k] !== undefined).map((k) => v(`education.${lvl}.${k}`, d[k], "cbse"));
    }
    case "degree": return Object.entries(d).map(([k, val]) => v(`education.graduation.${k}`, val, "nad"));
    case "category_cert": return [
      v("category.social", d.category, "edistrict"), v("category.certificate_no", d.certificate_no, "edistrict"), v("category.issuing_authority", d.issuing_authority, "edistrict"),
      v("category.issue_date", d.issue_date, "edistrict"), v("category.valid_until", d.valid_until, "edistrict", d.valid_until as string),
    ];
    case "income_cert": return [v("family.annual_income_total", d.annual_income_total, "edistrict"), v("family.income_certificate_no", d.certificate_no, "edistrict"), v("family.income_certificate_valid_until", d.valid_until, "edistrict", d.valid_until as string)];
    case "domicile_cert": return [v("category.domicile_state", d.domicile_state, "edistrict"), v("category.domicile_certificate_no", d.certificate_no, "edistrict")];
    default: return [];
  }
}
