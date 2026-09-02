import type { Source } from "@praman/schema";

/**
 * The badge shown next to every pre-filled field on `/apply/return`:
 * green "Verified by X" (issuer_verified/provider_verified), blue "From document"
 * (document_extracted), amber "Self-declared" (self_declared), grey "You entered"
 * (BTA's own custom questions, which have no Praman `source` at all).
 */
export function SourceBadge({ source, verifiedBy }: { source: Source | "custom"; verifiedBy?: string | null }) {
  if (source === "custom") return <span className="badge badge-entered">You entered</span>;
  if (source === "issuer_verified" || source === "provider_verified") {
    return <span className="badge badge-verified">Verified by {formatVerifier(verifiedBy)}</span>;
  }
  if (source === "document_extracted") return <span className="badge badge-document">From document</span>;
  return <span className="badge badge-self">Self-declared</span>;
}

const VERIFIER_LABELS: Record<string, string> = {
  uidai: "UIDAI",
  digilocker: "DigiLocker",
  cbse: "CBSE",
  cisce: "CISCE",
  state_board: "State Board",
  nad: "NAD",
  apaar: "APAAR",
  nsdl_pan: "NSDL (PAN)",
  abdm: "ABDM",
  account_aggregator: "Account Aggregator",
  penny_drop: "Bank",
  otp: "OTP",
  email_link: "Email",
  udid: "UDID",
  edistrict: "e-District",
  ocr: "Document scan",
  self: "Self",
};

function formatVerifier(v?: string | null): string {
  if (!v) return "Praman";
  return VERIFIER_LABELS[v] ?? v.toUpperCase();
}
