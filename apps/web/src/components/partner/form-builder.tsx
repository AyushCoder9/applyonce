"use client";
/** Form builder: purpose → schema tree (SECTION_META + fieldsInSection) with required toggles; blocked keys disabled with a reason; custom questions; preview as a citizen sees it. */
import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Button, TextField, Label, Input, Description, Select, ListBox, Checkbox, Alert, Tabs, toast } from "@heroui/react";
import { Plus, Trash2 } from "lucide-react";
import { SECTION_META, fieldsInSection, canShare, PURPOSES, PURPOSE_LABELS, field, type Purpose, type CustomField, type FieldDiffRow } from "@applyonce/schema";
import { ConsentFieldList, ConsentSummaryChips, PartnerIdentity } from "@applyonce/ui";
import { saveFormAction } from "./actions";

const KINDS = [["exam", "Exam"], ["admission", "Admission"], ["scholarship", "Scholarship"], ["job", "Job"], ["kyc", "KYC"], ["healthcare", "Healthcare"], ["scheme", "Scheme"], ["other", "Other"]] as const;
export interface BuilderInitial { id: string; name: string; slug: string; description: string | null; purpose: Purpose; kind: string; requestedFields: { key: string; required: boolean }[]; customFields: CustomField[]; retentionDays: number; redirectUrl: string; webhookUrl: string | null; deadlineAt: string | null; status: string; version: number }

export function FormBuilder({ initial, partnerName, verified }: { initial?: BuilderInitial; partnerName: string; verified: boolean }) {
  const router = useRouter();
  const [name, setName] = useState(initial?.name ?? "");
  const [slug, setSlug] = useState(initial?.slug ?? "");
  const [description, setDescription] = useState(initial?.description ?? "");
  const [purpose, setPurpose] = useState<Purpose>(initial?.purpose ?? "exam_application");
  const [kind, setKind] = useState(initial?.kind ?? "exam");
  const [fields, setFields] = useState<Map<string, boolean>>(() => new Map((initial?.requestedFields ?? []).map((f) => [f.key, f.required])));
  const [custom, setCustom] = useState<CustomField[]>(initial?.customFields ?? []);
  const [retention, setRetention] = useState(String(initial?.retentionDays ?? 365));
  const [redirectUrl, setRedirectUrl] = useState(initial?.redirectUrl ?? "");
  const [webhookUrl, setWebhookUrl] = useState(initial?.webhookUrl ?? "");
  const [deadline, setDeadline] = useState(initial?.deadlineAt?.slice(0, 10) ?? "");
  const [status, setStatus] = useState(initial?.status ?? "live");
  const [err, setErr] = useState<string | null>(null);
  const [fieldErrs, setFieldErrs] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState(false);

  const blocked = useMemo(() => new Set([...fields.keys()].filter((k) => !canShare(k, purpose))), [fields, purpose]);
  const previewRows: FieldDiffRow[] = useMemo(() => [...fields.entries()].map(([key, required]) => ({ key, required, status: canShare(key, purpose) ? "verified" : "blocked", value: canShare(key, purpose) ? "…" : undefined })), [fields, purpose]);
  const toggleField = (key: string, on: boolean) => setFields((m) => { const n = new Map(m); if (on) n.set(key, n.get(key) ?? true); else n.delete(key); return n; });
  const setRequired = (key: string, req: boolean) => setFields((m) => new Map(m).set(key, req));

  const save = async () => {
    setBusy(true); setErr(null); setFieldErrs({});
    const requested_fields = [...fields.entries()].filter(([k]) => !blocked.has(k)).map(([key, required]) => ({ key, required }));
    const r = await saveFormAction({ name, slug: slug || undefined, description: description || null, purpose, kind, requested_fields, custom_fields: custom, retention_days: Number(retention), redirect_url: redirectUrl, webhook_url: webhookUrl || null, deadline_at: deadline || null, status }, initial?.id);
    setBusy(false);
    if (!r.ok) { setErr(r.error); setFieldErrs(r.fields ?? {}); return; }
    toast.success(initial ? `Saved as version ${r.data.version}` : "Form created");
    router.push(`/partner/forms/${r.data.id}`); router.refresh();
  };
  const addCustom = () => setCustom((c) => [...c, { id: `q_${c.length + 1}`, label: "", type: "string", required: true }]);
  const upd = (i: number, p: Partial<CustomField>) => setCustom((c) => c.map((x, j) => (j === i ? { ...x, ...p } : x)));

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_380px]">
      <div className="grid gap-6">
        {err && <Alert status="danger"><Alert.Indicator /><Alert.Content><Alert.Title>{err}</Alert.Title>{Object.keys(fieldErrs).length > 0 && <Alert.Description>{Object.entries(fieldErrs).map(([k, v]) => `${k}: ${v}`).join(" · ")}</Alert.Description>}</Alert.Content></Alert>}
        <section className="card grid gap-4 p-5">
          <h2 className="font-display text-lg font-bold">Basics</h2>
          <TextField value={name} onChange={setName} isRequired isInvalid={!!fieldErrs.name}><Label>Form name</Label><Input placeholder="e.g. BTA-JEE 2026 Registration" /><Description>{fieldErrs.name ?? "Citizens see this as the application title."}</Description></TextField>
          <div className="grid gap-4 sm:grid-cols-2">
            <TextField value={slug} onChange={(v) => setSlug(v.toLowerCase())} isInvalid={!!fieldErrs.slug}><Label>Slug</Label><Input placeholder="auto from name" /><Description>{fieldErrs.slug ?? "Used in data-applyonce-form=\"…\""}</Description></TextField>
            <Select selectedKey={kind} onSelectionChange={(k) => setKind(String(k))} fullWidth><Label>Application type</Label><Select.Trigger><Select.Value /><Select.Indicator /></Select.Trigger><Select.Popover><ListBox>{KINDS.map(([k, v]) => <ListBox.Item key={k} id={k} textValue={v}>{v}<ListBox.ItemIndicator /></ListBox.Item>)}</ListBox></Select.Popover></Select>
          </div>
          <TextField value={description} onChange={setDescription}><Label>Description</Label><Input placeholder="One line shown in the catalog" /></TextField>
          <Select selectedKey={purpose} onSelectionChange={(k) => setPurpose(String(k) as Purpose)} fullWidth><Label>Purpose (DPDP)</Label><Select.Trigger><Select.Value /><Select.Indicator /></Select.Trigger><Description>Some fields are only shareable for certain purposes — they grey out below.</Description><Select.Popover><ListBox>{PURPOSES.map((p) => <ListBox.Item key={p} id={p} textValue={PURPOSE_LABELS[p].en}>{PURPOSE_LABELS[p].en}<ListBox.ItemIndicator /></ListBox.Item>)}</ListBox></Select.Popover></Select>
        </section>

        <section className="card p-5">
          <div className="mb-3 flex items-center justify-between"><h2 className="font-display text-lg font-bold">Fields · {[...fields.keys()].filter((k) => !blocked.has(k)).length} selected</h2>{blocked.size > 0 && <span className="text-xs text-danger-500">{blocked.size} not allowed for this purpose — will be dropped</span>}</div>
          <div className="grid gap-2">
            {SECTION_META.map((s) => { const defs = fieldsInSection(s.id).filter((d) => !d.system && !d.derived); const n = defs.filter((d) => fields.has(d.key)).length; return (
              <details key={s.id} className="rounded-md border border-line" open={n > 0}>
                <summary className="flex cursor-pointer items-center justify-between px-3 py-2"><span className="font-medium">{s.label.en}</span><span className="text-xs text-ink-3">{n}/{defs.length}</span></summary>
                <ul className="divide-y divide-line border-t border-line">
                  {defs.map((d) => { const ok = canShare(d.key, purpose); const on = fields.has(d.key); return (
                    <li key={d.key} className={`grid grid-cols-[auto_1fr_auto] items-center gap-3 px-3 py-1.5 text-sm ${!ok ? "opacity-60" : ""}`}>
                      <Checkbox isSelected={on && ok} isDisabled={!ok} onChange={(v) => toggleField(d.key, v)} aria-label={d.label.en}><Checkbox.Content aria-label={d.label.en}><Checkbox.Control><Checkbox.Indicator /></Checkbox.Control></Checkbox.Content></Checkbox>
                      <div className="min-w-0"><div>{d.label.en}{d.sensitive && <span className="ml-1 text-xs text-pending-700">sensitive</span>}</div><div className="truncate font-mono text-xs text-ink-3">{d.key}{!ok && <span className="ml-2 text-danger-500">not shareable for {PURPOSE_LABELS[purpose].en}</span>}</div></div>
                      {on && ok && <label className="flex items-center gap-1 text-xs"><input type="checkbox" checked={fields.get(d.key) ?? true} onChange={(e) => setRequired(d.key, e.target.checked)} />required</label>}
                    </li>
                  ); })}
                </ul>
              </details>
            ); })}
          </div>
        </section>

        <section className="card grid gap-3 p-5">
          <div className="flex items-center justify-between"><h2 className="font-display text-lg font-bold">Your own questions</h2><Button size="sm" variant="secondary" onPress={addCustom}><Plus className="size-4" />Add</Button></div>
          {!custom.length && <p className="text-sm text-ink-2">Things only you can ask — exam city preference, paper, declarations.</p>}
          {custom.map((c, i) => (
            <div key={i} className="grid gap-2 rounded-md border border-line p-3 sm:grid-cols-[120px_1fr_130px_auto_auto]">
              <input value={c.id} onChange={(e) => upd(i, { id: e.target.value.replace(/[^a-z0-9_]/g, "") })} placeholder="id" className="rounded-sm border border-line px-2 py-1.5 font-mono text-xs" aria-label="Question id" />
              <input value={c.label} onChange={(e) => upd(i, { label: e.target.value })} placeholder="Label" className="rounded-sm border border-line px-2 py-1.5 text-sm" aria-label="Question label" />
              <select value={c.type} onChange={(e) => upd(i, { type: e.target.value as CustomField["type"] })} className="rounded-sm border border-line px-2 py-1.5 text-sm" aria-label="Type">{["string", "number", "bool", "enum", "date", "file"].map((x) => <option key={x}>{x}</option>)}</select>
              <label className="flex items-center gap-1 text-xs"><input type="checkbox" checked={!!c.required} onChange={(e) => upd(i, { required: e.target.checked })} />required</label>
              <button type="button" onClick={() => setCustom((x) => x.filter((_, j) => j !== i))} className="grid size-8 place-items-center rounded-pill text-ink-3 hover:bg-danger-50 hover:text-danger-500" aria-label="Remove"><Trash2 className="size-4" /></button>
              {c.type === "enum" && <input value={(c.options ?? []).join(", ")} onChange={(e) => upd(i, { options: e.target.value.split(",").map((s) => s.trim()).filter(Boolean) })} placeholder="Options, comma separated" className="rounded-sm border border-line px-2 py-1.5 text-sm sm:col-span-5" aria-label="Options" />}
            </div>
          ))}
        </section>

        <section className="card grid gap-4 p-5">
          <h2 className="font-display text-lg font-bold">Delivery</h2>
          <TextField value={redirectUrl} onChange={setRedirectUrl} type="url" isRequired isInvalid={!!fieldErrs.redirect_url}><Label>Return URL</Label><Input placeholder="https://portal.example/apply/return" /><Description>{fieldErrs.redirect_url ?? "Citizens land here with ?share_token=…&state=…; exchange it server-side within 10 minutes."}</Description></TextField>
          <TextField value={webhookUrl} onChange={setWebhookUrl} type="url" isInvalid={!!fieldErrs.webhook_url}><Label>Webhook URL (optional)</Label><Input placeholder="https://portal.example/api/applyonce/webhook" /><Description>Register endpoints and secrets under Developers → Webhooks; this is a reminder of where events go.</Description></TextField>
          <div className="grid gap-4 sm:grid-cols-3">
            <TextField value={retention} onChange={setRetention} type="number" isInvalid={!!fieldErrs.retention_days}><Label>Retention (days)</Label><Input /><Description>Consent expires after this.</Description></TextField>
            <TextField value={deadline} onChange={setDeadline} type="date"><Label>Deadline</Label><Input /></TextField>
            <Select selectedKey={status} onSelectionChange={(k) => setStatus(String(k))} fullWidth><Label>Status</Label><Select.Trigger><Select.Value /><Select.Indicator /></Select.Trigger><Select.Popover><ListBox>{["draft", "live", "archived"].map((x) => <ListBox.Item key={x} id={x} textValue={x}>{x}<ListBox.ItemIndicator /></ListBox.Item>)}</ListBox></Select.Popover></Select>
          </div>
        </section>
        <div className="flex justify-end gap-2"><Button variant="outline" onPress={() => router.back()}>Cancel</Button><Button className="cta" onPress={save} isPending={busy} isDisabled={!name || !redirectUrl || !fields.size} data-testid="form-save">{initial ? `Save as v${initial.version + 1}` : "Create form"}</Button></div>
      </div>

      <aside className="lg:sticky lg:top-6 lg:self-start">
        <Tabs>
          <Tabs.ListContainer><Tabs.List aria-label="Preview"><Tabs.Tab id="preview">Citizen preview<Tabs.Indicator /></Tabs.Tab></Tabs.List></Tabs.ListContainer>
          <Tabs.Panel id="preview" className="grid gap-3 pt-3">
            <PartnerIdentity partner={{ name: partnerName, verified }} purpose={purpose} retentionDays={Number(retention) || 365} />
            <ConsentSummaryChips s={{ requested: previewRows.length, verified: previewRows.filter((r) => r.status === "verified").length, extracted: 0, self: 0, missing: 0, blocked: previewRows.filter((r) => r.status === "blocked").length }} />
            <div className="max-h-[60vh] overflow-auto">{previewRows.length ? <ConsentFieldList rows={previewRows} /> : <p className="text-sm text-ink-2">Pick fields to see the consent screen.</p>}</div>
            {custom.length > 0 && <div className="text-xs text-ink-3">+ {custom.length} question{custom.length === 1 ? "" : "s"} of yours: {custom.map((c) => c.label || c.id).join(", ")}</div>}
          </Tabs.Panel>
        </Tabs>
      </aside>
    </div>
  );
}
export const fieldLabel = (key: string) => { try { return field(key).label.en; } catch { return key; } };
