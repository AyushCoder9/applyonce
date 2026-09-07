"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button, TextField, Label, Input, Select, ListBox, Checkbox, Alert, Switch, toast } from "@heroui/react";
import { KeyRound, Webhook, Trash2, Send } from "lucide-react";
import { fmtDate, fmtDateTime } from "@applyonce/ui";
import { createApiKey, revokeApiKey, createWebhook, updateWebhook, deleteWebhook, testWebhook } from "./actions";
import { CopyButton } from "./form-tools";

export interface KeyRow { id: string; env: "sandbox" | "live"; prefix: string; label: string | null; createdAt: string; lastUsedAt: string | null; revokedAt: string | null }
export interface HookRow { id: string; url: string; events: string[]; active: boolean; createdAt: string }
export interface DeliveryRow { id: string; event: string; status: string; attempts: number; responseStatus: number | null; lastError: string | null; createdAt: string; url: string }
const EVENTS = ["share.completed", "consent.revoked", "verification.updated", "application.withdrawn"];

export function DevelopersPanel({ keys, hooks, deliveries, canManage, verified, appUrl }: { keys: KeyRow[]; hooks: HookRow[]; deliveries: DeliveryRow[]; canManage: boolean; verified: boolean; appUrl: string }) {
  const router = useRouter();
  const [env, setEnv] = useState<"sandbox" | "live">("sandbox");
  const [label, setLabel] = useState("");
  const [shown, setShown] = useState<{ kind: "key" | "secret"; value: string } | null>(null);
  const [url, setUrl] = useState("");
  const [events, setEvents] = useState<Set<string>>(new Set(EVENTS));
  const [busy, setBusy] = useState(false);
  const run = async <T,>(p: Promise<{ ok: true; data: T } | { ok: false; error: string }>, done: (d: T) => void) => { setBusy(true); const r = await p; setBusy(false); if (!r.ok) return toast.danger(r.error); done(r.data); router.refresh(); };
  return (
    <div className="grid gap-6">
      {shown && (
        <Alert status="success" data-testid="secret-once"><Alert.Indicator /><Alert.Content><Alert.Title>{shown.kind === "key" ? "Copy your API key now" : "Copy your webhook secret now"}</Alert.Title><Alert.Description>It is shown once; we store only a hash. <code className="mt-1 block break-all rounded-sm bg-surface-2 px-2 py-1 font-mono text-sm">{shown.value}</code></Alert.Description><div className="mt-2 flex gap-2"><CopyButton text={shown.value} /><Button size="sm" variant="ghost" onPress={() => setShown(null)}>Done</Button></div></Alert.Content></Alert>
      )}
      <section className="card p-5">
        <div className="mb-3 flex items-center gap-2"><KeyRound className="size-5 text-brand-600" /><h2 className="font-display text-lg font-bold">API keys</h2></div>
        <ul className="divide-y divide-line text-sm">
          {keys.map((k) => <li key={k.id} className="flex flex-wrap items-center gap-3 py-2"><code className="font-mono">{k.prefix}…</code><span className={`rounded-pill px-2 py-0.5 text-xs ${k.env === "live" ? "bg-verified-50 text-verified-700" : "bg-pending-50 text-pending-700"}`}>{k.env}</span><span className="text-ink-2">{k.label ?? "—"}</span><span className="ml-auto text-xs text-ink-3">created {fmtDate(k.createdAt)}{k.lastUsedAt ? ` · used ${fmtDate(k.lastUsedAt)}` : " · never used"}</span>{k.revokedAt ? <span className="text-xs text-danger-500">revoked</span> : canManage && <Button size="sm" variant="danger-soft" onPress={() => run(revokeApiKey(k.id), () => toast.success("Key revoked"))}>Revoke</Button>}</li>)}
          {!keys.length && <li className="py-2 text-ink-2">No keys yet.</li>}
        </ul>
        {canManage && (
          <div className="mt-4 flex flex-wrap items-end gap-3 border-t border-line pt-4">
            <Select selectedKey={env} onSelectionChange={(k) => setEnv(String(k) as "sandbox" | "live")} className="w-40"><Label>Environment</Label><Select.Trigger><Select.Value /><Select.Indicator /></Select.Trigger><Select.Popover><ListBox><ListBox.Item id="sandbox" textValue="sandbox">sandbox<ListBox.ItemIndicator /></ListBox.Item><ListBox.Item id="live" textValue="live" isDisabled={!verified}>live{!verified && " (after verification)"}<ListBox.ItemIndicator /></ListBox.Item></ListBox></Select.Popover></Select>
            <TextField value={label} onChange={setLabel} className="flex-1"><Label>Label</Label><Input placeholder="e.g. Staging server" /></TextField>
            <Button className="cta" isPending={busy} onPress={() => run(createApiKey({ env, label }), (d) => { setShown({ kind: "key", value: d.key }); setLabel(""); })} data-testid="create-key">Create key</Button>
          </div>
        )}
      </section>

      <section className="card p-5">
        <div className="mb-3 flex items-center gap-2"><Webhook className="size-5 text-brand-600" /><h2 className="font-display text-lg font-bold">Webhooks</h2><span className="ml-auto text-xs text-ink-3">HMAC-SHA256 · X-ApplyOnce-Signature · retried 5×</span></div>
        <ul className="grid gap-2 text-sm">
          {hooks.map((h) => (
            <li key={h.id} className="flex flex-wrap items-center gap-3 rounded-md border border-line p-3">
              <code className="min-w-0 flex-1 truncate font-mono">{h.url}</code>
              <span className="text-xs text-ink-3">{h.events.join(", ")}</span>
              {canManage && <Switch isSelected={h.active} onChange={(v) => run(updateWebhook(h.id, { active: v }), () => undefined)} aria-label="Active"><Switch.Content><Switch.Control><Switch.Thumb /></Switch.Control>{h.active ? "active" : "paused"}</Switch.Content></Switch>}
              <Button size="sm" variant="secondary" onPress={() => run(testWebhook(h.id), (d) => toast.success(`Queued ${d.deliveries} test.ping`))} isPending={busy}><Send className="size-4" />Test</Button>
              {canManage && <button type="button" onClick={() => run(deleteWebhook(h.id), () => toast.success("Removed"))} className="grid size-8 place-items-center rounded-pill text-ink-3 hover:bg-danger-50 hover:text-danger-500" aria-label="Delete"><Trash2 className="size-4" /></button>}
            </li>
          ))}
          {!hooks.length && <li className="text-ink-2">No endpoints. Add one to receive share.completed and consent.revoked.</li>}
        </ul>
        {canManage && (
          <div className="mt-4 grid gap-3 border-t border-line pt-4">
            <TextField value={url} onChange={setUrl} type="url"><Label>Endpoint URL</Label><Input placeholder="https://portal.example/api/applyonce/webhook" /></TextField>
            <div className="flex flex-wrap gap-4">{EVENTS.map((e) => <Checkbox key={e} isSelected={events.has(e)} onChange={(v) => setEvents((s) => { const n = new Set(s); if (v) n.add(e); else n.delete(e); return n; })}><Checkbox.Content><Checkbox.Control><Checkbox.Indicator /></Checkbox.Control><code className="font-mono text-xs">{e}</code></Checkbox.Content></Checkbox>)}</div>
            <div><Button className="cta" isDisabled={!url || !events.size} isPending={busy} onPress={() => run(createWebhook({ url, events: [...events] }), (d) => { setShown({ kind: "secret", value: d.secret }); setUrl(""); })} data-testid="create-webhook">Add endpoint</Button></div>
          </div>
        )}
      </section>

      <section className="card p-5">
        <h2 className="mb-2 font-display text-lg font-bold">Verify payloads</h2>
        <p className="text-sm text-ink-2">Every payload is an ES256 JWS. Public keys: <a className="text-brand-600 underline" href={`${appUrl}/api/v1/jwks`} target="_blank" rel="noreferrer"><code className="font-mono">{appUrl}/api/v1/jwks</code></a>. Use <code className="font-mono">@applyonce/sdk</code> `exchange()` or jose `createRemoteJWKSet`.</p>
      </section>

      <section className="card p-5">
        <h2 className="mb-2 font-display text-lg font-bold">Request log</h2>
        {!deliveries.length ? <p className="text-sm text-ink-2">No deliveries yet. Send a test from an endpoint above.</p> : (
          <div className="overflow-x-auto"><table className="w-full text-sm"><thead><tr className="text-left text-xs uppercase tracking-[0.04em] text-ink-3"><th className="py-1 pr-3">When</th><th className="py-1 pr-3">Event</th><th className="py-1 pr-3">Endpoint</th><th className="py-1 pr-3">Status</th><th className="py-1 pr-3">Attempts</th><th className="py-1">HTTP</th></tr></thead>
            <tbody>{deliveries.map((d) => <tr key={d.id} className="border-t border-line"><td className="py-1.5 pr-3 text-ink-3">{fmtDateTime(d.createdAt)}</td><td className="py-1.5 pr-3 font-mono text-xs">{d.event}</td><td className="max-w-[240px] truncate py-1.5 pr-3 font-mono text-xs">{d.url}</td><td className="py-1.5 pr-3"><span className={`rounded-pill px-2 py-0.5 text-xs ${d.status === "delivered" || d.status === "succeeded" ? "bg-verified-50 text-verified-700" : d.status === "failed" ? "bg-danger-50 text-danger-500" : "bg-pending-50 text-pending-700"}`}>{d.status}</span>{d.lastError && <span className="ml-2 text-xs text-ink-3">{d.lastError.slice(0, 60)}</span>}</td><td className="py-1.5 pr-3 tabular">{d.attempts}</td><td className="py-1.5 tabular">{d.responseStatus ?? "—"}</td></tr>)}</tbody></table></div>
        )}
      </section>
    </div>
  );
}
