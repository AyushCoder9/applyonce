"use client";
import { useState } from "react";
import { Button, Switch, toast } from "@heroui/react";
import type { Locale } from "@praman/ui";
import { CHANNELS, CATEGORIES, type PrefMatrix } from "./prefs";
const CH: Record<string, { en: string; hi: string }> = { inapp: { en: "In-app", hi: "ऐप में" }, sms: { en: "SMS", hi: "एसएमएस" }, email: { en: "Email", hi: "ईमेल" }, whatsapp: { en: "WhatsApp", hi: "व्हाट्सऐप" } };
const CAT: Record<string, { en: string; hi: string; blurb: { en: string; hi: string } }> = {
  application: { en: "Applications", hi: "आवेदन", blurb: { en: "Status changes, admit cards, deadlines", hi: "स्थिति, एडमिट कार्ड, समय सीमा" } },
  verification: { en: "Verification", hi: "सत्यापन", blurb: { en: "DigiLocker sync, PAN, mismatches", hi: "डिजिलॉकर, पैन, विसंगति" } },
  expiry: { en: "Expiry", hi: "समाप्ति", blurb: { en: "Certificates expiring in 60/30/7 days", hi: "60/30/7 दिन में समाप्त प्रमाण पत्र" } },
  consent: { en: "Consent", hi: "सहमति", blurb: { en: "Every share, revoke and family access (always on in-app)", hi: "हर साझा, रद्द और परिवार पहुँच" } },
  system: { en: "System", hi: "सिस्टम", blurb: { en: "Security and account notices", hi: "सुरक्षा व खाता सूचनाएँ" } },
};
export function PrefsGrid({ initial, locale: l }: { initial: PrefMatrix; locale: Locale }) {
  const [m, setM] = useState(initial);
  const [busy, setBusy] = useState(false);
  const set = (ch: string, c: string, v: boolean) => setM((p) => ({ ...p, [ch]: { ...p[ch as keyof PrefMatrix], [c]: v } }));
  const save = async () => {
    setBusy(true);
    const r = await fetch("/api/v1/notifications/prefs", { method: "PUT", headers: { "content-type": "application/json" }, body: JSON.stringify(m) });
    setBusy(false);
    r.ok ? toast.success(l === "hi" ? "सहेजा गया" : "Preferences saved") : toast.danger("Could not save");
  };
  return (
    <div className="card overflow-x-auto">
      <table className="w-full min-w-[560px] text-sm">
        <thead><tr className="border-b border-line text-left text-xs uppercase tracking-[0.04em] text-ink-3"><th className="px-4 py-3">{l === "hi" ? "श्रेणी" : "Category"}</th>{CHANNELS.map((ch) => <th key={ch} className="px-4 py-3 text-center">{CH[ch]?.[l]}</th>)}</tr></thead>
        <tbody>{CATEGORIES.map((c) => (
          <tr key={c} className="border-b border-line last:border-0"><td className="px-4 py-3"><div className="font-medium">{CAT[c]?.[l]}</div><div className="text-xs text-ink-3">{CAT[c]?.blurb[l]}</div></td>
            {CHANNELS.map((ch) => <td key={ch} className="px-4 py-3 text-center"><Switch aria-label={`${CAT[c]?.en} via ${CH[ch]?.en}`} isSelected={m[ch][c]} isDisabled={ch === "inapp" && c === "consent"} onChange={(v) => set(ch, c, v)} className="inline-flex"><Switch.Control><Switch.Thumb /></Switch.Control></Switch></td>)}
          </tr>))}</tbody>
      </table>
      <div className="flex items-center justify-between gap-3 px-4 py-3"><p className="text-xs text-ink-3">{l === "hi" ? "सहमति सूचनाएँ ऐप में हमेशा चालू रहती हैं (DPDP)।" : "Consent notices are always on in-app (DPDP)."}</p><Button className="cta" onPress={save} isPending={busy}>{l === "hi" ? "सहेजें" : "Save"}</Button></div>
    </div>
  );
}
