"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button, Drawer, Select, ListBox, Label, TextField, Input, Checkbox, toast, Chip } from "@heroui/react";
import { APPLICATION_STATUSES, type PramanPayload } from "@praman/schema";
import { DataTable, SourceChip, fmtValue, fmtDate, label as keyLabel, type DataColumn } from "@praman/ui";
import { STATUS_META } from "@/components/applications/model";
import { getApplicantPayload, pushStatusAction, requestVerificationAction } from "./actions";

export interface ApplicantRow { id: string; applicant: string; form: string; status: string; externalRef: string | null; submittedAt: string | null; verified: number; self: number; total: number; hasPayload: boolean; guardian: boolean }

export function ApplicantsTable({ rows }: { rows: ApplicantRow[] }) {
  const router = useRouter();
  const [open, setOpen] = useState<ApplicantRow | null>(null);
  const [data, setData] = useState<{ payload: PramanPayload; exchanged_at: string | null; consent_status: string } | null>(null);
  const [status, setStatus] = useState("under_review");
  const [note, setNote] = useState("");
  const [ref, setRef] = useState("");
  const [pick, setPick] = useState<Set<string>>(new Set());
  const [reason, setReason] = useState("");
  const [busy, setBusy] = useState(false);

  const openRow = async (r: ApplicantRow) => {
    setOpen(r); setData(null); setPick(new Set()); setStatus(r.status === "submitted" ? "under_review" : r.status); setRef(r.externalRef ?? "");
    if (!r.hasPayload) return;
    const res = await getApplicantPayload(r.id);
    if (!res.ok) return toast.danger(res.error);
    setData(res.data);
  };
  const push = async () => {
    if (!open) return; setBusy(true);
    const r = await pushStatusAction(open.id, { status, note: note || undefined, externalRef: ref || undefined });
    setBusy(false);
    if (!r.ok) return toast.danger(r.error);
    toast.success(`Status pushed: ${STATUS_META[status as keyof typeof STATUS_META]?.label ?? status}`); setNote(""); router.refresh();
  };
  const reverify = async () => {
    if (!open || !pick.size) return; setBusy(true);
    const r = await requestVerificationAction(open.id, [...pick], reason || undefined);
    setBusy(false);
    if (!r.ok) return toast.danger(r.error);
    toast.success(`Asked to re-verify ${pick.size} field${pick.size === 1 ? "" : "s"}`); setPick(new Set()); setReason("");
  };
  const columns: DataColumn<ApplicantRow>[] = [
    { id: "applicant", header: "Applicant", filter: true, cell: (r) => <span className="font-medium">{r.applicant}{r.guardian && <span className="ml-1 text-xs text-ink-3">(via guardian)</span>}</span>, value: (r) => r.applicant },
    { id: "form", header: "Form", filter: true, cell: (r) => r.form },
    { id: "status", header: "Status", filter: true, cell: (r) => <Chip size="sm" color={STATUS_META[r.status as keyof typeof STATUS_META]?.color ?? "default"}>{STATUS_META[r.status as keyof typeof STATUS_META]?.label ?? r.status}</Chip>, value: (r) => r.status },
    { id: "verified", header: "Verified fields", align: "right", cell: (r) => r.total ? <span className={r.verified === r.total ? "text-verified-700" : ""}>{r.verified}/{r.total}{r.self > 0 && <span className="ml-1 text-xs text-pending-700">{r.self} self</span>}</span> : "—", value: (r) => r.total ? Math.round((r.verified / r.total) * 100) : -1 },
    { id: "ref", header: "Your ref", filter: true, cell: (r) => r.externalRef ?? "—", value: (r) => r.externalRef ?? "" },
    { id: "submitted", header: "Submitted", cell: (r) => fmtDate(r.submittedAt), value: (r) => r.submittedAt ?? "" },
  ];
  return (
    <>
      <DataTable rows={rows} columns={columns} rowId={(r) => r.id} onRowClick={openRow} csvName="applicants" ariaLabel="Applicants" empty="No applicants yet. Test the flow from a form page." />
      <Drawer isOpen={!!open} onOpenChange={(o) => !o && setOpen(null)}>
        <Drawer.Backdrop><Drawer.Content placement="right" className="sm:max-w-2xl"><Drawer.Dialog>
          <Drawer.Header><Drawer.Heading>{open?.applicant} · {open?.form}</Drawer.Heading></Drawer.Header>
          <Drawer.Body className="grid gap-5">
            {open && (
              <>
                <section className="grid gap-3 rounded-md border border-line p-3">
                  <h3 className="font-display font-bold">Push status</h3>
                  <div className="grid gap-3 sm:grid-cols-2">
                    <Select selectedKey={status} onSelectionChange={(k) => setStatus(String(k))} fullWidth><Label>Status</Label><Select.Trigger><Select.Value /><Select.Indicator /></Select.Trigger><Select.Popover><ListBox>{APPLICATION_STATUSES.map((s) => <ListBox.Item key={s} id={s} textValue={STATUS_META[s].label}>{STATUS_META[s].label}<ListBox.ItemIndicator /></ListBox.Item>)}</ListBox></Select.Popover></Select>
                    <TextField value={ref} onChange={setRef}><Label>Your reference</Label><Input placeholder="e.g. BTA-2026-001742" /></TextField>
                  </div>
                  <TextField value={note} onChange={setNote}><Label>Note to the applicant</Label><Input placeholder="e.g. Admit card released — download from the portal" /></TextField>
                  <div className="flex justify-end"><Button className="cta" onPress={push} isPending={busy} data-testid="push-status">Push status</Button></div>
                </section>
                {!open.hasPayload ? <p className="text-sm text-ink-2">No Praman payload for this application.</p> : !data ? <p className="text-sm text-ink-2">Decrypting payload…</p> : (
                  <section className="grid gap-3">
                    <div className="flex flex-wrap items-center gap-2 text-sm text-ink-2"><span>{data.payload.facts.length} fields</span><span>·</span><span>consent <code className="font-mono text-xs">{data.payload.consent_id.slice(0, 8)}…</code> {data.consent_status}</span><span>·</span><span>{data.exchanged_at ? `exchanged ${fmtDate(data.exchanged_at)}` : "not exchanged yet"}</span>{data.payload.profile.guardian_acting && <Chip size="sm" color="warning">guardian acting</Chip>}</div>
                    {data.consent_status === "revoked" && <p className="rounded-md bg-danger-50 px-3 py-2 text-sm text-danger-500">The citizen revoked this consent. Stop using the data per your retention policy.</p>}
                    <ul className="divide-y divide-line rounded-md border border-line">
                      {data.payload.facts.map((f) => (
                        <li key={f.key} className="grid grid-cols-[auto_1fr_auto] items-center gap-3 px-3 py-2 text-sm">
                          <Checkbox isSelected={pick.has(f.key)} onChange={(v) => setPick((s) => { const n = new Set(s); if (v) n.add(f.key); else n.delete(f.key); return n; })} aria-label={`Re-verify ${keyLabel(f.key)}`}><Checkbox.Control><Checkbox.Indicator /></Checkbox.Control></Checkbox>
                          <div className="min-w-0"><div className="text-ink-2">{keyLabel(f.key)}</div><div className="truncate font-medium">{fmtValue(f.key, f.value)}</div></div>
                          <SourceChip source={f.source} verifiedBy={f.verifiedBy} />
                        </li>
                      ))}
                    </ul>
                    {Object.keys(data.payload.custom ?? {}).length > 0 && <dl className="grid gap-1 rounded-md bg-surface-2 p-3 text-sm">{Object.entries(data.payload.custom).map(([k, v]) => <div key={k} className="flex gap-2"><dt className="w-40 shrink-0 text-ink-2">{k}</dt><dd className="font-medium">{String(v)}</dd></div>)}</dl>}
                    <div className="grid gap-2 rounded-md border border-line p-3">
                      <h3 className="font-display font-bold">Request re-verification {pick.size > 0 && `· ${pick.size} selected`}</h3>
                      <TextField value={reason} onChange={setReason}><Label>Reason shown to the applicant</Label><Input placeholder="e.g. Category certificate looks expired" /></TextField>
                      <div className="flex justify-end"><Button variant="secondary" onPress={reverify} isDisabled={!pick.size || busy} isPending={busy}>Ask to re-verify</Button></div>
                    </div>
                  </section>
                )}
              </>
            )}
          </Drawer.Body>
          <Drawer.Footer><Button variant="outline" onPress={() => setOpen(null)}>Close</Button></Drawer.Footer>
        </Drawer.Dialog></Drawer.Content></Drawer.Backdrop>
      </Drawer>
    </>
  );
}
