"use client";
/**
 * The consent screen (F2). One component, URL-less state: review → fill missing → step-up → receipt → return.
 * Rules (docs/research 03 Part D): who’s asking on top, one row per field, optional fields toggleable,
 * Deny as visible as Share, consent_id shown on the receipt.
 */
import { useEffect, useMemo, useState } from "react";
import { Button, Alert, Chip, TextField, Label, Input, Select, ListBox } from "@heroui/react";
import { ArrowLeft, Users } from "lucide-react";
import { field, type FieldDiffRow, type FactValue, type Purpose, type CustomField } from "@praman/schema";
import { PartnerIdentity, ConsentSummaryChips, ConsentFieldList, ConsentActions, ConsentReceipt, FactEditor, type Locale } from "@praman/ui";
import { StepUpDialog } from "@/components/share/step-up-fallback";

type Summary = { requested: number; verified: number; extracted: number; self: number; missing: number; missingRequired: number; blocked: number };
type Profile = { id: string; displayName: string; kind: "self" | "dependent"; role: "self" | "owner" | "guardian" };
export interface ShareFlowProps {
  token: string; locale: Locale; phone: string | null;
  partner: { id: string; name: string; kind: string; logoUrl: string | null; website: string | null; verified: boolean };
  form: { id: string; name: string; purpose: Purpose; retentionDays: number; customFields: CustomField[]; deadlineAt: string | null };
  session: { id: string; returnUrl: string; state: string | null; expiresAt: string; env: "sandbox" | "live" };
  profiles: Profile[];
  initial: { profileId: string; rows: FieldDiffRow[]; summary: Summary; documents: { id: string; title: string }[] };
}

const T = (l: Locale) => (en: string, hi: string) => (l === "hi" ? hi : en);

export function ShareFlow({ token, locale, phone, partner, form, session, profiles, initial }: ShareFlowProps) {
  const t = T(locale);
  const [profileId, setProfileId] = useState(initial.profileId);
  const [rows, setRows] = useState(initial.rows);
  const [summary, setSummary] = useState(initial.summary);
  const [documents, setDocuments] = useState(initial.documents);
  const [selected, setSelected] = useState<Set<string>>(() => new Set(initial.rows.filter((r) => r.status !== "missing" && r.status !== "blocked").map((r) => r.key)));
  const [step, setStep] = useState<"review" | "fill" | "done">("review");
  const [values, setValues] = useState<Record<string, FactValue>>({});
  const [custom, setCustom] = useState<Record<string, unknown>>({});
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [stepUp, setStepUp] = useState(false);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [receipt, setReceipt] = useState<{ consent_id: string; application_id: string; return_url: string; shared: number } | null>(null);
  const [countdown, setCountdown] = useState(4);

  const profile = profiles.find((p) => p.id === profileId) ?? profiles[0]!;
  const missingRequired = useMemo(() => rows.filter((r) => r.status === "missing" && r.required), [rows]);
  const missingOptional = useMemo(() => rows.filter((r) => r.status === "missing" && !r.required), [rows]);
  const needsFill = missingRequired.length > 0 || form.customFields.length > 0;
  const shareCount = rows.filter((r) => (r.status === "verified" || r.status === "extracted" || r.status === "self") && (r.required || selected.has(r.key))).length + missingRequired.length + Object.keys(values).filter((k) => missingOptional.some((r) => r.key === k) && values[k] != null).length;

  async function switchProfile(id: string) {
    setProfileId(id); setBusy(true); setErr(null);
    const r = await fetch(`/api/v1/share/${token}?profile=${id}`).then((x) => x.json()).catch(() => null);
    setBusy(false);
    if (!r?.ok) return setErr(r?.error?.message ?? t("Could not load this profile.", "यह प्रोफ़ाइल लोड नहीं हो सकी।"));
    setRows(r.data.rows); setSummary(r.data.summary); setValues({});
    setSelected(new Set((r.data.rows as FieldDiffRow[]).filter((x) => x.status !== "missing" && x.status !== "blocked").map((x) => x.key)));
    setDocuments([]);
    await fetch("/api/v1/profiles/active", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ profileId: id }) }).catch(() => undefined);
  }
  const toggle = (key: string) => setSelected((s) => { const n = new Set(s); if (n.has(key)) n.delete(key); else n.add(key); return n; });
  const deny = () => { try { const u = new URL(session.returnUrl); u.searchParams.set("praman_error", "denied"); if (session.state) u.searchParams.set("state", session.state); location.assign(u.toString()); } catch { location.assign("/app"); } };

  function validateFill() {
    const e: Record<string, string> = {};
    for (const r of missingRequired) if (values[r.key] == null || values[r.key] === "") e[r.key] = t("Required", "आवश्यक");
    for (const c of form.customFields) if (c.required && (custom[c.id] == null || custom[c.id] === "" || custom[c.id] === false)) e[c.id] = t("Required", "आवश्यक");
    setErrors(e);
    return !Object.keys(e).length;
  }
  const onShare = () => { setErr(null); if (step === "review" && needsFill) return setStep("fill"); if (step === "fill" && !validateFill()) return; setStepUp(true); };

  async function submit(method: "otp" | "passkey") {
    setStepUp(false); setBusy(true); setErr(null);
    const acceptedFields = rows.filter((r) => r.status !== "blocked" && (r.required || selected.has(r.key) || values[r.key] != null)).map((r) => r.key);
    const newFacts = Object.fromEntries(Object.entries(values).filter(([, v]) => v != null && v !== ""));
    const r = await fetch(`/api/v1/share/${token}/consent`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ profileId, acceptedFields, customAnswers: custom, newFacts, stepUpMethod: method }) }).then((x) => x.json()).catch(() => null);
    setBusy(false);
    if (!r?.ok) {
      if (r?.error?.code === "STEP_UP_REQUIRED") return setStepUp(true);
      if (r?.error?.fields) { setErrors(r.error.fields); setStep("fill"); }
      return setErr(r?.error?.message ?? t("Something went wrong. Try again.", "कुछ गलत हुआ। फिर से कोशिश करें।"));
    }
    setReceipt(r.data); setStep("done");
  }
  useEffect(() => {
    if (step !== "done" || !receipt) return;
    if (countdown <= 0) { location.assign(receipt.return_url); return; }
    const id = setTimeout(() => setCountdown((c) => c - 1), 1000);
    return () => clearTimeout(id);
  }, [step, receipt, countdown]);

  if (step === "done" && receipt) {
    return (
      <div className="grid gap-4">
        <ConsentReceipt consentId={receipt.consent_id} partnerName={partner.name} fields={receipt.shared} locale={locale} href={`/app/connections/${receipt.consent_id}`} />
        <div className="card flex items-center justify-between gap-3 p-4 text-sm"><span className="text-ink-2">{t(`Returning to ${partner.name} in ${countdown}s…`, `${countdown} सेकंड में ${partner.name} पर वापस…`)}</span><Button size="sm" className="cta" onPress={() => location.assign(receipt.return_url)} data-testid="return-now">{t("Go now", "अभी जाएँ")}</Button></div>
        <p className="text-center text-xs text-ink-3">{t("Application added to your tracker.", "आवेदन आपके ट्रैकर में जुड़ गया।")} <a className="underline" href={`/app/applications/${receipt.application_id}`}>{t("Open", "खोलें")}</a></p>
      </div>
    );
  }

  return (
    <div className="grid gap-5" data-testid="share-flow" data-step={step}>
      <div>
        <div className="text-xs font-semibold uppercase tracking-[0.04em] text-ink-3">{t("Apply with Praman", "प्रमाण से आवेदन")}{session.env === "sandbox" && <Chip size="sm" color="warning" className="ml-2 align-middle">sandbox</Chip>}</div>
        <h1 className="mt-1 font-display text-2xl font-bold sm:text-3xl">{form.name}</h1>
      </div>
      <PartnerIdentity partner={partner} purpose={form.purpose} retentionDays={form.retentionDays} locale={locale} />

      {profiles.length > 1 && (
        <div className="card p-4">
          <div className="mb-2 flex items-center gap-2 text-sm font-medium"><Users className="size-4 text-brand-600" />{t("Who is applying?", "कौन आवेदन कर रहा है?")}</div>
          <div className="flex flex-wrap gap-2" role="radiogroup" aria-label={t("Profile", "प्रोफ़ाइल")}>
            {profiles.map((p) => <button key={p.id} type="button" role="radio" aria-checked={p.id === profileId} onClick={() => p.id !== profileId && switchProfile(p.id)} disabled={busy} className={`rounded-pill border px-4 py-2 text-sm font-medium ${p.id === profileId ? "border-brand-500 bg-brand-50 text-brand-700" : "border-line bg-surface text-ink-2 hover:bg-surface-2"}`}>{p.displayName}{p.role === "guardian" && <span className="ml-1 text-xs text-ink-3">· {t("as guardian", "अभिभावक के रूप में")}</span>}</button>)}
          </div>
          {profile.role === "guardian" && <p className="mt-2 text-xs text-ink-2">{t(`You are consenting as ${profile.displayName}’s guardian. The partner will see this.`, `आप ${profile.displayName} के अभिभावक के रूप में सहमति दे रहे हैं। साझेदार इसे देखेगा।`)}</p>}
        </div>
      )}

      {err && <Alert status="danger"><Alert.Indicator /><Alert.Content><Alert.Title>{err}</Alert.Title></Alert.Content></Alert>}

      {step === "review" && (
        <>
          <ConsentSummaryChips s={summary} locale={locale} />
          <ConsentFieldList rows={rows} locale={locale} selected={selected} onToggle={toggle} />
          <p className="text-xs text-ink-3">{t(`* required by ${partner.name}. Untick any optional field to keep it private. Sensitive values stay masked here and are sent encrypted.`, `* ${partner.name} द्वारा आवश्यक। निजी रखने के लिए वैकल्पिक फ़ील्ड अनचेक करें।`)}</p>
          <ConsentActions locale={locale} onShare={onShare} onDeny={deny} busy={busy} shareLabel={needsFill ? t(`Continue · ${missingRequired.length} to fill`, `जारी रखें · ${missingRequired.length} भरें`) : t(`Share ${shareCount} fields`, `${shareCount} फ़ील्ड साझा करें`)} hint={t("You’ll confirm with an OTP or passkey before anything is shared.", "साझा करने से पहले आप OTP या पासकी से पुष्टि करेंगे।")} />
        </>
      )}

      {step === "fill" && (
        <>
          <button type="button" onClick={() => setStep("review")} className="inline-flex items-center gap-1 text-sm text-ink-2"><ArrowLeft className="size-4" />{t("Back to the list", "सूची पर वापस")}</button>
          {missingRequired.length > 0 && (
            <section className="card grid gap-4 p-5">
              <div><h2 className="font-display text-lg font-bold">{t("Fill the missing fields", "छूटे फ़ील्ड भरें")}</h2><p className="text-sm text-ink-2">{t("Saved to your vault as self-declared, so next time they’re already there.", "आपके वॉल्ट में स्व-घोषित के रूप में सहेजे जाएंगे।")}</p></div>
              {missingRequired.map((r, i) => <FactEditor key={r.key} def={field(r.key)} value={values[r.key]} onChange={(v) => setValues((s) => ({ ...s, [r.key]: v }))} locale={locale} error={errors[r.key]} autoFocus={i === 0} documents={documents} />)}
            </section>
          )}
          {form.customFields.length > 0 && (
            <section className="card grid gap-4 p-5">
              <div><h2 className="font-display text-lg font-bold">{t(`${partner.name} also asks`, `${partner.name} यह भी पूछता है`)}</h2><p className="text-sm text-ink-2">{t("These answers go only to this application.", "ये उत्तर केवल इस आवेदन में जाते हैं।")}</p></div>
              {form.customFields.map((c) => <CustomInput key={c.id} c={c} value={custom[c.id]} error={errors[c.id]} onChange={(v) => setCustom((s) => ({ ...s, [c.id]: v }))} locale={locale} />)}
            </section>
          )}
          {missingOptional.length > 0 && (
            <details className="card p-5"><summary className="cursor-pointer font-medium">{t(`${missingOptional.length} optional fields you could add`, `${missingOptional.length} वैकल्पिक फ़ील्ड`)}</summary>
              <div className="mt-4 grid gap-4">{missingOptional.map((r) => <FactEditor key={r.key} def={field(r.key)} value={values[r.key]} onChange={(v) => setValues((s) => ({ ...s, [r.key]: v }))} locale={locale} documents={documents} />)}</div>
            </details>
          )}
          <ConsentActions locale={locale} onShare={onShare} onDeny={deny} busy={busy} shareLabel={t(`Share ${shareCount} fields`, `${shareCount} फ़ील्ड साझा करें`)} hint={t("You’ll confirm with an OTP or passkey before anything is shared.", "साझा करने से पहले आप OTP या पासकी से पुष्टि करेंगे।")} />
        </>
      )}

      <StepUpDialog open={stepUp} phone={phone} onDone={submit} onCancel={() => setStepUp(false)} title={t(`Confirm sharing with ${partner.name}`, `${partner.name} के साथ साझा करने की पुष्टि करें`)} />
    </div>
  );
}

function CustomInput({ c, value, error, onChange, locale }: { c: CustomField; value: unknown; error?: string; onChange: (v: unknown) => void; locale: Locale }) {
  const t = T(locale);
  const lbl = <>{c.label}{c.required && <span className="text-danger-500"> *</span>}</>;
  if (c.type === "bool") return <div className="grid gap-1"><label className="flex cursor-pointer items-start gap-3 text-[15px]"><input type="checkbox" className="mt-0.5 size-5 shrink-0 accent-brand-500" checked={value === true} onChange={(e) => onChange(e.target.checked)} aria-invalid={!!error} />{lbl}</label>{error && <p className="text-sm text-danger-500">{error}</p>}</div>;
  if (c.type === "enum") return (
    <Select selectedKey={value == null ? null : String(value)} onSelectionChange={(k) => onChange(k == null ? null : String(k))} isInvalid={!!error} placeholder={t("Choose", "चुनें")} fullWidth>
      <Label>{lbl}</Label><Select.Trigger><Select.Value /><Select.Indicator /></Select.Trigger>
      {error && <p className="text-sm text-danger-500">{error}</p>}
      <Select.Popover><ListBox>{(c.options ?? []).map((o) => <ListBox.Item key={o} id={o} textValue={o}>{o}<ListBox.ItemIndicator /></ListBox.Item>)}</ListBox></Select.Popover>
    </Select>
  );
  if (c.type === "file") return <div className="rounded-md border border-dashed border-line p-3 text-sm text-ink-2"><div className="font-medium text-ink">{lbl}</div>{t("Upload this on the partner’s portal after returning.", "वापस जाने पर साझेदार के पोर्टल पर अपलोड करें।")}</div>;
  return (
    <TextField value={value == null ? "" : String(value)} onChange={(v) => onChange(c.type === "number" ? (v === "" ? null : Number(v)) : v)} type={c.type === "number" ? "number" : c.type === "date" ? "date" : "text"} isInvalid={!!error} isRequired={c.required}>
      <Label>{lbl}</Label><Input />
      {error && <p className="text-sm text-danger-500">{error}</p>}
    </TextField>
  );
}
