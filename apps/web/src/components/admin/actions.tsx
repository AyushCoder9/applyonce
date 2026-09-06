"use client";
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button, Switch, toast } from "@heroui/react";

const call = async (url: string, method: string, data?: unknown) => {
  const r = await fetch(url, { method, headers: { "content-type": "application/json" }, body: data ? JSON.stringify(data) : undefined });
  const j = await r.json().catch(() => ({}));
  if (!r.ok) throw new Error(j?.error?.message ?? "Failed");
  return j.data;
};
export function PartnerStatus({ id, status }: { id: string; status: string }) {
  const router = useRouter(); const [, start] = useTransition(); const [busy, setBusy] = useState<string | null>(null);
  const set = async (s: "verified" | "suspended" | "pending") => { setBusy(s); try { await call(`/api/v1/admin/partners/${id}/status`, "POST", { status: s }); toast.success(`Partner ${s}`); start(() => router.refresh()); } catch (e) { toast.danger((e as Error).message); } setBusy(null); };
  return (
    <div className="flex gap-2">
      {status !== "verified" && <Button size="sm" onPress={() => set("verified")} isPending={busy === "verified"}>Approve</Button>}
      {status !== "suspended" && <Button size="sm" variant="danger-soft" onPress={() => set("suspended")} isPending={busy === "suspended"}>Suspend</Button>}
      {status === "suspended" && <Button size="sm" variant="outline" onPress={() => set("pending")} isPending={busy === "pending"}>Back to pending</Button>}
    </div>
  );
}
export function FlagToggle({ flagKey, enabled }: { flagKey: string; enabled: boolean }) {
  const router = useRouter(); const [, start] = useTransition(); const [v, setV] = useState(enabled);
  const set = async (n: boolean) => { setV(n); try { await call(`/api/v1/admin/flags/${flagKey}`, "PUT", { enabled: n }); toast.success(`${flagKey} ${n ? "on" : "off"}`); start(() => router.refresh()); } catch (e) { setV(!n); toast.danger((e as Error).message); } };
  return <Switch isSelected={v} onChange={set} aria-label={`Toggle ${flagKey}`}><Switch.Content aria-label={`Toggle ${flagKey}`}><Switch.Control><Switch.Thumb /></Switch.Control></Switch.Content></Switch>;
}
export function NewFlag() {
  const router = useRouter(); const [, start] = useTransition(); const [k, setK] = useState("");
  const add = async () => { if (!k) return; try { await call(`/api/v1/admin/flags/${k}`, "PUT", { enabled: false }); setK(""); start(() => router.refresh()); } catch (e) { toast.danger((e as Error).message); } };
  return <div className="flex gap-2"><input value={k} onChange={(e) => setK(e.target.value.replace(/[^a-z0-9_]/g, ""))} placeholder="new_flag_key" className="rounded-md border border-line bg-surface px-3 py-2 text-sm" /><Button size="sm" variant="secondary" onPress={add}>Add flag</Button></div>;
}
