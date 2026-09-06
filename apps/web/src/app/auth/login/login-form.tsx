"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button, TextField, Label, Input, Description, FieldError, InputOTP, Alert } from "@heroui/react";
import { Fingerprint } from "lucide-react";
import { authClient } from "@/lib/auth-client";

export function LoginForm({ next, mode, mock }: { next: string; mode: "login" | "register"; mock: boolean }) {
  const router = useRouter();
  const [phone, setPhone] = useState("");
  const [code, setCode] = useState("");
  const [step, setStep] = useState<"phone" | "otp">("phone");
  const [err, setErr] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const valid = /^[6-9]\d{9}$/.test(phone);
  const e164 = `+91${phone}`;

  const sendOtp = async () => {
    setErr(null); setBusy(true);
    const r = await authClient.phoneNumber.sendOtp({ phoneNumber: e164 });
    setBusy(false);
    if (r.error) return setErr(r.error.message ?? "Could not send OTP. Try again in a minute.");
    setStep("otp");
  };
  const verify = async (c = code) => {
    if (c.length !== 6) return;
    setErr(null); setBusy(true);
    const r = await authClient.phoneNumber.verify({ phoneNumber: e164, code: c, disableSession: false });
    setBusy(false);
    if (r.error) return setErr(r.error.message ?? "Wrong OTP. Check and try again.");
    router.push(next); router.refresh();
  };
  const passkey = async () => {
    setErr(null); setBusy(true);
    const r = await authClient.signIn.passkey();
    setBusy(false);
    if (r?.error) return setErr("Passkey sign-in failed. Use OTP instead.");
    router.push(next); router.refresh();
  };

  return (
    <div className="card p-6 sm:p-8">
      <h1 className="text-2xl font-bold">{mode === "register" ? "Create your ApplyOnce" : "Welcome back"}</h1>
      <p className="mt-1 text-ink-2">{step === "phone" ? "We’ll send a one-time code to your mobile." : `Enter the 6-digit code sent to +91 ${phone}.`}</p>
      {mock && <Alert status="accent" className="mt-4"><Alert.Indicator /><Alert.Content><Alert.Title>Demo mode</Alert.Title><Alert.Description>Any Indian mobile works. OTP is <b>123456</b>. Try 9876543210 (Aarav, student) or 9876500002 (Sunita, parent).</Alert.Description></Alert.Content></Alert>}
      {err && <Alert status="danger" className="mt-4"><Alert.Indicator /><Alert.Content><Alert.Title>{err}</Alert.Title></Alert.Content></Alert>}
      {step === "phone" ? (
        <form className="mt-6 grid gap-4" onSubmit={(e) => { e.preventDefault(); if (valid) sendOtp(); }}>
          <TextField name="phone" type="tel" inputMode="numeric" isInvalid={phone.length > 0 && !valid} value={phone} onChange={(v) => setPhone(v.replace(/\D/g, "").slice(0, 10))} isRequired autoFocus>
            <Label>Mobile number</Label>
            <div className="flex items-center gap-2"><span className="rounded-md border border-line bg-surface-2 px-3 py-2.5 text-ink-2">+91</span><Input placeholder="10-digit mobile" className="flex-1" /></div>
            <Description>Same number as your Aadhaar makes verification faster.</Description>
            <FieldError>Enter a valid 10-digit Indian mobile number</FieldError>
          </TextField>
          <Button type="submit" size="lg" className="cta" isDisabled={!valid || busy} isPending={busy}>Send OTP</Button>
          <Button type="button" variant="outline" size="lg" onPress={passkey} isDisabled={busy}><Fingerprint className="size-5" />Sign in with passkey</Button>
        </form>
      ) : (
        <form className="mt-6 grid gap-4" onSubmit={(e) => { e.preventDefault(); verify(); }}>
          <InputOTP maxLength={6} value={code} onChange={(v) => { setCode(v); if (v.length === 6) verify(v); }} autoFocus aria-label="One-time code">
            <InputOTP.Group>{[0, 1, 2, 3, 4, 5].map((i) => <InputOTP.Slot key={i} index={i} />)}</InputOTP.Group>
          </InputOTP>
          <Button type="submit" size="lg" className="cta" isDisabled={code.length !== 6 || busy} isPending={busy}>Verify & continue</Button>
          <div className="flex justify-between text-sm"><button type="button" className="text-brand-600 underline" onClick={() => setStep("phone")}>Change number</button><button type="button" className="text-brand-600 underline" onClick={sendOtp} disabled={busy}>Resend code</button></div>
        </form>
      )}
      <p className="mt-6 text-xs text-ink-3">By continuing you agree to the <a href="/terms" className="underline">Terms</a> and <a href="/privacy" className="underline">Privacy notice</a>. Your data is encrypted and shared only with your consent.</p>
    </div>
  );
}
