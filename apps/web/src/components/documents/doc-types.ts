import type { Locale } from "@applyonce/ui";
export const DOC_TYPE_LABELS: Record<string, { en: string; hi: string }> = {
  aadhaar: { en: "Aadhaar", hi: "आधार" }, pan: { en: "PAN", hi: "पैन" }, marksheet_10: { en: "Class 10 marksheet", hi: "कक्षा 10 मार्कशीट" }, marksheet_12: { en: "Class 12 marksheet", hi: "कक्षा 12 मार्कशीट" }, degree: { en: "Degree certificate", hi: "डिग्री प्रमाण पत्र" },
  category_cert: { en: "Category certificate", hi: "श्रेणी प्रमाण पत्र" }, income_cert: { en: "Income certificate", hi: "आय प्रमाण पत्र" }, domicile_cert: { en: "Domicile certificate", hi: "अधिवास प्रमाण पत्र" }, photo: { en: "Photograph", hi: "फ़ोटो" }, signature: { en: "Signature", hi: "हस्ताक्षर" },
  passport: { en: "Passport", hi: "पासपोर्ट" }, dl: { en: "Driving licence", hi: "ड्राइविंग लाइसेंस" }, bank_passbook: { en: "Bank passbook / cheque", hi: "बैंक पासबुक / चेक" }, other: { en: "Other", hi: "अन्य" },
};
export const docTypeLabel = (t: string, l: Locale) => DOC_TYPE_LABELS[t]?.[l] ?? t.replace(/_/g, " ");
export const UPLOAD_TYPES = ["marksheet_10", "marksheet_12", "degree", "category_cert", "income_cert", "domicile_cert", "photo", "signature", "passport", "dl", "bank_passbook", "aadhaar", "pan", "other"] as const;
