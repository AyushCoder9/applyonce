/**
 * Field registry — THE source of truth for every fact_key.
 * Generates: zod validators, DB checks, partner form-builder tree, extension field maps, i18n labels.
 * Do not invent keys elsewhere. Add here, then everything follows.
 */
import type { FieldDef, Section, FactType, Source, Purpose } from "./types";
import * as E from "./enums";

const ALL: readonly Source[] = ["self_declared", "document_extracted", "issuer_verified", "provider_verified"];
const SELF: readonly Source[] = ["self_declared"];
const SELF_DOC: readonly Source[] = ["self_declared", "document_extracted"];
const VERIFIED: readonly Source[] = ["issuer_verified", "provider_verified"];

type Opt = Partial<Omit<FieldDef, "key" | "section" | "type" | "label" | "sources">> & { sources?: readonly Source[] };
const f = (key: string, section: Section, type: FactType, en: string, hi: string, o: Opt = {}): FieldDef =>
  ({ key, section, type, label: { en, hi }, sources: o.sources ?? ALL, ...o });

/** person sub-group used for father / mother / guardian / spouse */
const person = (p: "father" | "mother" | "guardian" | "spouse", en: string, hi: string): FieldDef[] => [
  f(`family.${p}.name`, "family", "string", `${en}'s name`, `${hi} का नाम`, { sources: ALL, maxLen: 120 }),
  f(`family.${p}.occupation`, "family", "enum", `${en}'s occupation`, `${hi} का व्यवसाय`, { options: E.OCCUPATION, sources: SELF_DOC }),
  f(`family.${p}.mobile`, "family", "phone", `${en}'s mobile`, `${hi} का मोबाइल`, { sources: SELF }),
  f(`family.${p}.email`, "family", "email", `${en}'s email`, `${hi} का ईमेल`, { sources: SELF }),
  f(`family.${p}.education`, "family", "enum", `${en}'s education`, `${hi} की शिक्षा`, { options: E.EDU_LEVEL, sources: SELF }),
  f(`family.${p}.annual_income`, "family", "money", `${en}'s annual income (₹)`, `${hi} की वार्षिक आय (₹)`, { sensitive: true, sources: SELF_DOC, purposes: ["scholarship", "college_admission", "exam_application", "government_scheme", "kyc_financial"] }),
  f(`family.${p}.is_alive`, "family", "bool", `${en} is alive`, `${hi} जीवित हैं`, { sources: SELF }),
];

const eduLevel = (lvl: "class10" | "class12", en: string, hi: string): FieldDef[] => [
  f(`education.${lvl}.board`, "education", "enum", `${en} board`, `${hi} बोर्ड`, { options: E.BOARD }),
  f(`education.${lvl}.board_name`, "education", "string", `${en} board name (if State/other)`, `${hi} बोर्ड का नाम`, { maxLen: 120 }),
  f(`education.${lvl}.school_name`, "education", "string", `${en} school name`, `${hi} स्कूल का नाम`, { maxLen: 160 }),
  f(`education.${lvl}.school_udise`, "education", "string", `${en} school UDISE code`, `${hi} स्कूल UDISE कोड`, { maxLen: 11 }),
  f(`education.${lvl}.year`, "education", "year", `${en} passing year`, `${hi} उत्तीर्ण वर्ष`),
  f(`education.${lvl}.roll_no`, "education", "string", `${en} roll number`, `${hi} रोल नंबर`, { maxLen: 20 }),
  f(`education.${lvl}.medium`, "education", "enum", `${en} medium`, `${hi} माध्यम`, { options: E.MEDIUM }),
  f(`education.${lvl}.total_marks`, "education", "number", `${en} maximum marks`, `${hi} अधिकतम अंक`),
  f(`education.${lvl}.obtained_marks`, "education", "number", `${en} marks obtained`, `${hi} प्राप्त अंक`),
  f(`education.${lvl}.percentage`, "education", "percentage", `${en} percentage`, `${hi} प्रतिशत`),
  f(`education.${lvl}.cgpa`, "education", "number", `${en} CGPA`, `${hi} सीजीपीए`, { min: 0, max: 10 }),
  f(`education.${lvl}.subjects`, "education", "json", `${en} subject-wise marks`, `${hi} विषयवार अंक`, { help: { en: "[{name, marks, max}]", hi: "[{name, marks, max}]" } }),
  f(`education.${lvl}.marksheet`, "education", "file_ref", `${en} marksheet`, `${hi} मार्कशीट`),
];

const higherEd = (g: "graduation" | "postgrad" | "diploma", en: string, hi: string): FieldDef[] => [
  f(`education.${g}.university`, "education", "string", `${en} university`, `${hi} विश्वविद्यालय`, { repeat: `education.${g}`, maxLen: 160 }),
  f(`education.${g}.college`, "education", "string", `${en} college`, `${hi} कॉलेज`, { repeat: `education.${g}`, maxLen: 160 }),
  f(`education.${g}.aishe_code`, "education", "string", `${en} AISHE code`, `${hi} AISHE कोड`, { repeat: `education.${g}`, maxLen: 12 }),
  f(`education.${g}.degree`, "education", "string", `${en} degree`, `${hi} डिग्री`, { repeat: `education.${g}`, maxLen: 80 }),
  f(`education.${g}.branch`, "education", "string", `${en} branch / major`, `${hi} शाखा`, { repeat: `education.${g}`, maxLen: 80 }),
  f(`education.${g}.start_year`, "education", "year", `${en} start year`, `${hi} प्रारंभ वर्ष`, { repeat: `education.${g}` }),
  f(`education.${g}.end_year`, "education", "year", `${en} end year`, `${hi} समाप्ति वर्ष`, { repeat: `education.${g}` }),
  f(`education.${g}.cgpa`, "education", "number", `${en} CGPA`, `${hi} सीजीपीए`, { repeat: `education.${g}`, min: 0, max: 10 }),
  f(`education.${g}.percentage`, "education", "percentage", `${en} percentage`, `${hi} प्रतिशत`, { repeat: `education.${g}` }),
  f(`education.${g}.backlogs`, "education", "int", `${en} active backlogs`, `${hi} बैकलॉग`, { repeat: `education.${g}`, min: 0 }),
  f(`education.${g}.status`, "education", "enum", `${en} status`, `${hi} स्थिति`, { repeat: `education.${g}`, options: E.DEGREE_STATUS }),
  f(`education.${g}.certificate`, "education", "file_ref", `${en} degree / marksheet`, `${hi} डिग्री / मार्कशीट`, { repeat: `education.${g}` }),
];

const address = (role: "permanent" | "current" | "correspondence", en: string, hi: string): FieldDef[] => [
  f(`address.${role}.line1`, "address", "string", `${en} address line 1`, `${hi} पता पंक्ति 1`, { maxLen: 120 }),
  f(`address.${role}.line2`, "address", "string", `${en} address line 2`, `${hi} पता पंक्ति 2`, { maxLen: 120 }),
  f(`address.${role}.landmark`, "address", "string", `${en} landmark`, `${hi} लैंडमार्क`, { maxLen: 80 }),
  f(`address.${role}.village_town`, "address", "string", `${en} village / town / city`, `${hi} गाँव / शहर`, { maxLen: 80 }),
  f(`address.${role}.district`, "address", "string", `${en} district`, `${hi} ज़िला`, { maxLen: 60 }),
  f(`address.${role}.state`, "address", "enum", `${en} state`, `${hi} राज्य`, { options: E.INDIA_STATES }),
  f(`address.${role}.pincode`, "address", "pincode", `${en} PIN code`, `${hi} पिन कोड`),
  f(`address.${role}.country`, "address", "string", `${en} country`, `${hi} देश`, { maxLen: 56 }),
  f(`address.${role}.since`, "address", "date", `${en} address since`, `${hi} कब से`, { sources: SELF }),
];

export const REGISTRY: readonly FieldDef[] = [
  // ---------- identity ----------
  f("identity.full_name", "identity", "string", "Full name (as on Aadhaar)", "पूरा नाम (आधार अनुसार)", { maxLen: 120 }),
  f("identity.first_name", "identity", "string", "First name", "पहला नाम", { derived: true, maxLen: 60 }),
  f("identity.middle_name", "identity", "string", "Middle name", "मध्य नाम", { derived: true, maxLen: 60 }),
  f("identity.last_name", "identity", "string", "Last name", "उपनाम", { derived: true, maxLen: 60 }),
  f("identity.dob", "identity", "date", "Date of birth", "जन्म तिथि"),
  f("identity.place_of_birth", "identity", "string", "Place of birth", "जन्म स्थान", { sources: SELF_DOC, maxLen: 80 }),
  f("identity.gender", "identity", "enum", "Gender", "लिंग", { options: E.GENDER }),
  f("identity.photo", "identity", "file_ref", "Photograph", "फ़ोटो"),
  f("identity.signature", "identity", "file_ref", "Signature", "हस्ताक्षर", { sources: SELF }),
  f("identity.nationality", "identity", "enum", "Nationality", "राष्ट्रीयता", { options: E.NATIONALITY }),
  f("identity.aadhaar_last4", "identity", "string", "Aadhaar (last 4 digits)", "आधार (अंतिम 4 अंक)", { sensitive: true, sources: VERIFIED, maxLen: 4 }),
  f("identity.aadhaar_ref_key", "identity", "string", "Aadhaar reference key", "आधार संदर्भ कुंजी", { system: true, sensitive: true, sources: VERIFIED }),
  f("identity.aadhaar_xml_hash", "identity", "string", "Aadhaar offline XML hash", "आधार XML हैश", { system: true, sources: VERIFIED }),
  f("identity.pan", "identity", "pan", "PAN", "पैन", { sensitive: true, purposes: ["kyc_financial", "employment", "scholarship", "government_scheme", "exam_application", "college_admission"] }),
  f("identity.voter_id", "identity", "string", "Voter ID (EPIC)", "मतदाता पहचान पत्र", { sensitive: true, maxLen: 20 }),
  f("identity.passport_no", "identity", "string", "Passport number", "पासपोर्ट नंबर", { sensitive: true, maxLen: 12 }),
  f("identity.passport_expiry", "identity", "date", "Passport expiry", "पासपोर्ट समाप्ति", { expires: true }),
  f("identity.driving_licence_no", "identity", "string", "Driving licence number", "ड्राइविंग लाइसेंस नंबर", { sensitive: true, maxLen: 20 }),
  f("identity.dl_expiry", "identity", "date", "Driving licence expiry", "ड्राइविंग लाइसेंस समाप्ति", { expires: true }),
  f("identity.apaar_id", "identity", "string", "APAAR ID (ABC ID)", "अपार आईडी", { maxLen: 12 }),
  f("identity.abha_id", "identity", "string", "ABHA number", "आभा नंबर", { maxLen: 17, purposes: ["healthcare", "government_scheme", "identity_verification_only"] }),
  f("identity.oci_no", "identity", "string", "OCI card number", "ओसीआई कार्ड नंबर", { sensitive: true, maxLen: 12 }),
  f("identity.ration_card_no", "identity", "string", "Ration card number", "राशन कार्ड नंबर", { sensitive: true, maxLen: 20, purposes: ["government_scheme", "scholarship", "college_admission", "exam_application", "identity_verification_only"] }),
  f("identity.blood_group", "identity", "enum", "Blood group", "रक्त समूह", { options: E.BLOOD_GROUP }),
  f("identity.marital_status", "identity", "enum", "Marital status", "वैवाहिक स्थिति", { options: E.MARITAL, sources: SELF }),
  f("identity.mother_tongue", "identity", "string", "Mother tongue", "मातृभाषा", { sources: SELF, maxLen: 40 }),
  f("identity.languages_known", "identity", "string[]", "Languages known", "ज्ञात भाषाएँ", { sources: SELF }),

  // ---------- contact ----------
  f("contact.mobile_primary", "contact", "phone", "Mobile (primary)", "मोबाइल (प्राथमिक)", { sources: ["provider_verified", "self_declared"] }),
  f("contact.mobile_secondary", "contact", "phone", "Mobile (alternate)", "मोबाइल (वैकल्पिक)", { sources: SELF }),
  f("contact.email_primary", "contact", "email", "Email (primary)", "ईमेल (प्राथमिक)", { sources: ["provider_verified", "self_declared"] }),
  f("contact.email_secondary", "contact", "email", "Email (alternate)", "ईमेल (वैकल्पिक)", { sources: SELF }),
  f("contact.whatsapp_optin", "contact", "bool", "WhatsApp updates", "व्हाट्सऐप अपडेट", { sources: SELF }),

  // ---------- address ----------
  ...address("permanent", "Permanent", "स्थायी"),
  ...address("current", "Current", "वर्तमान"),
  ...address("correspondence", "Correspondence", "पत्राचार"),
  f("address.same_as_permanent", "address", "bool", "Current address same as permanent", "वर्तमान पता स्थायी पते जैसा", { sources: SELF }),

  // ---------- family ----------
  ...person("father", "Father", "पिता"),
  ...person("mother", "Mother", "माता"),
  ...person("guardian", "Guardian", "अभिभावक"),
  f("family.guardian.relation", "family", "enum", "Guardian's relation", "अभिभावक का संबंध", { options: E.RELATION, sources: SELF }),
  ...person("spouse", "Spouse", "जीवनसाथी"),
  f("family.siblings.name", "family", "string", "Sibling's name", "भाई/बहन का नाम", { repeat: "family.siblings", sources: SELF, maxLen: 120 }),
  f("family.siblings.dob", "family", "date", "Sibling's date of birth", "भाई/बहन की जन्म तिथि", { repeat: "family.siblings", sources: SELF }),
  f("family.nominee.name", "family", "string", "Nominee's name", "नामांकित व्यक्ति का नाम", { repeat: "family.nominee", sources: SELF, maxLen: 120, purposes: ["kyc_financial", "employment", "government_scheme", "healthcare"] }),
  f("family.nominee.relation", "family", "enum", "Nominee's relation", "नामांकित व्यक्ति का संबंध", { repeat: "family.nominee", options: E.RELATION, sources: SELF, purposes: ["kyc_financial", "employment", "government_scheme", "healthcare"] }),
  f("family.nominee.dob", "family", "date", "Nominee's date of birth", "नामांकित व्यक्ति की जन्म तिथि", { repeat: "family.nominee", sources: SELF, purposes: ["kyc_financial", "employment", "government_scheme", "healthcare"] }),
  f("family.nominee.share_pct", "family", "percentage", "Nominee share (%)", "नामांकित हिस्सा (%)", { repeat: "family.nominee", sources: SELF, purposes: ["kyc_financial", "employment", "government_scheme", "healthcare"] }),
  f("family.parent_govt_servant", "family", "bool", "Parent is a government servant", "माता/पिता सरकारी कर्मचारी हैं", { sources: SELF_DOC }),
  f("family.annual_income_total", "family", "money", "Total family annual income (₹)", "कुल पारिवारिक वार्षिक आय (₹)", { sensitive: true, purposes: ["scholarship", "college_admission", "exam_application", "government_scheme", "kyc_financial", "housing"] }),
  f("family.income_certificate", "family", "file_ref", "Income certificate", "आय प्रमाण पत्र"),
  f("family.income_certificate_no", "family", "string", "Income certificate number", "आय प्रमाण पत्र संख्या", { maxLen: 40 }),
  f("family.income_certificate_valid_until", "family", "date", "Income certificate valid until", "आय प्रमाण पत्र वैधता", { expires: true }),

  // ---------- category & eligibility ----------
  f("category.social", "category", "enum", "Category", "श्रेणी", { options: E.SOCIAL_CATEGORY }),
  f("category.certificate", "category", "file_ref", "Category certificate", "श्रेणी प्रमाण पत्र"),
  f("category.certificate_no", "category", "string", "Category certificate number", "श्रेणी प्रमाण पत्र संख्या", { maxLen: 40 }),
  f("category.issue_date", "category", "date", "Certificate issue date", "प्रमाण पत्र जारी तिथि"),
  f("category.valid_until", "category", "date", "Certificate valid until", "प्रमाण पत्र वैधता", { expires: true }),
  f("category.issuing_authority", "category", "string", "Issuing authority", "जारीकर्ता प्राधिकारी", { maxLen: 120 }),
  f("category.pwd", "category", "bool", "Person with disability (PwD)", "दिव्यांग"),
  f("category.pwd_type", "category", "enum", "Disability type", "दिव्यांगता प्रकार", { options: E.PWD_TYPE }),
  f("category.pwd_percentage", "category", "percentage", "Disability percentage", "दिव्यांगता प्रतिशत"),
  f("category.udid_no", "category", "string", "UDID number", "यूडीआईडी नंबर", { maxLen: 20 }),
  f("category.scribe_required", "category", "bool", "Scribe required", "लेखक (स्क्राइब) चाहिए", { sources: SELF }),
  f("category.ex_serviceman_ward", "category", "bool", "Ward of ex-serviceman", "भूतपूर्व सैनिक का आश्रित"),
  f("category.kashmiri_migrant", "category", "bool", "Kashmiri migrant", "कश्मीरी प्रवासी"),
  f("category.defence_ward", "category", "bool", "Ward of defence personnel", "रक्षा कर्मी का आश्रित"),
  f("category.single_girl_child", "category", "bool", "Single girl child", "इकलौती बालिका", { sources: SELF_DOC }),
  f("category.minority", "category", "bool", "Minority", "अल्पसंख्यक", { sources: SELF_DOC }),
  f("category.domicile_state", "category", "enum", "Domicile state", "अधिवास राज्य", { options: E.INDIA_STATES }),
  f("category.domicile_certificate", "category", "file_ref", "Domicile certificate", "अधिवास प्रमाण पत्र"),
  f("category.domicile_certificate_no", "category", "string", "Domicile certificate number", "अधिवास प्रमाण पत्र संख्या", { maxLen: 40 }),
  f("category.religion", "category", "enum", "Religion", "धर्म", { options: E.RELIGION, sensitive: true, sources: SELF, purposes: ["scholarship", "government_scheme", "college_admission"] }),

  // ---------- education ----------
  ...eduLevel("class10", "Class 10", "कक्षा 10"),
  ...eduLevel("class12", "Class 12", "कक्षा 12"),
  f("education.class12.stream", "education", "enum", "Class 12 stream", "कक्षा 12 स्ट्रीम", { options: E.STREAM }),
  f("education.class12.pcm_pct", "education", "percentage", "Class 12 PCM percentage", "कक्षा 12 PCM प्रतिशत", { derived: true }),
  f("education.class12.pcb_pct", "education", "percentage", "Class 12 PCB percentage", "कक्षा 12 PCB प्रतिशत", { derived: true }),
  ...higherEd("graduation", "Graduation", "स्नातक"),
  ...higherEd("postgrad", "Post-graduation", "स्नातकोत्तर"),
  ...higherEd("diploma", "Diploma", "डिप्लोमा"),
  f("education.gap_years.years", "education", "int", "Gap years", "गैप वर्ष", { sources: SELF, min: 0, max: 20 }),
  f("education.gap_years.reason", "education", "text", "Reason for gap", "गैप का कारण", { sources: SELF, maxLen: 300 }),
  f("education.exam_scores.exam", "education", "enum", "Exam", "परीक्षा", { repeat: "education.exam_scores", options: E.EXAM }),
  f("education.exam_scores.year", "education", "year", "Exam year", "परीक्षा वर्ष", { repeat: "education.exam_scores" }),
  f("education.exam_scores.roll", "education", "string", "Exam roll / application number", "परीक्षा रोल नंबर", { repeat: "education.exam_scores", maxLen: 20 }),
  f("education.exam_scores.score", "education", "number", "Score", "स्कोर", { repeat: "education.exam_scores" }),
  f("education.exam_scores.percentile", "education", "number", "Percentile", "पर्सेंटाइल", { repeat: "education.exam_scores", min: 0, max: 100 }),
  f("education.exam_scores.rank", "education", "int", "Rank (AIR)", "रैंक", { repeat: "education.exam_scores", min: 1 }),
  f("education.exam_scores.category_rank", "education", "int", "Category rank", "श्रेणी रैंक", { repeat: "education.exam_scores", min: 1 }),
  f("education.exam_scores.scorecard", "education", "file_ref", "Scorecard", "स्कोरकार्ड", { repeat: "education.exam_scores" }),

  // ---------- employment ----------
  f("employment.current.employer", "employment", "string", "Current employer", "वर्तमान नियोक्ता", { maxLen: 120 }),
  f("employment.current.designation", "employment", "string", "Designation", "पदनाम", { maxLen: 80 }),
  f("employment.current.sector", "employment", "enum", "Sector", "क्षेत्र", { options: E.SECTOR }),
  f("employment.current.start", "employment", "date", "Start date", "प्रारंभ तिथि"),
  f("employment.current.ctc", "employment", "money", "Annual CTC (₹)", "वार्षिक सीटीसी (₹)", { sensitive: true, purposes: ["employment", "kyc_financial", "housing"] }),
  f("employment.current.uan", "employment", "string", "UAN (EPFO)", "यूएएन", { sensitive: true, maxLen: 12, purposes: ["employment", "kyc_financial", "government_scheme"] }),
  f("employment.current.employee_id", "employment", "string", "Employee ID", "कर्मचारी आईडी", { maxLen: 40, sources: SELF }),
  f("employment.history.employer", "employment", "string", "Employer", "नियोक्ता", { repeat: "employment.history", maxLen: 120 }),
  f("employment.history.designation", "employment", "string", "Designation", "पदनाम", { repeat: "employment.history", maxLen: 80 }),
  f("employment.history.start", "employment", "date", "Start date", "प्रारंभ तिथि", { repeat: "employment.history" }),
  f("employment.history.end", "employment", "date", "End date", "समाप्ति तिथि", { repeat: "employment.history" }),
  f("employment.history.ctc", "employment", "money", "Annual CTC (₹)", "वार्षिक सीटीसी (₹)", { repeat: "employment.history", sensitive: true, purposes: ["employment", "kyc_financial"] }),
  f("employment.history.experience_letter", "employment", "file_ref", "Experience letter", "अनुभव पत्र", { repeat: "employment.history" }),
  f("employment.experience_total_months", "employment", "int", "Total experience (months)", "कुल अनुभव (माह)", { derived: true, min: 0 }),

  // ---------- health (opt-in; strongest gating) ----------
  f("health.allergies", "health", "string[]", "Allergies", "एलर्जी", { sensitive: true, sources: SELF_DOC, purposes: ["healthcare"] }),
  f("health.chronic_conditions", "health", "string[]", "Chronic conditions", "पुरानी बीमारियाँ", { sensitive: true, sources: SELF_DOC, purposes: ["healthcare"] }),
  f("health.emergency_contacts", "health", "json", "Emergency contacts", "आपातकालीन संपर्क", { sensitive: true, sources: SELF, purposes: ["healthcare", "exam_application", "college_admission", "employment"], help: { en: "[{name, relation, phone}]", hi: "[{name, relation, phone}]" } }),
  f("health.insurance.insurer", "health", "string", "Health insurer", "स्वास्थ्य बीमाकर्ता", { sensitive: true, purposes: ["healthcare"], maxLen: 120 }),
  f("health.insurance.policy_no", "health", "string", "Policy number", "पॉलिसी नंबर", { sensitive: true, purposes: ["healthcare"], maxLen: 40 }),
  f("health.insurance.valid_until", "health", "date", "Policy valid until", "पॉलिसी वैधता", { sensitive: true, purposes: ["healthcare"], expires: true }),
  f("health.medical_fitness_certificate", "health", "file_ref", "Medical fitness certificate", "चिकित्सा फिटनेस प्रमाण पत्र", { sensitive: true, purposes: ["healthcare", "employment", "exam_application", "college_admission"] }),

  // ---------- bank ----------
  f("bank.primary.account_no", "bank", "string", "Account number", "खाता संख्या", { sensitive: true, purposes: ["kyc_financial", "scholarship", "government_scheme", "employment"], maxLen: 20 }),
  f("bank.primary.account_last4", "bank", "string", "Account (last 4)", "खाता (अंतिम 4)", { derived: true, maxLen: 4 }),
  f("bank.primary.ifsc", "bank", "ifsc", "IFSC", "आईएफएससी", { purposes: ["kyc_financial", "scholarship", "government_scheme", "employment"] }),
  f("bank.primary.bank_name", "bank", "string", "Bank name", "बैंक का नाम", { maxLen: 80, purposes: ["kyc_financial", "scholarship", "government_scheme", "employment"] }),
  f("bank.primary.branch", "bank", "string", "Branch", "शाखा", { maxLen: 80, purposes: ["kyc_financial", "scholarship", "government_scheme", "employment"] }),
  f("bank.primary.holder_name", "bank", "string", "Account holder name", "खाताधारक का नाम", { maxLen: 120, purposes: ["kyc_financial", "scholarship", "government_scheme", "employment"] }),
  f("bank.primary.account_type", "bank", "enum", "Account type", "खाता प्रकार", { options: E.ACCOUNT_TYPE, purposes: ["kyc_financial", "scholarship", "government_scheme", "employment"] }),
  f("bank.primary.passbook", "bank", "file_ref", "Passbook / cancelled cheque", "पासबुक / रद्द चेक", { sensitive: true, purposes: ["kyc_financial", "scholarship", "government_scheme", "employment"] }),

  // ---------- prefs ----------
  f("prefs.language", "prefs", "enum", "Preferred language", "पसंदीदा भाषा", { options: E.LANGUAGE, sources: SELF }),
  f("prefs.exam_city_choices", "prefs", "string[]", "Exam city preferences", "परीक्षा शहर प्राथमिकताएँ", { sources: SELF }),
  f("prefs.notification_channels", "prefs", "string[]", "Notification channels", "सूचना माध्यम", { sources: SELF }),
];

export const REGISTRY_MAP: ReadonlyMap<string, FieldDef> = new Map(REGISTRY.map((d) => [d.key, d]));
export const FACT_KEYS = REGISTRY.map((d) => d.key) as readonly string[];
export type FactKey = (typeof REGISTRY)[number]["key"];

export const field = (key: string): FieldDef => {
  const d = REGISTRY_MAP.get(key);
  if (!d) throw new Error(`Unknown fact_key: ${key}`);
  return d;
};
export const isFactKey = (key: string): boolean => REGISTRY_MAP.has(key);
export const fieldsInSection = (section: Section): FieldDef[] => REGISTRY.filter((d) => d.section === section);
/** keys a citizen can actually edit/see (no system keys) */
export const SHAREABLE_KEYS = REGISTRY.filter((d) => !d.system).map((d) => d.key);
/** repeating group id → its keys */
export const REPEAT_GROUPS: Record<string, string[]> = REGISTRY.reduce((acc, d) => {
  if (d.repeat) (acc[d.repeat] ??= []).push(d.key);
  return acc;
}, {} as Record<string, string[]>);
