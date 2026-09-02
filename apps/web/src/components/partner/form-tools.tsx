"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button, toast } from "@heroui/react";
import { Copy, Play } from "lucide-react";
import { createTestSession, setFormStatus } from "./actions";

export function CopyButton({ text, label = "Copy" }: { text: string; label?: string }) {
  return <Button size="sm" variant="secondary" onPress={async () => { await navigator.clipboard.writeText(text); toast.success("Copied"); }}><Copy className="size-4" />{label}</Button>;
}

export function FormTools({ formId, status }: { formId: string; status: string }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const test = async () => {
    setBusy(true);
    const r = await createTestSession(formId);
    setBusy(false);
    if (!r.ok) return toast.danger(r.error);
    window.open(r.data.share_url, "_blank", "noopener");
  };
  const flip = async (s: "draft" | "live" | "archived") => { const r = await setFormStatus(formId, s); if (!r.ok) return toast.danger(r.error); toast.success(`Form is now ${s}`); router.refresh(); };
  return (
    <div className="flex flex-wrap gap-2">
      <Button className="cta" onPress={test} isPending={busy} data-testid="form-test"><Play className="size-4" />Test as a citizen</Button>
      {status !== "live" && <Button variant="secondary" onPress={() => flip("live")}>Publish</Button>}
      {status === "live" && <Button variant="outline" onPress={() => flip("draft")}>Unpublish</Button>}
      {status !== "archived" && <Button variant="danger-soft" onPress={() => flip("archived")}>Archive</Button>}
    </div>
  );
}
