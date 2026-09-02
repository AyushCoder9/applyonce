"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button, TextField, Label, Input, Description, Select, ListBox, Alert } from "@heroui/react";
import { registerOrganisation } from "./actions";

const KINDS = [["exam_board", "Exam board / testing agency"], ["university", "University / college"], ["school", "School"], ["employer", "Employer"], ["bank", "Bank / NBFC"], ["hospital", "Hospital / clinic"], ["government", "Government body"], ["other", "Other"]] as const;
const REG: Record<string, { label: string; hint: string }> = { CIN: { label: "CIN", hint: "21-character company id from MCA" }, UDISE: { label: "UDISE code", hint: "11-digit school code" }, AISHE: { label: "AISHE code", hint: "e.g. U-0123 or C-12345" }, GSTIN: { label: "GSTIN", hint: "15-character GST number" }, OTHER: { label: "Registration number", hint: "Any government-issued registration" } };

export function OnboardingForm() {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [f, setF] = useState({ name: "", kind: "exam_board", regType: "CIN", regNo: "", website: "", dpoEmail: "" });
  const [errs, setErrs] = useState<Record<string, string>>({});
  const [err, setErr] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const set = (k: keyof typeof f) => (v: string) => setF((s) => ({ ...s, [k]: v }));
  const submit = async () => {
    setBusy(true); setErr(null); setErrs({});
    const r = await registerOrganisation(f);
    setBusy(false);
    if (!r.ok) { setErr(r.error); setErrs(r.fields ?? {}); if (r.fields?.name || r.fields?.kind) setStep(0); else if (r.fields?.regNo || r.fields?.regType) setStep(1); return; }
    router.push("/partner"); router.refresh();
  };
  const steps = ["Organisation", "Registration", "Contact"];
  return (
    <div className="card p-6 sm:p-8">
      <ol className="mb-6 flex gap-2 text-xs">{steps.map((s, i) => <li key={s} className={`rounded-pill px-3 py-1 ${i === step ? "bg-brand-50 text-brand-700 font-semibold" : i < step ? "bg-verified-50 text-verified-700" : "bg-surface-2 text-ink-3"}`}>{i + 1}. {s}</li>)}</ol>
      {err && <Alert status="danger" className="mb-4"><Alert.Indicator /><Alert.Content><Alert.Title>{err}</Alert.Title></Alert.Content></Alert>}
      {step === 0 && (
        <div className="grid gap-4">
          <TextField value={f.name} onChange={set("name")} isRequired isInvalid={!!errs.name} autoFocus><Label>Organisation name</Label><Input placeholder="e.g. Bharat Test Agency" /><Description>{errs.name ?? "Shown to citizens on the consent screen."}</Description></TextField>
          <Select selectedKey={f.kind} onSelectionChange={(k) => set("kind")(String(k))} fullWidth><Label>Type</Label><Select.Trigger><Select.Value /><Select.Indicator /></Select.Trigger><Select.Popover><ListBox>{KINDS.map(([k, v]) => <ListBox.Item key={k} id={k} textValue={v}>{v}<ListBox.ItemIndicator /></ListBox.Item>)}</ListBox></Select.Popover></Select>
        </div>
      )}
      {step === 1 && (
        <div className="grid gap-4">
          <Select selectedKey={f.regType} onSelectionChange={(k) => set("regType")(String(k))} fullWidth><Label>Registration type</Label><Select.Trigger><Select.Value /><Select.Indicator /></Select.Trigger><Select.Popover><ListBox>{Object.entries(REG).map(([k, v]) => <ListBox.Item key={k} id={k} textValue={v.label}>{v.label}<ListBox.ItemIndicator /></ListBox.Item>)}</ListBox></Select.Popover></Select>
          <TextField value={f.regNo} onChange={set("regNo")} isRequired isInvalid={!!errs.regNo} autoFocus><Label>{REG[f.regType]!.label}</Label><Input /><Description>{errs.regNo ?? `${REG[f.regType]!.hint}. Praman verifies this before live keys are issued.`}</Description></TextField>
        </div>
      )}
      {step === 2 && (
        <div className="grid gap-4">
          <TextField value={f.website} onChange={set("website")} type="url" isRequired isInvalid={!!errs.website} autoFocus><Label>Website</Label><Input placeholder="https://" /><Description>{errs.website ?? "Must match the domain your button lives on."}</Description></TextField>
          <TextField value={f.dpoEmail} onChange={set("dpoEmail")} type="email" isRequired isInvalid={!!errs.dpoEmail}><Label>Data Protection Officer email</Label><Input placeholder="dpo@…" /><Description>{errs.dpoEmail ?? "Required under DPDP. Citizens can contact this address."}</Description></TextField>
        </div>
      )}
      <div className="mt-6 flex justify-between">
        <Button variant="outline" onPress={() => setStep((s) => Math.max(0, s - 1))} isDisabled={step === 0 || busy}>Back</Button>
        {step < 2 ? <Button className="cta" onPress={() => setStep((s) => s + 1)} isDisabled={(step === 0 && f.name.trim().length < 3) || (step === 1 && f.regNo.trim().length < 3)}>Continue</Button> : <Button className="cta" onPress={submit} isPending={busy} isDisabled={!f.website || !f.dpoEmail}>Register organisation</Button>}
      </div>
    </div>
  );
}
