"use client";
import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button, Chip, Switch, Tabs, toast } from "@heroui/react";
import { Download, Trash2, KeyRound, Smartphone, Languages, ShieldCheck, Plus } from "lucide-react";
import { fmtDate, type Locale } from "@applyonce/ui";
import { authClient } from "@/lib/auth-client";
import { StepUpDialog } from "@/components/vault/step-up-dialog";

export type SessionRow = { id: string; userAgent: string | null; ipAddress: string | null; createdAt: string; expiresAt: string; current: boolean };
export type DataRequest = { id: string; kind: string; status: string; requestedAt: string; fulfilledAt: string | null; notes: string | null };
export type AuditRow = { id: number; at: string; action: string; targetType: string; targetId: string | null; meta: Record<string, unknown> | null };
type Passkey = { id: string; name?: string | null; createdAt?: string | Date; deviceType?: string };

const T = {
  title: { en: "Settings", hi: "सेटिंग्स" }, profile: { en: "Profile", hi: "प्रोफ़ाइल" }, security: { en: "Security", hi: "सुरक्षा" }, privacy: { en: "Privacy & data", hi: "गोपनीयता व डेटा" }, audit: { en: "Audit log", hi: "ऑडिट लॉग" },
  name: { en: "Your name", hi: "आपका नाम" }, language: { en: "Language", hi: "भाषा" }, langBlurb: { en: "Labels across ApplyOnce switch to Hindi.", hi: "पूरे ApplyOnce के लेबल हिंदी में दिखेंगे।" }, save: { en: "Save", hi: "सहेजें" },
  passkeys: { en: "Passkeys", hi: "पासकी" }, passkeysBlurb: { en: "Face/fingerprint sign-in. Confirm sharing with a passkey or OTP.", hi: "चेहरा/उंगली से लॉगिन। साझा करने के लिए ज़रूरी।" }, addPasskey: { en: "Add passkey", hi: "पासकी जोड़ें" },
  sessions: { en: "Devices & sessions", hi: "डिवाइस व सत्र" }, thisDevice: { en: "This device", hi: "यह डिवाइस" }, revoke: { en: "Sign out", hi: "साइन आउट" },
  download: { en: "Download my data", hi: "मेरा डेटा डाउनलोड करें" }, downloadBlurb: { en: "A compressed JSON export of facts, document metadata, applications and consent records. Download document files separately. Link valid 24 h.", hi: "आपके सभी तथ्य (JSON) और दस्तावेज़ों की ZIP। कुछ मिनट में तैयार; लिंक 24 घंटे वैध।" },
  erase: { en: "Delete my account", hi: "मेरा खाता हटाएँ" }, eraseBlurb: { en: "Deletion starts after 30 days. Cancel a pending request below. Recent active applications may temporarily hold deletion.", hi: "30 दिन की अवधि: रद्द करने के लिए दोबारा लॉगिन करें। उसके बाद सब मिट जाता है, सिवाय क़ानूनन ज़रूरी रिकॉर्ड (सहमति लेजर, 7 वर्ष)।" },
  requests: { en: "Your requests", hi: "आपके अनुरोध" },
};
const inp = "w-full rounded-md border border-line bg-surface px-3 py-2.5 text-[15px]";

export function SettingsClient({ locale: l, user, sessions, requests, audit, tab }: { locale: Locale; user: { name: string; phone: string | null; email: string | null }; sessions: SessionRow[]; requests: DataRequest[]; audit: AuditRow[]; tab?: string }) {
  const router = useRouter();
  const [, start] = useTransition();
  const refresh = () => start(() => router.refresh());
  const [name, setName] = useState(user.name);
  const [busy, setBusy] = useState<string | null>(null);
  const patchMe = async (b: Record<string, unknown>) => {
    const r = await fetch("/api/v1/me", { method: "PATCH", headers: { "content-type": "application/json" }, body: JSON.stringify(b) });
    if (!r.ok) throw new Error("Could not save");
  };
  const setLocale = async (hi: boolean) => { setBusy("locale"); try { await patchMe({ locale: hi ? "hi" : "en" }); toast.success(hi ? "अब हिंदी में" : "Now in English"); refresh(); } catch (e) { toast.danger((e as Error).message); } setBusy(null); };
  const saveName = async () => { setBusy("name"); try { await patchMe({ name }); toast.success(T.save[l]); refresh(); } catch (e) { toast.danger((e as Error).message); } setBusy(null); };

  return (
    <Tabs defaultSelectedKey={tab ?? "profile"} className="w-full">
      <Tabs.ListContainer><Tabs.List aria-label="Settings sections">
        <Tabs.Tab id="profile">{T.profile[l]}<Tabs.Indicator /></Tabs.Tab><Tabs.Tab id="security">{T.security[l]}<Tabs.Indicator /></Tabs.Tab><Tabs.Tab id="privacy">{T.privacy[l]}<Tabs.Indicator /></Tabs.Tab><Tabs.Tab id="audit">{T.audit[l]}<Tabs.Indicator /></Tabs.Tab>
      </Tabs.List></Tabs.ListContainer>

      <Tabs.Panel id="profile" className="grid gap-4 pt-6">
        <section className="card grid gap-4 p-5">
          <label className="grid gap-1"><span className="text-sm font-medium">{T.name[l]}</span><input className={inp} value={name} onChange={(e) => setName(e.target.value)} data-testid="settings-name" /></label>
          <div className="grid gap-1 text-sm text-ink-2"><span>{l === "hi" ? "मोबाइल" : "Mobile"}: <b className="text-ink">{user.phone ?? "—"}</b></span>{user.email && !user.email.endsWith("@phone.applyonce.local") && <span>Email: <b className="text-ink">{user.email}</b></span>}</div>
          <div><Button className="cta" onPress={saveName} isPending={busy === "name"} isDisabled={name.trim().length < 2 || name === user.name}>{T.save[l]}</Button></div>
        </section>
        <section className="card flex items-center justify-between gap-4 p-5">
          <div className="flex items-start gap-3"><Languages className="mt-0.5 size-5 text-brand-600" /><div><div className="font-semibold" data-testid="settings-language-label">{T.language[l]}</div><div className="text-sm text-ink-2">{T.langBlurb[l]}</div></div></div>
          <Switch isSelected={l === "hi"} onChange={setLocale} isDisabled={busy === "locale"} data-testid="locale-switch"><Switch.Content><Switch.Control><Switch.Thumb /></Switch.Control><span className="hi text-sm font-medium">हिंदी</span></Switch.Content></Switch>
        </section>
        <Link href="/app/settings/notifications" className="card flex items-center justify-between p-5 hover:shadow-pop"><div><div className="font-semibold">{l === "hi" ? "सूचना प्राथमिकताएँ" : "Notification preferences"}</div><div className="text-sm text-ink-2">{l === "hi" ? "SMS, ईमेल, व्हाट्सऐप" : "SMS, email, WhatsApp per category"}</div></div><span className="text-ink-3">›</span></Link>
      </Tabs.Panel>

      <Tabs.Panel id="security" className="grid gap-4 pt-6"><Passkeys locale={l} /><Sessions locale={l} rows={sessions} onChange={refresh} /></Tabs.Panel>

      <Tabs.Panel id="privacy" className="grid gap-4 pt-6"><Privacy locale={l} requests={requests} onChange={refresh} /></Tabs.Panel>

      <Tabs.Panel id="audit" className="pt-6"><Audit locale={l} initial={audit} /></Tabs.Panel>
    </Tabs>
  );
}

function Passkeys({ locale: l }: { locale: Locale }) {
  const [list, setList] = useState<Passkey[] | null>(null);
  const [busy, setBusy] = useState(false);
  const load = async () => { const r = await authClient.passkey.listUserPasskeys(); setList((r.data as Passkey[] | null) ?? []); };
  useEffect(() => { load().catch(() => setList([])); }, []);
  const add = async () => {
    setBusy(true);
    const name = prompt(l === "hi" ? "इस पासकी का नाम (जैसे: मेरा फ़ोन)" : "Name this passkey (e.g. My phone)") ?? "My device";
    const r = await authClient.passkey.addPasskey({ name }).catch(() => ({ error: { message: "cancelled" } }));
    setBusy(false);
    if (r && "error" in r && r.error) return toast.danger(l === "hi" ? "पासकी नहीं बनी" : "Passkey not created", { description: "Needs a browser with WebAuthn on localhost/HTTPS." });
    toast.success(l === "hi" ? "पासकी जोड़ी" : "Passkey added"); load();
  };
  const del = async (id: string) => { if (!confirm(l === "hi" ? "यह पासकी हटाएँ?" : "Remove this passkey?")) return; await authClient.passkey.deletePasskey({ id }); toast.success(l === "hi" ? "हटाई" : "Removed"); load(); };
  return (
    <section className="card p-5">
      <div className="flex items-start justify-between gap-3"><div className="flex items-start gap-3"><KeyRound className="mt-0.5 size-5 text-brand-600" /><div><h2 className="font-display text-lg font-bold">{T.passkeys[l]}</h2><p className="text-sm text-ink-2">{T.passkeysBlurb[l]}</p></div></div><Button size="sm" onPress={add} isPending={busy}><Plus className="size-4" />{T.addPasskey[l]}</Button></div>
      <ul className="mt-4 divide-y divide-line">
        {list === null ? <li className="py-3 text-sm text-ink-3">…</li> : list.length === 0 ? <li className="py-3 text-sm text-ink-2">{l === "hi" ? "अभी कोई पासकी नहीं। OTP से भी साझा कर सकते हैं।" : "No passkeys yet. You can still confirm with OTP."}</li>
          : list.map((p) => <li key={p.id} className="flex items-center justify-between py-3"><div><div className="font-medium">{p.name ?? "Passkey"}</div><div className="text-xs text-ink-3">{p.deviceType ?? ""} · {p.createdAt ? fmtDate(p.createdAt as string, l) : ""}</div></div><Button size="sm" variant="danger-soft" onPress={() => del(p.id)}>{l === "hi" ? "हटाएँ" : "Remove"}</Button></li>)}
      </ul>
    </section>
  );
}

function Sessions({ locale: l, rows, onChange }: { locale: Locale; rows: SessionRow[]; onChange: () => void }) {
  const revoke = async (id: string) => { const r = await fetch(`/api/v1/me/sessions/${id}`, { method: "DELETE" }); r.ok ? (toast.success(l === "hi" ? "साइन आउट किया" : "Signed out that device"), onChange()) : toast.danger("Could not revoke"); };
  const ua = (s: string | null) => { if (!s) return l === "hi" ? "अज्ञात डिवाइस" : "Unknown device"; const b = /Edg/.test(s) ? "Edge" : /Chrome/.test(s) ? "Chrome" : /Safari/.test(s) ? "Safari" : /Firefox/.test(s) ? "Firefox" : /curl/.test(s) ? "curl" : "Browser"; const os = /iPhone|iPad/.test(s) ? "iOS" : /Android/.test(s) ? "Android" : /Mac/.test(s) ? "macOS" : /Windows/.test(s) ? "Windows" : /Linux/.test(s) ? "Linux" : ""; return `${b}${os ? ` · ${os}` : ""}`; };
  return (
    <section className="card p-5">
      <div className="flex items-start gap-3"><Smartphone className="mt-0.5 size-5 text-brand-600" /><div><h2 className="font-display text-lg font-bold">{T.sessions[l]}</h2><p className="text-sm text-ink-2">{l === "hi" ? "जहाँ-जहाँ आप लॉगिन हैं।" : "Everywhere you're signed in."}</p></div></div>
      <ul className="mt-4 divide-y divide-line">{rows.map((s) => <li key={s.id} className="flex items-center justify-between gap-3 py-3"><div><div className="flex items-center gap-2 font-medium">{ua(s.userAgent)}{s.current && <Chip size="sm" color="success">{T.thisDevice[l]}</Chip>}</div><div className="text-xs text-ink-3">{s.ipAddress ?? "—"} · {l === "hi" ? "से" : "since"} {fmtDate(s.createdAt, l)} · {l === "hi" ? "समाप्ति" : "expires"} {fmtDate(s.expiresAt, l)}</div></div>{!s.current && <Button size="sm" variant="outline" onPress={() => revoke(s.id)}>{T.revoke[l]}</Button>}</li>)}</ul>
    </section>
  );
}

function Privacy({ locale: l, requests, onChange }: { locale: Locale; requests: DataRequest[]; onChange: () => void }) {
  const [step, setStep] = useState<null | "export" | "erase">(null);
  const [busy, setBusy] = useState(false);
  const run = async (kind: "export" | "erase") => {
    setBusy(true);
    const r = await fetch(`/api/v1/me/${kind}`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(kind === "erase" ? { confirm: "DELETE" } : {}) });
    const j = await r.json().catch(() => ({}));
    setBusy(false);
    if (r.status === 403 && j?.error?.code === "STEP_UP_REQUIRED") return setStep(kind);
    if (!r.ok) return toast.danger(j?.error?.message ?? "Failed");
    toast.success(kind === "export" ? (l === "hi" ? "एक्सपोर्ट तैयार हो रहा है" : "Export started") : (l === "hi" ? "हटाना निर्धारित (30 दिन)" : "Deletion scheduled (30 days)"), { description: kind === "export" ? (l === "hi" ? "तैयार होने पर सूचना मिलेगी।" : "We will notify you when the JSON export is ready.") : undefined });
    onChange();
  };
  const erase = () => { const c = prompt(l === "hi" ? "पुष्टि के लिए DELETE लिखें" : "Type DELETE to confirm"); if (c === "DELETE") run("erase"); };
  const STATUS: Record<string, "default" | "warning" | "success" | "danger"> = { pending: "warning", processing: "warning", done: "success", ready: "success", fulfilled: "success", failed: "danger", cancelled: "default" };
  return (
    <>
      <section className="card p-5">
        <div className="flex items-start gap-3"><ShieldCheck className="mt-0.5 size-5 text-brand-600" /><div><h2 className="font-display text-lg font-bold">{l === "hi" ? "सहमति सूचना (DPDP)" : "Consent notice (DPDP)"}</h2>
          <ul className="mt-2 grid gap-1 text-sm text-ink-2">
            <li><b className="text-ink">{l === "hi" ? "क्या" : "What"}:</b> {l === "hi" ? "पहचान, संपर्क, पता, परिवार, श्रेणी, शिक्षा, रोज़गार, बैंक; स्वास्थ्य केवल ऑप्ट-इन।" : "identity, contact, address, family, category, education, employment, bank; health only if you opt in."}</li>
            <li><b className="text-ink">{l === "hi" ? "क्यों" : "Why"}:</b> {l === "hi" ? "आपके फ़ॉर्म भरना और सत्यापित करना — केवल आपकी हर बार की सहमति से।" : "to fill and verify your applications — only when you tap Allow, every time."}</li>
            <li><b className="text-ink">{l === "hi" ? "कब तक" : "How long"}:</b> {l === "hi" ? "जब तक आपका खाता है; सहमति रिकॉर्ड 7 वर्ष।" : "while your account exists, subject to your selected consent periods and the deletion workflow."}</li>
            <li><b className="text-ink">{l === "hi" ? "कभी नहीं" : "Never"}:</b> {l === "hi" ? "आपका आधार नंबर, विज्ञापन, बिक्री।" : "your Aadhaar number, ads, selling data."}</li>
          </ul>
          <Link href="/privacy" className="mt-2 inline-block text-sm text-brand-600 underline">{l === "hi" ? "पूरी सूचना पढ़ें" : "Read the full notice"}</Link></div></div>
      </section>
      <section className="card flex flex-wrap items-center justify-between gap-4 p-5"><div className="flex items-start gap-3"><Download className="mt-0.5 size-5 text-brand-600" /><div><h2 className="font-semibold">{T.download[l]}</h2><p className="text-sm text-ink-2">{T.downloadBlurb[l]}</p></div></div><Button variant="secondary" onPress={() => run("export")} isPending={busy} data-testid="export-btn">{T.download[l]}</Button></section>
      <section className="card flex flex-wrap items-center justify-between gap-4 border-danger-500/30 p-5"><div className="flex items-start gap-3"><Trash2 className="mt-0.5 size-5 text-danger-500" /><div><h2 className="font-semibold">{T.erase[l]}</h2><p className="text-sm text-ink-2">{T.eraseBlurb[l]}</p></div></div><Button variant="danger-soft" onPress={erase} isPending={busy}>{T.erase[l]}</Button></section>
      {requests.length > 0 && <section className="card p-5"><h2 className="font-semibold">{T.requests[l]}</h2><ul className="mt-2 divide-y divide-line text-sm">{requests.map((r) => <li key={r.id} className="flex items-center justify-between py-2"><span className="capitalize">{r.kind} · {fmtDate(r.requestedAt, l)}</span><div className="flex items-center gap-2"><Chip size="sm" color={STATUS[r.status] ?? "default"}>{r.status}</Chip>{r.kind === "erase" && ["pending","on_hold"].includes(r.status) && <Button size="sm" variant="outline" onPress={async()=>{try {const response=await fetch("/api/v1/me/erase",{method:"DELETE"}); if(!response.ok) throw new Error("Could not cancel deletion");toast.success(l==="hi"?"हटाना रद्द हुआ":"Deletion cancelled");onChange();}catch(error){toast.danger((error as Error).message);}}}>{l==="hi"?"रद्द करें":"Cancel deletion"}</Button>}</div></li>)}</ul></section>}
      <StepUpDialog open={!!step} locale={l} onOpenChange={(o) => !o && setStep(null)} onDone={(ok) => { const k = step; setStep(null); if (ok && k) run(k); }} />
    </>
  );
}

function Audit({ locale: l, initial }: { locale: Locale; initial: AuditRow[] }) {
  const [rows, setRows] = useState(initial);
  const [cursor, setCursor] = useState<number | null>(initial.length >= 20 ? initial[initial.length - 1]!.id : null);
  const more = async () => { const r = await fetch(`/api/v1/me/audit?cursor=${cursor}&limit=50`); const j = await r.json(); setRows((p) => [...p, ...j.data.items]); setCursor(j.data.nextCursor); };
  const tone = (a: string): "accent" | "success" | "warning" | "danger" | "default" => a.includes("revoke") || a.includes("erase") || a.includes("delete") ? "danger" : a.includes("share") || a.includes("consent") ? "warning" : a.includes("verif") ? "success" : a.startsWith("family") ? "accent" : "default";
  return (
    <div className="card">
      {rows.length === 0 ? <p className="p-5 text-sm text-ink-2">{l === "hi" ? "अभी कोई गतिविधि नहीं।" : "No activity yet."}</p> : (
        <ul className="divide-y divide-line">{rows.map((r) => (
          <li key={r.id} className="px-4 py-3">
            <details><summary className="flex cursor-pointer list-none items-center gap-3 text-sm"><Chip size="sm" variant="soft" color={tone(r.action)}>{r.action}</Chip><span className="text-ink-2">{r.targetType}{r.targetId ? ` · ${r.targetId.slice(0, 8)}…` : ""}</span><span className="ml-auto text-xs text-ink-3 tabular">{new Date(r.at).toLocaleString(l === "hi" ? "hi-IN" : "en-IN")}</span></summary>
              <pre className="mt-2 overflow-x-auto rounded-md bg-surface-2 p-3 text-xs">{JSON.stringify(r.meta ?? {}, null, 2)}</pre></details>
          </li>))}</ul>)}
      {cursor && <div className="p-3 text-center"><Button variant="ghost" size="sm" onPress={more}>{l === "hi" ? "और दिखाएँ" : "Load more"}</Button></div>}
      <p className="border-t border-line px-4 py-2 text-xs text-ink-3">{l === "hi" ? "हैश-चेन्ड, केवल-जोड़ें लॉग। हर पंक्ति पिछली से जुड़ी है।" : "Hash-chained, append-only. Each row links to the previous one."}</p>
    </div>
  );
}
