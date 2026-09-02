"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button, Modal, toast } from "@heroui/react";
import { Ban, Eye } from "lucide-react";
import { StepUpDialog } from "@/components/share/step-up-fallback";

export function RevokeButton({ consentId, partnerName, size = "md" }: { consentId: string; partnerName: string; size?: "sm" | "md" }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const revoke = async () => {
    setBusy(true);
    const r = await fetch(`/api/v1/consents/${consentId}/revoke`, { method: "POST" }).then((x) => x.json()).catch(() => null);
    setBusy(false);
    if (!r?.ok) return toast.danger(r?.error?.message ?? "Could not revoke");
    toast.success(`Revoked. ${partnerName} has been told to stop using your data.`);
    setOpen(false); router.refresh();
  };
  return (
    <Modal isOpen={open} onOpenChange={setOpen}>
      <Button size={size} variant="danger-soft" onPress={() => setOpen(true)} data-testid="revoke"><Ban className="size-4" />Revoke</Button>
      <Modal.Backdrop><Modal.Container><Modal.Dialog>
        <Modal.Header><Modal.Heading>Revoke access for {partnerName}?</Modal.Heading></Modal.Header>
        <Modal.Body><p className="text-ink-2">They can’t fetch this data again and receive a <code className="font-mono text-sm">consent.revoked</code> notice. Data they already downloaded is covered by their retention policy — the consent ID stays as your proof.</p></Modal.Body>
        <Modal.Footer><Button variant="outline" onPress={() => setOpen(false)}>Keep access</Button><Button variant="danger" onPress={revoke} isPending={busy} data-testid="revoke-confirm">Revoke</Button></Modal.Footer>
      </Modal.Dialog></Modal.Container></Modal.Backdrop>
    </Modal>
  );
}

/** Masked view → step-up → server re-renders with the decrypted payload. */
export function RevealButton({ phone }: { phone: string | null }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  return (
    <>
      <Button className="cta" onPress={() => setOpen(true)} data-testid="reveal"><Eye className="size-4" />Reveal values</Button>
      <StepUpDialog open={open} phone={phone} onDone={() => { setOpen(false); router.refresh(); }} onCancel={() => setOpen(false)} title="Confirm to reveal shared values" />
    </>
  );
}
