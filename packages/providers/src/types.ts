/** Provider adapter interfaces. Apps code against these only. mock → setu (sandbox) → apisetu (live) via env. */

export interface IssuedDoc {
  uri: string;            // e.g. in.gov.cbse-MARKSHEET-2025-1234567
  docType: string;        // aadhaar | pan | marksheet_10 | marksheet_12 | category_cert | income_cert | dl | ...
  name: string;           // human title
  issuerId: string;       // in.gov.uidai
  issuerName: string;     // UIDAI
  issuedAt?: string;      // ISO
  validUntil?: string;
  mime: string;
  /** structured data when the issuer provides it (CBSE XML, Aadhaar XML, PAN) */
  data?: Record<string, unknown>;
}

export interface AadhaarOfflineKyc {
  name: string; dob: string; gender: "M" | "F" | "T"; photoBase64?: string;
  address: { house?: string; street?: string; landmark?: string; locality?: string; vtc: string; district: string; state: string; pincode: string; country: string };
  last4: string; referenceKey: string; xmlHash: string; generatedAt: string;
}

/**
 * Short-lived OAuth material that belongs to one browser authorization attempt.
 * The web app must keep this server-confidential and bind it to the callback.
 */
export interface ProviderAuthTransaction {
  state: string;
  redirectUri: string;
  codeVerifier?: string;
}

export interface ProviderAuthStart {
  url: string;
  transaction: ProviderAuthTransaction;
}

export interface ProviderAuthResult {
  /** Opaque, encrypted-at-rest provider session material. */
  providerRef: string;
  name?: string;
  dob?: string;
}

export interface DigiLockerProvider {
  startAuth(userId: string, redirectUri: string): Promise<ProviderAuthStart>;
  completeAuth(transaction: ProviderAuthTransaction, code: string): Promise<ProviderAuthResult>;
  listIssuedDocs(providerRef: string): Promise<IssuedDoc[]>;
  fetchDoc(providerRef: string, uri: string): Promise<{ bytes: Uint8Array; mime: string; data?: Record<string, unknown> }>;
  fetchAadhaarXml(providerRef: string): Promise<AadhaarOfflineKyc>;
  refresh?(providerRef: string): Promise<{ providerRef: string }>;
  revoke?(providerRef: string): Promise<void>;
}

export interface PanProvider {
  verify(pan: string, name: string, dob: string): Promise<{ valid: boolean; nameMatch: number; status?: string }>;
}
export interface AbhaProvider {
  startLink(userId: string, redirectUri: string): Promise<{ url: string; state: string }>;
  profile(providerRef: string): Promise<{ abhaNumber: string; abhaAddress: string; name: string; dob: string; gender: string; bloodGroup?: string }>;
}
export interface AaProvider {
  createConsent(userId: string, purpose: string, redirectUri: string): Promise<{ url: string; consentHandle: string }>;
  fetchIncomeSummary(consentHandle: string): Promise<{ annualIncome: number; source: string; period: string; accounts: { bank: string; last4: string }[] }>;
}
export interface EsignProvider { sign(pdf: Uint8Array, signer: { name: string; reason: string }): Promise<{ signedPdf: Uint8Array; certInfo: string }> }
export interface OcrProvider { extract(bytes: Uint8Array, docType: string): Promise<{ fields: Record<string, string>; confidence: number; raw?: unknown }> }
export interface SmsProvider { send(to: string, text: string, template?: string): Promise<{ id: string }> }
export interface EmailProvider { send(to: string, subject: string, html: string): Promise<{ id: string }> }

export interface Providers {
  digilocker: DigiLockerProvider; pan: PanProvider; abha: AbhaProvider; aa: AaProvider;
  esign: EsignProvider; ocr: OcrProvider; sms: SmsProvider; email: EmailProvider;
}
