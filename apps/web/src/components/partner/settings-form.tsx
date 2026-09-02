"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button, TextField, Label, Input, Description, toast } from "@heroui/react";
import { updateSettings } from "./actions";

export function SettingsForm({ initial, canManage }: { initial: { name: string; website: string; dpoEmail: string; retentionDays: number; logoUrl: string }; canManage: boolean }) {
  const router = useRouter();
  const [f, setF] = useState({ ...initial, retentionDays: String(initial.retentionDays) });
  const [errs, setErrs] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState(false);
  const set = (k: keyof typeof f) => (v: string) => setF((s) => ({ ...s, [k]: v }));
  return (
    <form className="card grid max-w-2xl gap-4 p-5" onSubmit={async (e) => { e.preventDefault(); setBusy(true); setErrs({}); const r = await updateSettings(f); setBusy(false); if (!r.ok) { setErrs(r.fields ?? {}); return toast.danger(r.error); } toast.success("Saved"); router.refresh(); }}>
      <TextField value={f.name} onChange={set("name")} isRequired isDisabled={!canManage} isInvalid={!!errs.name}><Label>Organisation name</Label><Input /><Description>{errs.name ?? "Shown on every consent screen."}</Description></TextField>
      <TextField value={f.logoUrl} onChange={set("logoUrl")} type="url" isDisabled={!canManage} isInvalid={!!errs.logoUrl}><Label>Logo URL</Label><Input placeholder="https://…/logo.png" /><Description>{errs.logoUrl ?? "Square PNG/SVG, shown next to your name."}</Description></TextField>
      <TextField value={f.website} onChange={set("website")} type="url" isDisabled={!canManage} isInvalid={!!errs.website}><Label>Website</Label><Input /></TextField>
      <TextField value={f.dpoEmail} onChange={set("dpoEmail")} type="email" isRequired isDisabled={!canManage} isInvalid={!!errs.dpoEmail}><Label>Data Protection Officer email</Label><Input /><Description>{errs.dpoEmail ?? "Citizens can raise DPDP requests here."}</Description></TextField>
      <TextField value={f.retentionDays} onChange={set("retentionDays")} type="number" isRequired isDisabled={!canManage} isInvalid={!!errs.retentionDays}><Label>Default retention (days)</Label><Input /><Description>{errs.retentionDays ?? "New forms start with this. Consent expires after it."}</Description></TextField>
      {canManage && <div className="flex justify-end"><Button type="submit" className="cta" isPending={busy}>Save</Button></div>}
    </form>
  );
}
