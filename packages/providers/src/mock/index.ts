import type { Providers, DigiLockerProvider, IssuedDoc } from "../types";
import { byPhone, byRef, DEMO_PEOPLE, MOCK_OTP } from "../fixtures";

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));
const pdfStub = (title: string) => new TextEncoder().encode(`%PDF-1.4\n% Praman mock document: ${title}\n%%EOF`);

/** Mock DigiLocker: auth URL points to our own fake consent page; `code` = phone of the demo person. */
const digilocker: DigiLockerProvider = {
  async startAuth(userId, redirectUri) {
    const state = `mock_${userId}_${Date.now().toString(36)}`;
    return { url: `/mock/digilocker?state=${encodeURIComponent(state)}&redirect_uri=${encodeURIComponent(redirectUri)}`, state };
  },
  async completeAuth(_state, code) {
    const p = byPhone(code) ?? DEMO_PEOPLE[0]!;
    await sleep(300);
    return { providerRef: `dl_${p.id}`, name: p.name, dob: p.dob };
  },
  async listIssuedDocs(ref) { await sleep(400); return (byRef(ref) ?? DEMO_PEOPLE[0]!).docs; },
  async fetchDoc(ref, uri) {
    await sleep(250);
    const doc = (byRef(ref) ?? DEMO_PEOPLE[0]!).docs.find((d: IssuedDoc) => d.uri === uri);
    if (!doc) throw new Error(`mock: no doc ${uri}`);
    return { bytes: pdfStub(doc.name), mime: doc.mime, data: doc.data };
  },
  async fetchAadhaarXml(ref) { await sleep(300); return (byRef(ref) ?? DEMO_PEOPLE[0]!).aadhaar; },
};

export const mockProviders: Providers = {
  digilocker,
  pan: { async verify(pan, name) { await sleep(300); const p = DEMO_PEOPLE.find((x) => x.pan === pan); return p ? { valid: true, nameMatch: p.name.toLowerCase() === name.toLowerCase() ? 1 : 0.6, status: "VALID" } : { valid: /^[A-Z]{5}\d{4}[A-Z]$/.test(pan), nameMatch: 0.5, status: "UNKNOWN" }; } },
  abha: {
    async startLink(userId, redirectUri) { const state = `abha_${userId}`; return { url: `/mock/abha?state=${state}&redirect_uri=${encodeURIComponent(redirectUri)}`, state }; },
    async profile(ref) { const p = byRef(ref) ?? DEMO_PEOPLE[0]!; return { abhaNumber: p.abha ?? "91-0000-0000-0000", abhaAddress: `${p.name.split(" ")[0]!.toLowerCase()}@abdm`, name: p.name, dob: p.dob, gender: p.gender, bloodGroup: "B+" }; },
  },
  aa: {
    async createConsent(userId, purpose, redirectUri) { return { url: `/mock/aa?handle=aa_${userId}&purpose=${purpose}&redirect_uri=${encodeURIComponent(redirectUri)}`, consentHandle: `aa_${userId}` }; },
    async fetchIncomeSummary() { await sleep(500); return { annualIncome: 450000, source: "bank_statement_12m", period: "2025-09..2026-08", accounts: [{ bank: "State Bank of India", last4: "4567" }] }; },
  },
  esign: { async sign(pdf, signer) { return { signedPdf: pdf, certInfo: `MOCK-ESIGN ${signer.name} ${new Date().toISOString()}` }; } },
  ocr: {
    async extract(_bytes, docType) {
      await sleep(800);
      // ponytail: fixed fixture per docType; swap for Document AI / Surepass OCR via env
      const F: Record<string, Record<string, string>> = {
        marksheet_12: { "education.class12.board": "CBSE", "education.class12.year": "2025", "education.class12.roll_no": "4587654", "education.class12.percentage": "91.2", "education.class12.school_name": "City Montessori School" },
        marksheet_10: { "education.class10.board": "CBSE", "education.class10.year": "2023", "education.class10.percentage": "94.2" },
        category_cert: { "category.social": "OBC-NCL", "category.certificate_no": "UP/OBC/2025/778899", "category.issuing_authority": "Tehsildar, Sadar, Lucknow" },
        income_cert: { "family.annual_income_total": "450000", "family.income_certificate_no": "UP/INC/2025/334455" },
        pan: { "identity.pan": "BXYPS1234K", "identity.full_name": "Aarav Sharma", "identity.dob": "2007-03-14" },
        aadhaar: { "identity.full_name": "Aarav Sharma", "identity.dob": "2007-03-14", "identity.gender": "M", "address.permanent.pincode": "226010" },
      };
      return { fields: F[docType] ?? { "identity.full_name": "Aarav Sharma" }, confidence: 0.86 };
    },
  },
  sms: { async send(to, text) { console.log(`[mock sms → ${to}] ${text}`); return { id: `sms_${Date.now()}` }; } },
  email: { async send(to, subject) { console.log(`[mock email → ${to}] ${subject}`); return { id: `em_${Date.now()}` }; } },
};
export { MOCK_OTP };
