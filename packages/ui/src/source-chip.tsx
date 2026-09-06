import { ShieldCheck, ScanLine, PenLine, AlertTriangle, Clock } from "lucide-react";
import type { Source } from "@applyonce/schema";
import { SOURCE_META, verifierName, daysUntil, cx, type Locale } from "./format";

const TONE = {
  verified: "bg-verified-50 text-verified-700 border-verified-500/30",
  extracted: "bg-info-50 text-info-500 border-info-500/30",
  self: "bg-pending-50 text-pending-700 border-pending-500/30",
  expired: "bg-danger-50 text-danger-500 border-danger-500/30",
  expiring: "bg-pending-50 text-pending-700 border-pending-500/40",
};
const ICON = { verified: ShieldCheck, extracted: ScanLine, self: PenLine, expired: AlertTriangle, expiring: Clock };

/** Every rendered fact value MUST carry this. Green only for issuer/provider-verified. */
export function SourceChip({ source, verifiedBy, expiresAt, locale = "en", size = "sm", className }: { source: Source; verifiedBy?: string | null; expiresAt?: string | null; locale?: Locale; size?: "sm" | "md"; className?: string }) {
  const meta = SOURCE_META[source];
  const dl = daysUntil(expiresAt);
  const tone = dl != null && dl < 0 ? "expired" : dl != null && dl <= 60 ? "expiring" : meta.tone;
  const I = ICON[tone];
  const text = tone === "expired" ? (locale === "hi" ? "समाप्त" : "Expired") : tone === "expiring" ? (locale === "hi" ? `${dl} दिन शेष` : `Expires in ${dl}d`) : meta.tone === "verified" && verifiedBy ? `${meta[locale]} · ${verifierName(verifiedBy)}` : meta[locale];
  return (
    <span data-tone={tone} data-testid="source-chip" className={cx("inline-flex max-w-full items-center gap-1 rounded-pill border font-medium whitespace-nowrap", size === "sm" ? "px-2 py-0.5 text-xs" : "px-2.5 py-1 text-sm", TONE[tone], tone === "verified" && "stamp", className)}>
      <I className={size === "sm" ? "size-3.5" : "size-4"} strokeWidth={2.25} /><span className="truncate">{text}</span>
    </span>
  );
}
