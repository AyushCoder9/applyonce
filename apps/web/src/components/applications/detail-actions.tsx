"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button, Modal, TextField, Label, Input, toast } from "@heroui/react";
import { MessageSquarePlus, XCircle } from "lucide-react";

export function DetailActions({ id, canWithdraw }: { id: string; canWithdraw: boolean }) {
  const router = useRouter();
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);
  const [confirm, setConfirm] = useState(false);
  const post = async (url: string, method: string, body: unknown) => {
    setBusy(true);
    const r = await fetch(url, { method, headers: { "content-type": "application/json" }, body: JSON.stringify(body) }).then((x) => x.json()).catch(() => null);
    setBusy(false);
    if (!r?.ok) { toast.danger(r?.error?.message ?? "Something went wrong"); return false; }
    router.refresh(); return true;
  };
  return (
    <div className="grid gap-3">
      <form className="flex gap-2" onSubmit={async (e) => { e.preventDefault(); if (note.trim() && (await post(`/api/v1/applications/${id}/events`, "POST", { title: note.trim() }))) { setNote(""); toast.success("Note added"); } }}>
        <TextField value={note} onChange={setNote} className="flex-1" aria-label="Add a note"><Label className="sr-only">Note</Label><Input placeholder="Add a note, e.g. “Paid fee ₹1000”" /></TextField>
        <Button type="submit" variant="secondary" isDisabled={!note.trim() || busy}><MessageSquarePlus className="size-4" />Add</Button>
      </form>
      {canWithdraw && (
        <Modal isOpen={confirm} onOpenChange={setConfirm}>
          <Button variant="danger-soft" onPress={() => setConfirm(true)} data-testid="withdraw"><XCircle className="size-4" />Withdraw application</Button>
          <Modal.Backdrop><Modal.Container><Modal.Dialog>
            <Modal.Header><Modal.Heading>Withdraw this application?</Modal.Heading></Modal.Header>
            <Modal.Body><p className="text-ink-2">The organisation is told you withdrew. Your consent stays until you revoke it under Connections.</p></Modal.Body>
            <Modal.Footer><Button variant="outline" onPress={() => setConfirm(false)}>Keep it</Button><Button variant="danger" isPending={busy} onPress={async () => { if (await post(`/api/v1/applications/${id}`, "PATCH", { status: "withdrawn" })) { setConfirm(false); toast.success("Withdrawn"); } }} data-testid="withdraw-confirm">Withdraw</Button></Modal.Footer>
          </Modal.Dialog></Modal.Container></Modal.Backdrop>
        </Modal>
      )}
    </div>
  );
}
