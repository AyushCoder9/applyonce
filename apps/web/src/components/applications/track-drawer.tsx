"use client";
/** "Track an application" — for applications made outside Praman. POST /api/v1/applications source=manual. */
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button, Drawer, TextField, Label, Input, Select, ListBox, toast, Alert } from "@heroui/react";
import { Plus } from "lucide-react";
import { APPLICATION_STATUSES } from "@praman/schema";
import { KIND_LABEL, STATUS_META } from "./model";

export function TrackDrawer() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [f, setF] = useState({ title: "", org_name: "", kind: "other", status: "submitted", external_ref: "", portal_url: "", deadline_at: "" });
  const set = (k: keyof typeof f) => (v: string) => setF((s) => ({ ...s, [k]: v }));
  const submit = async () => {
    setBusy(true); setErr(null);
    const body = { ...f, external_ref: f.external_ref || null, portal_url: f.portal_url || null, deadline_at: f.deadline_at || null };
    const r = await fetch("/api/v1/applications", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(body) }).then((x) => x.json()).catch(() => null);
    setBusy(false);
    if (!r?.ok) return setErr(r?.error?.message ?? "Could not save. Check the fields.");
    toast.success("Added to your tracker");
    setOpen(false); setF({ title: "", org_name: "", kind: "other", status: "submitted", external_ref: "", portal_url: "", deadline_at: "" });
    router.refresh();
  };
  return (
    <Drawer isOpen={open} onOpenChange={setOpen}>
      <Button className="cta" onPress={() => setOpen(true)} data-testid="track-open"><Plus className="size-4" />Track an application</Button>
      <Drawer.Backdrop><Drawer.Content placement="right"><Drawer.Dialog>
        <Drawer.Header><Drawer.Heading>Track an application</Drawer.Heading></Drawer.Header>
        <Drawer.Body className="grid gap-4">
          <p className="text-sm text-ink-2">Applied somewhere without Praman? Add it here so deadlines and statuses live in one place.</p>
          {err && <Alert status="danger"><Alert.Indicator /><Alert.Content><Alert.Title>{err}</Alert.Title></Alert.Content></Alert>}
          <TextField value={f.title} onChange={set("title")} isRequired><Label>What did you apply for?</Label><Input placeholder="e.g. NEET UG 2026" /></TextField>
          <TextField value={f.org_name} onChange={set("org_name")} isRequired><Label>Organisation</Label><Input placeholder="e.g. National Testing Agency" /></TextField>
          <Select selectedKey={f.kind} onSelectionChange={(k) => set("kind")(String(k))} fullWidth><Label>Type</Label><Select.Trigger><Select.Value /><Select.Indicator /></Select.Trigger><Select.Popover><ListBox>{Object.entries(KIND_LABEL).map(([k, v]) => <ListBox.Item key={k} id={k} textValue={v}>{v}<ListBox.ItemIndicator /></ListBox.Item>)}</ListBox></Select.Popover></Select>
          <Select selectedKey={f.status} onSelectionChange={(k) => set("status")(String(k))} fullWidth><Label>Current status</Label><Select.Trigger><Select.Value /><Select.Indicator /></Select.Trigger><Select.Popover><ListBox>{APPLICATION_STATUSES.map((k) => <ListBox.Item key={k} id={k} textValue={STATUS_META[k].label}>{STATUS_META[k].label}<ListBox.ItemIndicator /></ListBox.Item>)}</ListBox></Select.Popover></Select>
          <TextField value={f.external_ref} onChange={set("external_ref")}><Label>Application / reference number</Label><Input placeholder="Optional" /></TextField>
          <TextField value={f.portal_url} onChange={set("portal_url")} type="url"><Label>Portal link</Label><Input placeholder="https://…" /></TextField>
          <TextField value={f.deadline_at} onChange={set("deadline_at")} type="date"><Label>Deadline</Label><Input /></TextField>
        </Drawer.Body>
        <Drawer.Footer><Button variant="outline" onPress={() => setOpen(false)}>Cancel</Button><Button className="cta" onPress={submit} isDisabled={!f.title || !f.org_name || busy} isPending={busy} data-testid="track-save">Save</Button></Drawer.Footer>
      </Drawer.Dialog></Drawer.Content></Drawer.Backdrop>
    </Drawer>
  );
}
