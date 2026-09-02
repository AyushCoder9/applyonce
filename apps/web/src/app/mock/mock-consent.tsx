"use client";
/** Fake provider consent screen for mock providers. Looks like DigiLocker/ABDM/AA; picks a demo person; redirects with state + code (phone). */
import { useState } from "react";
import { ShieldCheck, Lock, ChevronRight } from "lucide-react";

const PEOPLE = [
  { phone: "9876543210", name: "Aarav Sharma", hint: "Student · Lucknow · 7 issued documents" },
  { phone: "9876500002", name: "Sunita Sharma", hint: "Parent · Aadhaar + PAN" },
  { phone: "9123456780", name: "Vikram Rao", hint: "Graduate · Hyderabad · degree on NAD" },
];
const BRAND = {
  digilocker: { name: "DigiLocker", org: "National e-Governance Division · MeitY", color: "#1f5fa8", scopes: ["Issued documents (Aadhaar, PAN, CBSE, e-District)", "Aadhaar e-KYC (name, DOB, gender, address, photo)", "Pull documents on your behalf when you re-sync"] },
  abha: { name: "ABHA", org: "Ayushman Bharat Digital Mission · NHA", color: "#0f766e", scopes: ["ABHA number and address", "Basic profile (name, DOB, gender, blood group)"] },
  aa: { name: "Account Aggregator", org: "RBI-regulated NBFC-AA (sandbox)", color: "#7c3aed", scopes: ["Bank statement summary, last 12 months", "Income estimate for scholarship eligibility", "Consent valid 30 days · one-time fetch"] },
} as const;

export function MockConsent({ provider, redirectUri, state, handle }: { provider: keyof typeof BRAND; redirectUri: string; state?: string; handle?: string }) {
  const b = BRAND[provider];
  const [phone, setPhone] = useState(PEOPLE[0]!.phone);
  const [busy, setBusy] = useState(false);
  const go = (allow: boolean) => {
    setBusy(true);
    const u = new URL(redirectUri, window.location.origin);
    if (provider === "aa") { u.searchParams.set("handle", allow ? handle ?? "" : ""); }
    else { u.searchParams.set("state", state ?? ""); if (allow) u.searchParams.set("code", phone); else u.searchParams.set("error", "access_denied"); }
    window.location.href = u.toString();
  };
  return (
    <main className="min-h-dvh bg-[#f3f4f6] text-[#111827]" style={{ fontFamily: "system-ui, sans-serif" }}>
      <header className="text-white" style={{ background: b.color }}>
        <div className="mx-auto flex max-w-lg items-center gap-3 px-5 py-4"><span className="grid size-9 place-items-center rounded bg-white/15 font-bold">{b.name[0]}</span><div><div className="text-lg font-semibold leading-tight">{b.name}</div><div className="text-xs opacity-80">{b.org}</div></div><span className="ml-auto rounded bg-white/15 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider">Mock</span></div>
      </header>
      <div className="mx-auto max-w-lg px-5 py-8">
        <div className="rounded-lg border border-[#e5e7eb] bg-white p-6 shadow-sm">
          <div className="flex items-center gap-3"><img src="/icon.svg" alt="" className="size-10 rounded-lg" /><div><div className="font-semibold">Praman wants to access your {b.name} account</div><div className="text-sm text-[#6b7280]">praman.in · verified partner</div></div></div>
          <ul className="mt-5 grid gap-2 text-sm">{b.scopes.map((s) => <li key={s} className="flex items-start gap-2"><ShieldCheck className="mt-0.5 size-4 shrink-0" style={{ color: b.color }} />{s}</li>)}</ul>
          <fieldset className="mt-6">
            <legend className="text-sm font-semibold">Sign in as (demo)</legend>
            <div className="mt-2 grid gap-2">{PEOPLE.map((p) => (
              <label key={p.phone} className={`flex cursor-pointer items-center gap-3 rounded-md border p-3 ${phone === p.phone ? "border-[#1f5fa8] bg-[#eff6ff]" : "border-[#e5e7eb]"}`}>
                <input type="radio" name="person" value={p.phone} checked={phone === p.phone} onChange={() => setPhone(p.phone)} className="size-4" />
                <span className="min-w-0 flex-1"><span className="block font-medium">{p.name}</span><span className="block text-xs text-[#6b7280]">+91 {p.phone} · {p.hint}</span></span>
              </label>
            ))}</div>
          </fieldset>
          <p className="mt-5 flex items-center gap-2 text-xs text-[#6b7280]"><Lock className="size-3.5" />Praman receives a reference token only. You can revoke this any time from {b.name}.</p>
          <div className="mt-6 grid gap-2 sm:grid-cols-2">
            <button type="button" onClick={() => go(false)} disabled={busy} className="min-h-11 rounded-md border border-[#d1d5db] bg-white font-medium hover:bg-[#f9fafb]">Deny</button>
            <button type="button" onClick={() => go(true)} disabled={busy} data-testid="mock-allow" className="inline-flex min-h-11 items-center justify-center gap-1 rounded-md font-semibold text-white disabled:opacity-60" style={{ background: b.color }}>{busy ? "Redirecting…" : "Allow"}<ChevronRight className="size-4" /></button>
          </div>
        </div>
        <p className="mt-4 text-center text-xs text-[#6b7280]">This is a simulated consent screen used when PROVIDER_* = mock. No real {b.name} call is made.</p>
      </div>
    </main>
  );
}
