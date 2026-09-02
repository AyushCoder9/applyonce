import type { Purpose } from "./types";
import { field } from "./registry";

/** Can `key` be shared under `purpose`? Sensitive groups are purpose-gated. System keys never. */
export function canShare(key: string, purpose: Purpose): boolean {
  const d = field(key);
  if (d.system) return false;
  if (!d.purposes) return true;
  return d.purposes.includes(purpose);
}

/** Split a requested key list into allowed / blocked for a purpose. Blocked keys must be dropped BEFORE consent is written. */
export function scopeForPurpose(keys: readonly string[], purpose: Purpose) {
  const allowed: string[] = [], blocked: string[] = [];
  for (const k of keys) (canShare(k, purpose) ? allowed : blocked).push(k);
  return { allowed, blocked };
}

/** Consent invariant helper: every shared key ⊆ consent scope. */
export const isSubset = (shared: readonly string[], scope: readonly string[]) => {
  const s = new Set(scope);
  return shared.every((k) => s.has(k));
};

export const PURPOSE_LABELS: Record<Purpose, { en: string; hi: string }> = {
  exam_application: { en: "Exam application", hi: "परीक्षा आवेदन" },
  college_admission: { en: "College admission", hi: "कॉलेज प्रवेश" },
  scholarship: { en: "Scholarship", hi: "छात्रवृत्ति" },
  kyc_financial: { en: "Bank / financial KYC", hi: "बैंक / वित्तीय केवाईसी" },
  employment: { en: "Employment", hi: "रोज़गार" },
  healthcare: { en: "Healthcare", hi: "स्वास्थ्य सेवा" },
  housing: { en: "Housing / rental", hi: "आवास / किराया" },
  government_scheme: { en: "Government scheme", hi: "सरकारी योजना" },
  age_verification_only: { en: "Age verification only", hi: "केवल आयु सत्यापन" },
  identity_verification_only: { en: "Identity verification only", hi: "केवल पहचान सत्यापन" },
};
