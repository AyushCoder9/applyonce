/** Canonical Citizen Schema — types. Source of truth: docs/03-DATA-MODEL.md */

export const SECTIONS = [
  "identity", "contact", "address", "family", "category",
  "education", "employment", "health", "bank", "prefs",
] as const;
export type Section = (typeof SECTIONS)[number];

export const SOURCES = ["self_declared", "document_extracted", "issuer_verified", "provider_verified"] as const;
export type Source = (typeof SOURCES)[number];

/** Who can vouch for a value. Free-form but these are the known issuers. */
export const VERIFIERS = [
  "uidai", "digilocker", "cbse", "cisce", "state_board", "nad", "apaar", "nsdl_pan", "abdm",
  "account_aggregator", "penny_drop", "otp", "email_link", "udid", "edistrict", "ocr", "self",
] as const;
export type Verifier = (typeof VERIFIERS)[number] | (string & {});

export const FACT_TYPES = [
  "string", "text", "date", "enum", "number", "int", "year", "percentage", "money",
  "phone", "email", "bool", "file_ref", "string[]", "pincode", "pan", "ifsc", "json",
] as const;
export type FactType = (typeof FACT_TYPES)[number];

export const PURPOSES = [
  "exam_application", "college_admission", "scholarship", "kyc_financial", "employment",
  "healthcare", "housing", "government_scheme", "age_verification_only", "identity_verification_only",
] as const;
export type Purpose = (typeof PURPOSES)[number];

export type Label = { en: string; hi: string };

export interface FieldDef {
  key: string;
  section: Section;
  type: FactType;
  label: Label;
  help?: Label;
  /** enum options; label lookup via ENUM_LABELS */
  options?: readonly string[];
  /** encrypted at rest + masked in UI, reveal needs step-up */
  sensitive?: boolean;
  /** stored in a repeating group (repeat_index > 0 allowed); group id = key prefix */
  repeat?: string;
  /** sources allowed to write this value */
  sources: readonly Source[];
  /** only shareable under these purposes (undefined = any purpose) */
  purposes?: readonly Purpose[];
  /** value is system-managed, never user-editable, never shared */
  system?: boolean;
  /** derived from other keys; read-only */
  derived?: boolean;
  /** expiry tracked → reminders (60/30/7 d) */
  expires?: boolean;
  maxLen?: number;
  min?: number;
  max?: number;
}

export type FactValue = string | number | boolean | string[] | Record<string, unknown> | null;

/** One stored fact with provenance. Every UI render must show `source`. */
export interface Fact {
  key: string;
  value: FactValue;
  repeatIndex: number;
  source: Source;
  verifiedBy?: Verifier | null;
  verifiedAt?: string | null;
  expiresAt?: string | null;
  evidenceDocumentId?: string | null;
  confidence?: number | null;
  updatedAt?: string;
}
