"use client";
import { LinkButton } from "@/components/vault/link-button";
/** F1 onboarding (≤ 6 min): name+language → DigiLocker → review identity → review education → family & category → passkey → done. */
import { useEffect, useMemo, useRef, useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button, TextField, Label, Input, Description, FieldError, ProgressBar, toast, Alert } from "@heroui/react";
import { ShieldCheck, Fingerprint, Sparkles, Loader2, Check, ExternalLink, Upload } from "lucide-react";
import { field, type Fact, type FactValue } from "@applyonce/schema";
import { WizardShell, FactRow, FactEditor, ProgressRing, cx } from "@applyonce/ui";
import { authClient } from "@/lib/auth-client";
import { api, tr, type Locale } from "@/components/vault/i18n";
import { useEvents, type JobEvent } from "@/components/vault/use-events";
import { saveNameAndLocale } from "@/app/welcome/actions";

const STEPS = (l: Locale) => [
  { id: "name", label: tr(l, "Name & language", "नाम व भाषा") }, { id: "digilocker", label: "DigiLocker" }, { id: "identity", label: tr(l, "Identity", "पहचान") },
  { id: "education", label: tr(l, "Education", "शिक्षा") }, { id: "family", label: tr(l, "Family & category", "परिवार व श्रेणी") }, { id: "passkey", label: tr(l, "Passkey", "पासकी") },
];
const FAMILY_KEYS = ["family.father.name", "family.mother.name", "family.annual_income_total", "category.social", "category.domicile_state", "category.pwd"];
const ID_SECTIONS = ["identity", "contact", "address"], EDU_SECTIONS = ["education"];

export function OnboardingWizard({ profileId, locale: initialLocale, initialName, initialStep, jobId, error, hasDigilocker, hasPasskey, demoUrl, initialFacts }: { profileId: string; locale: Locale; initialName: string; initialStep: number; jobId: string | null; error: string | null; hasDigilocker: boolean; hasPasskey: boolean; demoUrl: string; initialFacts: Fact[] }) {
  const router = useRouter();
  const [locale, setLocale] = useState<Locale>(initialLocale);
  const [step, setStep] = useState(initialStep);
  const [name, setName] = useState(initialName);
  const [busy, setBusy] = useState(false);
  const [saving, setSaving] = useState<"saving" | "saved" | null>(null);
  const [facts, setFacts] = useState<Fact[]>(initialFacts);
  const [fresh, setFresh] = useState<Set<string>>(new Set());
  const [job, setJob] = useState<JobEvent | null>(null);
  const [fam, setFam] = useState<Record<string, FactValue | undefined>>(() => Object.fromEntries(FAMILY_KEYS.map((k) => [k, initialFacts.find((f) => f.key === k)?.value])));
  const [famErr, setFamErr] = useState<Record<string, string>>({});
  const [summary, setSummary] = useState<{ overall: { filled: number; total: number; verified: number; pct: number } } | null>(null);
  const [, start] = useTransition();
  const seen = useRef(new Set(initialFacts.map((f) => f.key)));
  const steps = useMemo(() => STEPS(locale), [locale]);
  const hi = locale === "hi";

  useEffect(() => { if (error) toast.danger(tr(locale, "DigiLocker connection cancelled", "DigiLocker कनेक्शन रद्द"), { description: tr(locale, "You can retry or upload documents later.", "फिर कोशिश करें या बाद में दस्तावेज़ अपलोड करें।") }); }, [error, locale]);
  const go = (n: number) => { setStep(n); router.replace(`/welcome?step=${n}${jobId ? `&job=${jobId}` : ""}`); window.scrollTo({ top: 0 }); };

  const refetch = async () => {
    const r = await Promise.all([...ID_SECTIONS, ...EDU_SECTIONS].map((s) => api<{ facts: Fact[] }>(`/profiles/${profileId}/facts?section=${s}`).then((x) => x.facts).catch(() => [] as Fact[])));
    const all = r.flat();
    const nu = new Set<string>();
    for (const f of all) if (!seen.current.has(f.key)) { nu.add(f.key); seen.current.add(f.key); }
    setFacts(all); if (nu.size) setFresh(nu);
  };
  useEvents({ onJob: (j) => { if (jobId && j.id === jobId) { setJob(j); void refetch(); if (j.status === "succeeded") toast.success(tr(locale, "DigiLocker synced", "DigiLocker सिंक हुआ"), { description: j.progress?.step }); } } }, !!jobId && (step === 2 || step === 3));
  useEffect(() => { if (jobId && !job) api<{ job: JobEvent }>(`/verification/jobs/${jobId}`).then((r) => { setJob(r.job); void refetch(); }).catch(() => {}); }, [jobId]); // eslint-disable-line react-hooks/exhaustive-deps
  const running = job && (job.status === "queued" || job.status === "running");

  // step handlers
  const saveName = async () => {
    setBusy(true); setSaving("saving");
    const r = await saveNameAndLocale(name, locale);
    setBusy(false);
    if (!r.ok) { setSaving(null); return toast.danger(r.error); }
    setSaving("saved"); start(() => router.refresh()); go(1);
  };
  const connect = async () => {
    setBusy(true);
    try { const r = await api<{ url: string }>("/providers/digilocker/start", { method: "POST", json: { next: "/welcome?step=2" } }); window.location.href = r.url; }
    catch (e) { toast.danger((e as Error).message); setBusy(false); }
  };
  const saveFamily = async () => {
    setBusy(true); setSaving("saving"); const errs: Record<string, string> = {};
    for (const k of FAMILY_KEYS) {
      const v = fam[k]; if (v == null || v === "" ) continue;
      const cur = facts.find((f) => f.key === k); if (cur && JSON.stringify(cur.value) === JSON.stringify(v)) continue;
      try { await api(`/profiles/${profileId}/facts/${encodeURIComponent(k)}`, { method: "PUT", json: { value: v } }); }
      catch (e) { const ae = e as { fields?: Record<string, string>; message: string; status?: number }; if (ae.status !== 409) errs[k] = ae.fields?.[k] ?? ae.message; }
    }
    setFamErr(errs); setBusy(false);
    if (Object.keys(errs).length) { setSaving(null); return; }
    setSaving("saved"); go(5);
  };
  const addPasskey = async () => {
    setBusy(true);
    try { const r = await authClient.passkey.addPasskey({ name: tr(locale, "This device", "यह डिवाइस") }); if (r?.error) throw new Error(r.error.message ?? "Passkey failed"); toast.success(tr(locale, "Passkey created", "पासकी बन गई")); finish(); }
    catch (e) { toast.danger(tr(locale, "Couldn’t create a passkey here", "यहाँ पासकी नहीं बन सकी"), { description: (e as Error).message }); }
    finally { setBusy(false); }
  };
  const finish = async () => { go(6); api<{ overall: { filled: number; total: number; verified: number; pct: number } }>(`/profiles/${profileId}/summary`).then(setSummary).catch(() => {}); };

  const brand = <Link href="/app" className="flex items-center gap-2"><img src="/icon.svg" alt="" className="size-7 rounded-md" /><span className="font-display font-bold">ApplyOnce</span></Link>;
  const review = (sections: string[], emptyEn: string, emptyHi: string) => {
    const rows = facts.filter((f) => sections.includes(f.key.split(".")[0]!) && !field(f.key).derived);
    return (
      <div className="grid gap-4">
        {(running || (jobId && !job)) && <div className="card p-4"><div className="flex items-center gap-2 text-sm"><Loader2 className="size-4 animate-spin text-brand-600" /><span className="font-medium">{job?.progress?.step ?? tr(locale, "Fetching from DigiLocker…", "DigiLocker से ला रहे हैं…")}</span><span className="ml-auto tabular text-ink-3">{job?.progress?.pct ?? 0}%</span></div><ProgressBar value={job?.progress?.pct ?? 0} color="accent" aria-label="Sync progress" className="mt-2" /></div>}
        {rows.length === 0 ? <div className="card p-6 text-ink-2">{tr(locale, emptyEn, emptyHi)}</div> : (
          <div className="card px-5 py-1">{rows.map((f, i) => <div key={`${f.key}:${f.repeatIndex}`} className={cx(fresh.has(f.key) && "rise")} style={fresh.has(f.key) ? { animationDelay: `${Math.min(i, 8) * 40}ms` } : undefined}><FactRow fact={f} locale={locale} masked={field(f.key).sensitive} highlight={fresh.has(f.key)} /></div>)}</div>
        )}
        <p className="text-sm text-ink-3">{tr(locale, "Green = verified by the issuer. You can hide sections later from the vault.", "हरा = जारीकर्ता द्वारा सत्यापित। भाग बाद में वॉल्ट से छिपा सकते हैं।")}</p>
      </div>
    );
  };

  if (step >= 6) {
    const o = summary?.overall;
    return (
      <main className="grid min-h-dvh place-items-center bg-bg px-4 py-10">
        <div className="w-full max-w-[640px] text-center">
          <span className="mx-auto grid size-16 place-items-center rounded-pill bg-verified-50 text-verified-700 stamp"><Check className="size-8" strokeWidth={2.5} /></span>
          <h1 className="mt-5 font-display text-4xl font-bold">{tr(locale, "Your ApplyOnce is ready", "आपका ApplyOnce तैयार है")}</h1>
          <p className="mt-2 text-ink-2">{tr(locale, "Verify once, apply anywhere. Here’s where you stand.", "एक बार सत्यापित, कहीं भी आवेदन। आपकी स्थिति:")}</p>
          <div className="card mx-auto mt-6 flex items-center justify-center gap-6 p-6">{o ? <ProgressRing value={o.filled} max={o.total} size="lg" label={tr(locale, `core fields · ${o.verified} verified`, `मुख्य फ़ील्ड · ${o.verified} सत्यापित`)} /> : <Loader2 className="size-6 animate-spin text-brand-600" />}</div>
          <div className="mt-6 grid gap-3 sm:grid-cols-2">
            <LinkButton size="lg" className="cta" href={demoUrl} external={demoUrl.startsWith("http")}><Sparkles className="size-5" />{tr(locale, "Try the demo exam form", "डेमो परीक्षा फ़ॉर्म आज़माएँ")}{demoUrl.startsWith("http") && <ExternalLink className="size-4" />}</LinkButton>
            <LinkButton size="lg" variant="outline" href="/app" data-testid="go-home">{tr(locale, "Go to Home", "होम पर जाएँ")}</LinkButton>
          </div>
        </div>
      </main>
    );
  }

  const common = { steps, current: step, locale, brand, saving, estMinutes: Math.max(1, 6 - step), busy };
  if (step === 0) return (
    <WizardShell {...common} title={tr(locale, "What’s your name?", "आपका नाम?")} subtitle={tr(locale, "Exactly as on your Aadhaar — forms reject even small differences.", "बिल्कुल आधार जैसा — छोटे अंतर पर भी फ़ॉर्म अस्वीकार होते हैं।")} onNext={saveName} canNext={name.trim().length >= 2}>
      <div className="card grid gap-5 p-6">
        <TextField value={name} onChange={setName} isRequired autoFocus fullWidth maxLength={120} data-testid="name-field">
          <Label>{tr(locale, "Full name (as on Aadhaar)", "पूरा नाम (आधार अनुसार)")}</Label><Input placeholder="e.g. Aarav Sharma" /><Description>{tr(locale, "We’ll replace this with the UIDAI-verified name when you connect DigiLocker.", "DigiLocker जोड़ने पर इसे UIDAI-सत्यापित नाम से बदल देंगे।")}</Description><FieldError />
        </TextField>
        <div>
          <div className="mb-2 text-sm font-medium">{tr(locale, "Language", "भाषा")}</div>
          <div className="grid grid-cols-2 gap-2" role="radiogroup" aria-label="Language">
            {(["en", "hi"] as Locale[]).map((l) => <button key={l} type="button" role="radio" aria-checked={locale === l} onClick={() => setLocale(l)} className={cx("min-h-12 rounded-md border text-base font-medium transition-colors", locale === l ? "border-brand-500 bg-brand-50 text-brand-700" : "border-line bg-surface hover:bg-surface-2")}>{l === "en" ? "English" : "हिन्दी"}</button>)}
          </div>
        </div>
      </div>
    </WizardShell>
  );
  if (step === 1) return (
    <WizardShell {...common} title={tr(locale, "Connect DigiLocker", "DigiLocker जोड़ें")} subtitle={tr(locale, "Your Aadhaar, PAN and marksheets arrive already verified. Takes about 30 seconds.", "आधार, पैन और मार्कशीट पहले से सत्यापित आते हैं। लगभग 30 सेकंड।")} onBack={() => go(0)}
      onNext={hasDigilocker ? () => go(2) : undefined} secondary={!hasDigilocker ? <Button variant="ghost" onPress={() => go(2)} isDisabled={busy}>{tr(locale, "Skip, upload later", "छोड़ें, बाद में अपलोड")}</Button> : undefined}>
      <div className="card grid gap-5 p-6">
        <div className="flex items-start gap-4"><span className="grid size-14 shrink-0 place-items-center rounded-lg bg-verified-50 text-verified-700"><ShieldCheck className="size-8" strokeWidth={1.5} /></span>
          <ul className="grid gap-1.5 text-ink-2">{[tr(locale, "Issued documents only — nothing is uploaded by hand", "केवल जारी दस्तावेज़ — कुछ भी हाथ से अपलोड नहीं"), tr(locale, "Every value gets a green ‘Verified · UIDAI / CBSE’ stamp", "हर मान को हरा ‘सत्यापित · UIDAI / CBSE’ चिह्न"), tr(locale, "You can disconnect any time from Verify", "सत्यापन से कभी भी डिस्कनेक्ट कर सकते हैं")].map((s) => <li key={s} className="flex items-start gap-2"><Check className="mt-1 size-4 shrink-0 text-verified-700" />{s}</li>)}</ul></div>
        {hasDigilocker ? <Alert status="success"><Alert.Indicator /><Alert.Content><Alert.Title>{tr(locale, "DigiLocker is connected", "DigiLocker जुड़ा है")}</Alert.Title><Alert.Description>{tr(locale, "Continue to review what we pulled.", "आगे बढ़कर देखें क्या आया।")}</Alert.Description></Alert.Content></Alert>
          : <Button size="lg" className="cta" onPress={connect} isPending={busy} data-testid="connect-digilocker"><ShieldCheck className="size-5" />{tr(locale, "Connect DigiLocker", "DigiLocker जोड़ें")}</Button>}
      </div>
    </WizardShell>
  );
  if (step === 2) return <WizardShell {...common} title={tr(locale, "Your identity", "आपकी पहचान")} subtitle={tr(locale, "Pulled from Aadhaar and PAN. Sensitive values stay masked.", "आधार और पैन से। संवेदनशील मान छिपे रहते हैं।")} onBack={() => go(1)} onNext={() => go(3)}>{review(ID_SECTIONS, "Nothing pulled yet. Connect DigiLocker or add details in the vault later.", "अभी कुछ नहीं आया। DigiLocker जोड़ें या बाद में वॉल्ट में जोड़ें।")}</WizardShell>;
  if (step === 3) return <WizardShell {...common} title={tr(locale, "Your education", "आपकी शिक्षा")} subtitle={tr(locale, "Board marksheets from CBSE / state boards, degrees from NAD.", "CBSE/राज्य बोर्ड की मार्कशीट, NAD से डिग्री।")} onBack={() => go(2)} onNext={() => go(4)}>{review(EDU_SECTIONS, "No marksheets found yet. You can upload one later — we read it for you.", "अभी कोई मार्कशीट नहीं। बाद में अपलोड करें — हम पढ़ लेंगे।")}</WizardShell>;
  if (step === 4) return (
    <WizardShell {...common} title={tr(locale, "Family & category", "परिवार व श्रेणी")} subtitle={tr(locale, "Optional now, needed by most exam and scholarship forms. Self-declared until you upload a certificate.", "अभी वैकल्पिक, ज़्यादातर परीक्षा व छात्रवृत्ति फ़ॉर्म में ज़रूरी। प्रमाण पत्र अपलोड होने तक स्व-घोषित।")} onBack={() => go(3)} onNext={saveFamily} secondary={<Button variant="ghost" onPress={() => go(5)} isDisabled={busy}>{tr(locale, "Skip", "छोड़ें")}</Button>}>
      <div className="card grid gap-5 p-6">
        {FAMILY_KEYS.map((k) => { const d = field(k); const cur = facts.find((f) => f.key === k); const verified = cur && (cur.source === "issuer_verified" || cur.source === "provider_verified"); return verified ? <FactRow key={k} fact={cur} locale={locale} /> : <FactEditor key={k} def={d} value={fam[k]} onChange={(v) => setFam((s) => ({ ...s, [k]: v }))} locale={locale} error={famErr[k]} />; })}
        <div className="flex items-start gap-2 rounded-md bg-pending-50 p-3 text-sm text-pending-700"><Upload className="mt-0.5 size-4 shrink-0" />{tr(locale, "Have a category or income certificate? Upload it after setup — we verify the number and validity.", "श्रेणी या आय प्रमाण पत्र है? सेटअप के बाद अपलोड करें — हम संख्या और वैधता जाँचेंगे।")}</div>
      </div>
    </WizardShell>
  );
  return (
    <WizardShell {...common} title={tr(locale, "Create a passkey", "पासकी बनाएँ")} subtitle={tr(locale, "Face / fingerprint replaces OTPs — and confirms every share. Optional but recommended.", "चेहरा/उँगली OTP की जगह — हर साझा की पुष्टि। वैकल्पिक पर अनुशंसित।")} onBack={() => go(4)} onNext={hasPasskey ? finish : undefined} secondary={!hasPasskey ? <Button variant="ghost" onPress={finish} isDisabled={busy}>{tr(locale, "Skip for now", "अभी छोड़ें")}</Button> : undefined}>
      <div className="card grid gap-5 p-6">
        <div className="flex items-start gap-4"><span className="grid size-14 shrink-0 place-items-center rounded-lg bg-brand-50 text-brand-600"><Fingerprint className="size-8" strokeWidth={1.5} /></span><p className="text-ink-2">{tr(locale, "Stored on this device’s secure chip. ApplyOnce never sees your biometrics. Works on iPhone, Android and laptops.", "इस डिवाइस की सुरक्षित चिप में। ApplyOnce कभी बायोमेट्रिक नहीं देखता। iPhone, Android और लैपटॉप पर चलता है।")}</p></div>
        {hasPasskey ? <Alert status="success"><Alert.Indicator /><Alert.Content><Alert.Title>{tr(locale, "You already have a passkey", "आपके पास पासकी है")}</Alert.Title></Alert.Content></Alert>
          : <Button size="lg" className="cta" onPress={addPasskey} isPending={busy} data-testid="add-passkey"><Fingerprint className="size-5" />{tr(locale, "Create passkey", "पासकी बनाएँ")}</Button>}
      </div>
    </WizardShell>
  );
}
