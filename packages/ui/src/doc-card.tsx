import Link from "next/link";
import { FileText, ShieldCheck, Upload, Sparkles } from "lucide-react";
import { fmtDate, daysUntil, cx, type Locale } from "./format";
export interface DocCardData { id: string; title: string; docType: string; issuerName?: string | null; origin: "digilocker" | "upload" | "generated"; status: "pending" | "ready" | "rejected"; validUntil?: string | Date | null; issuedAt?: string | Date | null; sha256?: string | null }
export function DocCard({ doc, href, locale = "en", action }: { doc: DocCardData; href?: string; locale?: Locale; action?: React.ReactNode }) {
  const dl = daysUntil(doc.validUntil);
  const Origin = doc.origin === "digilocker" ? ShieldCheck : doc.origin === "generated" ? Sparkles : Upload;
  const inner = (
    <div className={cx("card flex gap-4 p-4 transition-shadow", href && "hover:shadow-pop")}>
      <div className={cx("grid size-14 shrink-0 place-items-center rounded-md", doc.origin === "digilocker" ? "bg-verified-50 text-verified-700" : "bg-surface-2 text-ink-2")}><FileText className="size-7" strokeWidth={1.5} /></div>
      <div className="min-w-0 flex-1">
        <div className="truncate font-semibold">{doc.title}</div>
        <div className="mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-ink-2">
          <span className={cx("inline-flex items-center gap-1 rounded-pill px-2 py-0.5", doc.origin === "digilocker" ? "bg-verified-50 text-verified-700" : "bg-surface-2")}><Origin className="size-3.5" />{doc.origin === "digilocker" ? (locale === "hi" ? "जारीकर्ता से" : "Issuer-verified") : doc.origin === "generated" ? "Praman-generated" : locale === "hi" ? "अपलोड किया" : "Uploaded"}</span>
          {doc.issuerName && <span>{doc.issuerName}</span>}
          {doc.issuedAt && <span>· {fmtDate(doc.issuedAt, locale)}</span>}
          {dl != null && <span className={cx("font-medium", dl < 0 ? "text-danger-500" : dl <= 60 ? "text-pending-700" : "")}>· {dl < 0 ? "Expired" : `Valid ${dl}d`}</span>}
          {doc.status === "pending" && <span className="text-pending-700">· Processing</span>}
          {doc.status === "rejected" && <span className="text-danger-500">· Rejected</span>}
        </div>
      </div>
      {action}
    </div>
  );
  return href ? <Link href={href} className="block">{inner}</Link> : inner;
}
