"use client";
/** Minimal step-up (OTP re-verify, mock code 123456) posting to WP1’s `POST /api/v1/auth/step-up`. Swap for `@/components/vault/step-up-dialog` when it lands. */
import { useEffect, useState } from "react";
import { Button, InputOTP, Alert } from "@heroui/react";
import { ShieldCheck } from "lucide-react";
import { authClient } from "@/lib/auth-client";

export function StepUpDialog({ open, phone, onDone, onCancel, title = "Confirm it’s you" }: { open: boolean; phone?: string | null; onDone: (method: "otp" | "passkey") => void; onCancel: () => void; title?: string }) {
  const [code, setCode] = useState("");
  const [err, setErr] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [sent, setSent] = useState(false);

  useEffect(() => {
    if (!open || sent || !phone) return;
    setSent(true);
    authClient.phoneNumber.sendOtp({ phoneNumber: phone }).catch(() => undefined);
  }, [open, sent, phone]);

  if (!open) return null;
  const verify = async (c = code) => {
    if (c.length !== 6 || busy) return;
    setBusy(true); setErr(null);
    const r = await fetch("/api/v1/auth/step-up", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ method: "otp", code: c }) });
    const j = await r.json().catch(() => ({}));
    setBusy(false);
    if (!r.ok) return setErr(j?.error?.message ?? "Wrong code. Check and try again.");
    onDone("otp");
  };
  return (
    <div role="dialog" aria-modal="true" aria-label={title} className="fixed inset-0 z-50 grid place-items-end bg-ink/40 p-0 sm:place-items-center sm:p-4" data-testid="step-up">
      <div className="card w-full max-w-md rounded-b-none p-6 sm:rounded-b-lg rise">
        <div className="flex items-center gap-3"><span className="grid size-10 place-items-center rounded-pill bg-brand-50 text-brand-600"><ShieldCheck className="size-5" /></span><div><h2 className="font-display text-xl font-bold">{title}</h2><p className="text-sm text-ink-2">Enter the code sent to {phone ? phone.replace(/^\+91/, "+91 ") : "your mobile"}.</p></div></div>
        {err && <Alert status="danger" className="mt-4"><Alert.Indicator /><Alert.Content><Alert.Title>{err}</Alert.Title></Alert.Content></Alert>}
        <form className="mt-5 grid gap-4" onSubmit={(e) => { e.preventDefault(); verify(); }}>
          <InputOTP maxLength={6} value={code} onChange={(v) => { setCode(v); if (v.length === 6) verify(v); }} autoFocus aria-label="One-time code">
            <InputOTP.Group>{[0, 1, 2, 3, 4, 5].map((i) => <InputOTP.Slot key={i} index={i} />)}</InputOTP.Group>
          </InputOTP>
          <div className="flex gap-2"><Button type="button" variant="outline" size="lg" className="flex-1" onPress={onCancel} isDisabled={busy}>Cancel</Button><Button type="submit" size="lg" className="cta flex-1" isDisabled={code.length !== 6 || busy} isPending={busy}>Confirm</Button></div>
        </form>
      </div>
    </div>
  );
}
