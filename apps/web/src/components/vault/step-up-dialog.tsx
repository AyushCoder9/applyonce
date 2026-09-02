"use client";
/**
 * StepUpDialog — re-authenticate (OTP → mock 123456, or passkey) and mark the session stepped-up for 5 min.
 * Other WPs: `const { stepUp, dialog } = useStepUp(locale); if (await stepUp()) …; return <>{dialog}…</>`.
 */
import { useCallback, useEffect, useRef, useState } from "react";
import { Button, Modal, InputOTP, Alert } from "@heroui/react";
import { Fingerprint, ShieldCheck } from "lucide-react";
import { authClient, useSession } from "@/lib/auth-client";
import { api, tr, type Locale } from "./i18n";

export interface StepUpDialogProps { open: boolean; onOpenChange: (o: boolean) => void; onDone: (ok: boolean) => void; locale?: Locale; reason?: string }

export function StepUpDialog({ open, onOpenChange, onDone, locale = "en", reason }: StepUpDialogProps) {
  const { data } = useSession();
  const phone = (data?.user as { phoneNumber?: string | null } | undefined)?.phoneNumber ?? "";
  const [code, setCode] = useState("");
  const [busy, setBusy] = useState(false);
  const [sent, setSent] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const mock = process.env.NEXT_PUBLIC_MOCK_OTP !== "0";

  const send = useCallback(async () => {
    if (!phone) return;
    const r = await authClient.phoneNumber.sendOtp({ phoneNumber: phone });
    if (r.error) setErr(r.error.message ?? "Could not send OTP"); else setSent(true);
  }, [phone]);
  useEffect(() => { if (open) { setCode(""); setErr(null); setSent(false); void send(); } }, [open, send]);

  const finish = (ok: boolean) => { onDone(ok); onOpenChange(false); };
  const verify = async (c = code) => {
    if (c.length !== 6) return;
    setBusy(true); setErr(null);
    try { await api("/auth/step-up", { method: "POST", json: { method: "otp", code: c } }); finish(true); }
    catch (e) { setErr((e as Error).message); setCode(""); }
    finally { setBusy(false); }
  };
  const passkey = async () => {
    setBusy(true); setErr(null);
    try {
      const r = await authClient.signIn.passkey();
      if (r?.error) throw new Error(tr(locale, "Passkey failed. Use the OTP instead.", "पासकी विफल। OTP इस्तेमाल करें।"));
      await api("/auth/step-up", { method: "POST", json: { method: "passkey" } });
      finish(true);
    } catch (e) { setErr((e as Error).message); }
    finally { setBusy(false); }
  };

  return (
    <Modal isOpen={open} onOpenChange={(o) => { if (!o) finish(false); else onOpenChange(o); }}>
      <Modal.Backdrop variant="blur">
        <Modal.Container size="sm" placement="auto">
          <Modal.Dialog data-testid="step-up-dialog">
            <Modal.CloseTrigger />
            <Modal.Header>
              <div className="flex items-center gap-2 text-brand-600"><ShieldCheck className="size-5" /><Modal.Heading>{tr(locale, "Confirm it’s you", "पुष्टि करें कि यह आप हैं")}</Modal.Heading></div>
            </Modal.Header>
            <Modal.Body className="grid gap-4">
              <p className="text-ink-2">{reason ?? tr(locale, "This action reveals or shares sensitive data. It stays unlocked for 5 minutes.", "यह कार्रवाई संवेदनशील डेटा दिखाती या साझा करती है। 5 मिनट तक अनलॉक रहेगा।")}</p>
              {mock && <Alert status="accent"><Alert.Indicator /><Alert.Content><Alert.Title>{tr(locale, "Demo: OTP is 123456", "डेमो: OTP है 123456")}</Alert.Title></Alert.Content></Alert>}
              {err && <Alert status="danger"><Alert.Indicator /><Alert.Content><Alert.Title>{err}</Alert.Title></Alert.Content></Alert>}
              <div className="grid gap-2">
                <div className="text-sm text-ink-2">{sent ? tr(locale, `Code sent to ${phone}`, `${phone} पर कोड भेजा गया`) : tr(locale, "Sending code…", "कोड भेज रहे हैं…")}</div>
                <InputOTP maxLength={6} value={code} onChange={(v) => { setCode(v); if (v.length === 6) void verify(v); }} autoFocus aria-label="One-time code" isDisabled={busy}>
                  <InputOTP.Group>{[0, 1, 2, 3, 4, 5].map((i) => <InputOTP.Slot key={i} index={i} />)}</InputOTP.Group>
                </InputOTP>
                <button type="button" className="justify-self-start text-sm text-brand-600 underline" onClick={send} disabled={busy}>{tr(locale, "Resend code", "कोड फिर भेजें")}</button>
              </div>
            </Modal.Body>
            <Modal.Footer className="grid gap-2 sm:grid-cols-2">
              <Button variant="outline" size="lg" onPress={passkey} isDisabled={busy}><Fingerprint className="size-5" />{tr(locale, "Use passkey", "पासकी इस्तेमाल करें")}</Button>
              <Button size="lg" className="cta" onPress={() => verify()} isDisabled={code.length !== 6 || busy} isPending={busy}>{tr(locale, "Confirm", "पुष्टि करें")}</Button>
            </Modal.Footer>
          </Modal.Dialog>
        </Modal.Container>
      </Modal.Backdrop>
    </Modal>
  );
}

/** Imperative helper: `const ok = await stepUp()` opens the dialog and resolves with the outcome. */
export function useStepUp(locale: Locale = "en", reason?: string) {
  const [open, setOpen] = useState(false);
  const resolver = useRef<((ok: boolean) => void) | null>(null);
  const stepUp = useCallback(() => new Promise<boolean>((resolve) => { resolver.current = resolve; setOpen(true); }), []);
  const dialog = <StepUpDialog open={open} onOpenChange={setOpen} locale={locale} reason={reason} onDone={(ok) => { resolver.current?.(ok); resolver.current = null; }} />;
  return { stepUp, dialog, open };
}
