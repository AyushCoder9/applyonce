import { field, ENUM_LABELS, type FactValue, type Source, PURPOSE_LABELS, type Purpose } from "@applyonce/schema";
export type Locale = "en" | "hi";

export const PRODUCT_TIME_ZONE = "Asia/Kolkata";
const localeName = (locale: Locale) => (locale === "hi" ? "hi-IN" : "en-IN");

/** Keep server HTML and browser hydration identical across deployment regions. */
export const fmtDate = (d?: string | Date | null, locale: Locale = "en") => (d ? new Date(d).toLocaleDateString(localeName(locale), {
  day: "numeric",
  month: "short",
  year: "numeric",
  timeZone: PRODUCT_TIME_ZONE,
}) : "—");

export const fmtDateTime = (d?: string | Date | null, locale: Locale = "en") => (d ? new Date(d).toLocaleString(localeName(locale), {
  dateStyle: "medium",
  timeStyle: "short",
  timeZone: PRODUCT_TIME_ZONE,
}) : "—");

export function dateInputValue(d: string | number | Date): string {
  const parts = new Intl.DateTimeFormat("en-IN", {
    timeZone: PRODUCT_TIME_ZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(new Date(d));
  const value = Object.fromEntries(parts.map(({ type, value: part }) => [type, part]));
  return `${value.year}-${value.month}-${value.day}`;
}
export const fmtMoney = (n: number) => `₹${n.toLocaleString("en-IN")}`;
export const daysUntil = (d?: string | Date | null) => (d ? Math.ceil((new Date(d).getTime() - Date.now()) / 864e5) : null);
export const label = (key: string, locale: Locale = "en") => { try { return field(key).label[locale]; } catch { return key; } };
export const purposeLabel = (p: Purpose, locale: Locale = "en") => PURPOSE_LABELS[p]?.[locale] ?? p;

/** Human display for any fact value. */
export function fmtValue(key: string, v: FactValue | undefined, locale: Locale = "en"): string {
  if (v == null || v === "") return "—";
  let d; try { d = field(key); } catch { return String(v); }
  // Consent previews receive already-masked sensitive values. Never coerce those
  // placeholders (for example a masked income) back into numbers for display.
  if (d.sensitive && typeof v === "string" && v.includes("•")) return v;
  switch (d.type) {
    case "date": return fmtDate(String(v), locale);
    case "money": return fmtMoney(Number(v));
    case "percentage": return `${v}%`;
    case "bool": return v ? (locale === "hi" ? "हाँ" : "Yes") : locale === "hi" ? "नहीं" : "No";
    case "enum": { const g = key.endsWith(".gender") ? "gender" : key === "category.social" ? "social" : key.endsWith(".board") ? "board" : key === "identity.nationality" ? "nationality" : key === "prefs.language" ? "language" : null; const raw = String(v); const pretty = g ? null : raw.includes("_") || /^[a-z]/.test(raw) ? raw.replace(/_/g, " ").replace(/^\w/, (c) => c.toUpperCase()) : null; if (!g && pretty) return pretty; return (g && ENUM_LABELS[g]?.[String(v)]?.[locale]) ?? String(v); }
    case "string[]": return Array.isArray(v) ? v.join(", ") : String(v);
    case "file_ref": return locale === "hi" ? "दस्तावेज़ संलग्न" : "Document attached";
    case "json": return Array.isArray(v) ? `${v.length} ${locale === "hi" ? "प्रविष्टियाँ" : "entries"}` : "…";
    case "phone": return `+91 ${String(v).replace(/(\d{5})(\d{5})/, "$1 $2")}`;
    default: return String(v);
  }
}

export const SOURCE_META: Record<Source, { en: string; hi: string; tone: "verified" | "extracted" | "self" }> = {
  issuer_verified: { en: "Verified", hi: "सत्यापित", tone: "verified" },
  provider_verified: { en: "Verified", hi: "सत्यापित", tone: "verified" },
  document_extracted: { en: "From document", hi: "दस्तावेज़ से", tone: "extracted" },
  self_declared: { en: "Self-declared", hi: "स्व-घोषित", tone: "self" },
};
export const VERIFIER_NAMES: Record<string, string> = { uidai: "UIDAI (Aadhaar)", digilocker: "DigiLocker", cbse: "CBSE", cisce: "CISCE", state_board: "State Board", nad: "NAD", apaar: "APAAR", nsdl_pan: "Income Tax Dept (PAN)", abdm: "ABDM (ABHA)", account_aggregator: "Account Aggregator", penny_drop: "Bank (penny drop)", otp: "OTP", email_link: "Email", udid: "UDID", edistrict: "e-District", ocr: "OCR" };
export const verifierName = (v?: string | null) => (v ? VERIFIER_NAMES[v] ?? v : "");
export const initials = (name: string) => name.split(/\s+/).slice(0, 2).map((s) => s[0]?.toUpperCase() ?? "").join("");
export const cx = (...c: (string | false | null | undefined)[]) => c.filter(Boolean).join(" ");
