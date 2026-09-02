/**
 * BTA-JEE 2026 form field registry — the ONE place the 6-step manual form, the
 * pre-filled "Apply with Praman" return page, and FIELDS.md all read from.
 *
 * `registryKey` mirrors `packages/schema/src/registry.ts` fact_key exactly (never invent
 * one here) — it is how the Praman payload's `SharedFact[]` gets matched to a field.
 * `registryKey: null` marks the 5 BTA-only custom questions from the seeded form's
 * `customFields` (packages/db/src/seed.ts) — those come back in `PramanPayload.custom`.
 *
 * This mirrors exactly `requestedFields` (45 required + 6 optional) + `customFields` (5)
 * from the seeded `bta-jee-2026` form — 56 fields total. The 6 steps below group them
 * per docs/04-DESIGN-SYSTEM.md #19 ("Personal · Contact & Address · Parents & Income ·
 * Category & Eligibility · Education · Exam preferences & declaration").
 */
import { BLOOD_GROUP, BOARD, ENUM_LABELS, INDIA_STATES, NATIONALITY, OCCUPATION, PWD_TYPE, SOCIAL_CATEGORY, STREAM } from "@praman/schema";

export type FieldKind = "text" | "date" | "select" | "email" | "tel" | "number" | "checkbox" | "file";

export interface FieldOption {
  value: string;
  label: string;
}

export interface FieldSpec {
  /** stable HTML id/name — what the browser extension recipe `bta-demo` targets */
  id: string;
  /** @praman/schema fact_key, or null for a BTA-only custom question */
  registryKey: string | null;
  label: string;
  help?: string;
  kind: FieldKind;
  required: boolean;
  step: number; // 1..6
  options?: FieldOption[];
  maxLength?: number;
  min?: number;
  max?: number;
  uppercase?: boolean; // gov-forms pain: force CAPITAL LETTERS
  /** checkbox only: must be checked (ticked) to proceed — e.g. a declaration. Plain informational
   * yes/no facts (PwD status, government-servant parent) use `required` alone: unchecked = "No",
   * a complete answer, not a missing one. */
  mustBeChecked?: boolean;
  isDate?: boolean; // DD/MM/YYYY text entry, not <input type=date>
  isPincode?: boolean;
  isPhone?: boolean;
  isPercentage?: boolean;
  accept?: string; // file input accept
  minFileKB?: number;
  maxFileKB?: number;
}

export interface StepDef {
  step: number;
  title: string;
  blurb: string;
}

export const STEPS: StepDef[] = [
  { step: 1, title: "Personal Details", blurb: "As per your Aadhaar / Class 10 certificate" },
  { step: 2, title: "Contact & Address", blurb: "We will send admit card & updates here" },
  { step: 3, title: "Parents & Income", blurb: "Required for category & fee-concession checks" },
  { step: 4, title: "Category & Eligibility", blurb: "Reservation, PwD and domicile details" },
  { step: 5, title: "Education (Class 10 / 12)", blurb: "Board, marks and scanned certificates" },
  { step: 6, title: "Exam Preferences & Declaration", blurb: "Choose paper, cities and confirm" },
];

const titleCase = (s: string) => s.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
const opts = (values: readonly string[], labels?: Record<string, { en: string }>): FieldOption[] =>
  values.map((v) => ({ value: v, label: labels?.[v]?.en ?? titleCase(v) }));

const NATIONALITY_LABELS: Record<string, string> = { IN: "Indian", NRI: "NRI", OCI: "OCI (Overseas Citizen of India)", PIO: "PIO (Person of Indian Origin)", FOREIGN: "Foreign National" };
const STREAM_LABELS: Record<string, string> = { PCM: "Physics, Chemistry, Mathematics (PCM)", PCB: "Physics, Chemistry, Biology (PCB)", PCMB: "PCM + Biology (PCMB)", COMMERCE: "Commerce", ARTS: "Arts / Humanities", VOCATIONAL: "Vocational" };

const CITY_OPTIONS: FieldOption[] = ["Lucknow", "Kanpur", "Delhi", "Mumbai", "Hyderabad", "Bengaluru", "Kolkata", "Patna"].map((c) => ({ value: c, label: c }));

export const FIELDS: FieldSpec[] = [
  // ---------------- Step 1 — Personal Details ----------------
  { id: "candidate_name", registryKey: "identity.full_name", label: "Candidate's Full Name (as on Class 10 certificate)", kind: "text", required: true, step: 1, maxLength: 120, uppercase: true, help: "Enter name EXACTLY as printed on your Class 10 marksheet, in CAPITAL LETTERS." },
  { id: "dob", registryKey: "identity.dob", label: "Date of Birth", kind: "text", required: true, step: 1, isDate: true, help: "Format: DD/MM/YYYY" },
  { id: "gender", registryKey: "identity.gender", label: "Gender", kind: "select", required: true, step: 1, options: opts(["M", "F", "T", "X"], ENUM_LABELS.gender) },
  { id: "nationality", registryKey: "identity.nationality", label: "Nationality", kind: "select", required: true, step: 1, options: NATIONALITY.map((v) => ({ value: v, label: NATIONALITY_LABELS[v] ?? v })) },
  { id: "aadhaar_last4", registryKey: "identity.aadhaar_last4", label: "Aadhaar Number — last 4 digits", kind: "text", required: false, step: 1, maxLength: 4, help: "For identity verification only. Optional." },
  { id: "blood_group", registryKey: "identity.blood_group", label: "Blood Group", kind: "select", required: false, step: 1, options: opts(BLOOD_GROUP) },
  { id: "apaar_id", registryKey: "identity.apaar_id", label: "APAAR ID (ABC ID)", kind: "text", required: true, step: 1, maxLength: 12 },
  { id: "photo", registryKey: "identity.photo", label: "Recent Passport-size Photograph", kind: "file", required: true, step: 1, accept: "image/jpeg,image/png", minFileKB: 10, maxFileKB: 200, help: "JPEG/PNG, 10 KB – 200 KB, white background, taken within last 6 months." },
  { id: "signature", registryKey: "identity.signature", label: "Signature (scanned)", kind: "file", required: true, step: 1, accept: "image/jpeg,image/png", minFileKB: 4, maxFileKB: 30, help: "JPEG/PNG, 4 KB – 30 KB, signed on white paper with black ink." },

  // ---------------- Step 2 — Contact & Address ----------------
  { id: "mobile", registryKey: "contact.mobile_primary", label: "Mobile Number", kind: "tel", required: true, step: 2, isPhone: true, help: "10-digit Indian mobile number. Cannot be changed after submission." },
  { id: "email", registryKey: "contact.email_primary", label: "Email Address", kind: "email", required: true, step: 2, help: "Cannot be changed after submission." },
  { id: "address_permanent_line1", registryKey: "address.permanent.line1", label: "Permanent Address — Line 1", kind: "text", required: true, step: 2, maxLength: 120 },
  { id: "address_permanent_line2", registryKey: "address.permanent.line2", label: "Permanent Address — Line 2", kind: "text", required: false, step: 2, maxLength: 120 },
  { id: "village_town_permanent", registryKey: "address.permanent.village_town", label: "Permanent Address — Village / Town / City", kind: "text", required: true, step: 2, maxLength: 80 },
  { id: "district_permanent", registryKey: "address.permanent.district", label: "Permanent Address — District", kind: "text", required: true, step: 2, maxLength: 60 },
  { id: "state_permanent", registryKey: "address.permanent.state", label: "Permanent Address — State", kind: "select", required: true, step: 2, options: opts(INDIA_STATES) },
  { id: "pincode_permanent", registryKey: "address.permanent.pincode", label: "Permanent Address — PIN Code", kind: "text", required: true, step: 2, isPincode: true },
  { id: "address_current_line1", registryKey: "address.current.line1", label: "Current Address — Line 1", kind: "text", required: true, step: 2, maxLength: 120 },
  { id: "village_town_current", registryKey: "address.current.village_town", label: "Current Address — Village / Town / City", kind: "text", required: true, step: 2, maxLength: 80 },
  { id: "district_current", registryKey: "address.current.district", label: "Current Address — District", kind: "text", required: true, step: 2, maxLength: 60 },
  { id: "state_current", registryKey: "address.current.state", label: "Current Address — State", kind: "select", required: true, step: 2, options: opts(INDIA_STATES) },
  { id: "pincode_current", registryKey: "address.current.pincode", label: "Current Address — PIN Code", kind: "text", required: true, step: 2, isPincode: true },

  // ---------------- Step 3 — Parents & Income ----------------
  { id: "father_name", registryKey: "family.father.name", label: "Father's Name", kind: "text", required: true, step: 3, maxLength: 120, uppercase: true },
  { id: "father_occupation", registryKey: "family.father.occupation", label: "Father's Occupation", kind: "select", required: true, step: 3, options: opts(OCCUPATION) },
  { id: "father_mobile", registryKey: "family.father.mobile", label: "Father's Mobile Number", kind: "tel", required: true, step: 3, isPhone: true },
  { id: "mother_name", registryKey: "family.mother.name", label: "Mother's Name", kind: "text", required: true, step: 3, maxLength: 120, uppercase: true },
  { id: "mother_occupation", registryKey: "family.mother.occupation", label: "Mother's Occupation", kind: "select", required: true, step: 3, options: opts(OCCUPATION) },
  { id: "family_annual_income", registryKey: "family.annual_income_total", label: "Total Family Annual Income (₹)", kind: "number", required: true, step: 3, min: 0, max: 1e9 },
  { id: "parent_govt_servant", registryKey: "family.parent_govt_servant", label: "Is either parent a Government servant?", kind: "checkbox", required: false, step: 3 },

  // ---------------- Step 4 — Category & Eligibility ----------------
  { id: "category", registryKey: "category.social", label: "Category", kind: "select", required: true, step: 4, options: opts(SOCIAL_CATEGORY, ENUM_LABELS.social) },
  { id: "category_certificate_no", registryKey: "category.certificate_no", label: "Category Certificate Number", kind: "text", required: true, step: 4, maxLength: 40 },
  { id: "category_valid_until", registryKey: "category.valid_until", label: "Category Certificate Valid Until", kind: "text", required: true, step: 4, isDate: true },
  { id: "category_certificate", registryKey: "category.certificate", label: "Upload Category Certificate", kind: "file", required: true, step: 4, accept: "application/pdf,image/jpeg,image/png", minFileKB: 10, maxFileKB: 500 },
  { id: "pwd", registryKey: "category.pwd", label: "Person with Disability (PwD)?", kind: "checkbox", required: true, step: 4 },
  { id: "pwd_type", registryKey: "category.pwd_type", label: "Disability Type (if applicable)", kind: "select", required: false, step: 4, options: opts(PWD_TYPE) },
  { id: "udid_no", registryKey: "category.udid_no", label: "UDID Number (if applicable)", kind: "text", required: false, step: 4, maxLength: 20 },
  { id: "scribe_required", registryKey: "category.scribe_required", label: "Scribe Required (if applicable)?", kind: "checkbox", required: false, step: 4 },
  { id: "domicile_state", registryKey: "category.domicile_state", label: "Domicile State", kind: "select", required: true, step: 4, options: opts(INDIA_STATES) },

  // ---------------- Step 5 — Education ----------------
  { id: "class10_board", registryKey: "education.class10.board", label: "Class 10 Board", kind: "select", required: true, step: 5, options: opts(BOARD, ENUM_LABELS.board) },
  { id: "class10_year", registryKey: "education.class10.year", label: "Class 10 Passing Year", kind: "number", required: true, step: 5, min: 1990, max: 2100 },
  { id: "class10_roll_no", registryKey: "education.class10.roll_no", label: "Class 10 Roll Number", kind: "text", required: true, step: 5, maxLength: 20 },
  { id: "class10_percentage", registryKey: "education.class10.percentage", label: "Class 10 Percentage", kind: "number", required: true, step: 5, isPercentage: true, min: 0, max: 100 },
  { id: "class10_school_name", registryKey: "education.class10.school_name", label: "Class 10 School Name", kind: "text", required: true, step: 5, maxLength: 160 },
  { id: "class10_marksheet", registryKey: "education.class10.marksheet", label: "Upload Class 10 Marksheet", kind: "file", required: true, step: 5, accept: "application/pdf,image/jpeg,image/png", minFileKB: 20, maxFileKB: 1024 },
  { id: "class12_board", registryKey: "education.class12.board", label: "Class 12 Board", kind: "select", required: true, step: 5, options: opts(BOARD, ENUM_LABELS.board) },
  { id: "class12_year", registryKey: "education.class12.year", label: "Class 12 Passing Year", kind: "number", required: true, step: 5, min: 1990, max: 2100 },
  { id: "class12_roll_no", registryKey: "education.class12.roll_no", label: "Class 12 Roll Number", kind: "text", required: true, step: 5, maxLength: 20 },
  { id: "class12_percentage", registryKey: "education.class12.percentage", label: "Class 12 Percentage", kind: "number", required: true, step: 5, isPercentage: true, min: 0, max: 100 },
  { id: "class12_school_name", registryKey: "education.class12.school_name", label: "Class 12 School Name", kind: "text", required: true, step: 5, maxLength: 160 },
  { id: "class12_stream", registryKey: "education.class12.stream", label: "Class 12 Stream", kind: "select", required: true, step: 5, options: STREAM.map((v) => ({ value: v, label: STREAM_LABELS[v] ?? v })) },
  { id: "class12_marksheet", registryKey: "education.class12.marksheet", label: "Upload Class 12 Marksheet", kind: "file", required: true, step: 5, accept: "application/pdf,image/jpeg,image/png", minFileKB: 20, maxFileKB: 1024 },

  // ---------------- Step 6 — Exam Preferences & Declaration (BTA-only custom questions) ----------------
  { id: "exam_city_1", registryKey: null, label: "Exam City Preference 1", kind: "select", required: true, step: 6, options: CITY_OPTIONS },
  { id: "exam_city_2", registryKey: null, label: "Exam City Preference 2", kind: "select", required: true, step: 6, options: CITY_OPTIONS },
  { id: "paper", registryKey: null, label: "Paper", kind: "select", required: true, step: 6, options: [
    { value: "Paper 1 (B.E./B.Tech)", label: "Paper 1 (B.E./B.Tech)" },
    { value: "Paper 2A (B.Arch)", label: "Paper 2A (B.Arch)" },
    { value: "Paper 2B (B.Planning)", label: "Paper 2B (B.Planning)" },
  ] },
  { id: "medium", registryKey: null, label: "Question Paper Medium", kind: "select", required: true, step: 6, options: ["English", "Hindi", "Gujarati", "Bengali", "Tamil"].map((v) => ({ value: v, label: v })) },
  { id: "declaration", registryKey: null, label: "I declare that the information given above is true to the best of my knowledge and belief.", kind: "checkbox", required: true, step: 6, mustBeChecked: true },
];

export const FIELDS_BY_STEP = (step: number): FieldSpec[] => FIELDS.filter((f) => f.step === step);
export const FIELD_BY_ID: ReadonlyMap<string, FieldSpec> = new Map(FIELDS.map((f) => [f.id, f]));
export const FIELD_BY_REGISTRY_KEY: ReadonlyMap<string, FieldSpec> = new Map(FIELDS.filter((f) => f.registryKey).map((f) => [f.registryKey as string, f]));
export const CUSTOM_FIELDS: FieldSpec[] = FIELDS.filter((f) => f.registryKey === null);
export const TOTAL_STEPS = STEPS.length;
export const REVIEW_STEP = TOTAL_STEPS + 1;
