"use client";
import { useState } from "react";
import { Button, TextField, Label, Input, Description, Select, ListBox, toast } from "@heroui/react";
import { addMember, removeMember } from "./actions";

const ROLES: Record<string, string> = { owner: "Owner — everything", admin: "Admin — forms, keys, team", developer: "Developer — keys & webhooks, read applicants", reviewer: "Reviewer — applicants & statuses" };

export function TeamForm({ members, me, canManage }: { members: { userId: string; name: string; phone: string | null; role: string }[]; me: string; canManage: boolean }) {
  const [phone, setPhone] = useState("");
  const [role, setRole] = useState<"admin" | "developer" | "reviewer">("reviewer");
  const [err, setErr] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  return (
    <div className="grid gap-6">
      <ul className="card divide-y divide-line">
        {members.map((m) => <li key={m.userId} className="flex flex-wrap items-center gap-3 p-4 text-sm"><div className="grid size-9 place-items-center rounded-pill bg-brand-50 font-bold text-brand-700">{m.name.slice(0, 1)}</div><div className="min-w-0 flex-1"><div className="font-medium">{m.name}{m.userId === me && <span className="ml-1 text-xs text-ink-3">(you)</span>}</div><div className="text-ink-2">{m.phone ?? "—"} · {ROLES[m.role]?.split(" — ")[0] ?? m.role}</div></div>{canManage && m.userId !== me && m.role !== "owner" && <Button size="sm" variant="danger-soft" onPress={async () => { const r = await removeMember(m.userId); if (!r.ok) return toast.danger(r.error); toast.success("Removed"); }}>Remove</Button>}</li>)}
      </ul>
      {canManage && (
        <form className="card grid gap-4 p-5" onSubmit={async (e) => { e.preventDefault(); setBusy(true); setErr(null); const r = await addMember({ phone, role }); setBusy(false); if (!r.ok) return setErr(r.fields?.phone ?? r.error); toast.success(`${r.data.name} added`); setPhone(""); }}>
          <h2 className="font-display text-lg font-bold">Add a team member</h2>
          <div className="grid gap-4 sm:grid-cols-[1fr_260px_auto] sm:items-end">
            <TextField value={phone} onChange={(v) => setPhone(v.replace(/\D/g, "").slice(0, 10))} type="tel" isInvalid={!!err}><Label>Mobile number</Label><Input placeholder="10-digit mobile" /><Description>{err ?? "They need a ApplyOnce account with this number."}</Description></TextField>
            <Select selectedKey={role} onSelectionChange={(k) => setRole(String(k) as typeof role)}><Label>Role</Label><Select.Trigger><Select.Value /><Select.Indicator /></Select.Trigger><Select.Popover><ListBox>{(["admin", "developer", "reviewer"] as const).map((r) => <ListBox.Item key={r} id={r} textValue={r}>{ROLES[r]}<ListBox.ItemIndicator /></ListBox.Item>)}</ListBox></Select.Popover></Select>
            <Button type="submit" className="cta" isDisabled={phone.length !== 10 || busy} isPending={busy}>Add</Button>
          </div>
        </form>
      )}
    </div>
  );
}
