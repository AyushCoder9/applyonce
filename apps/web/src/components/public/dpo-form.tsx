"use client";
import { useActionState } from "react";
import Link from "next/link";
import { Alert } from "@heroui/react";
import { submitDpoRequest, type DpoState } from "@/app/(public)/dpo/actions";
const inp = "w-full rounded-md border border-line bg-surface px-3 py-2.5 text-[15px]";
export function DpoForm({ loggedIn, name }: { loggedIn: boolean; name?: string }) {
  const [state, action, pending] = useActionState<DpoState, FormData>(submitDpoRequest, { ok: false });
  if (!loggedIn) return <div className="card p-6"><h2 className="font-display text-xl font-bold">Log in to raise a request</h2><p className="mt-2 text-ink-2">We verify it's you (same mobile as your account) before touching your data. No account? Email <a className="underline" href="mailto:dpo@praman.in">dpo@praman.in</a>.</p><Link href="/auth/login?next=/dpo" className="cta mt-4 inline-flex px-5 py-2.5">Log in with OTP</Link></div>;
  if (state.ok) return <Alert status="success"><Alert.Indicator /><Alert.Content><Alert.Title>Request received · ref {state.id?.slice(0, 8)}</Alert.Title><Alert.Description>We respond within 30 days, usually much sooner. Track it under <Link href="/app/settings?tab=privacy" className="underline">Settings → Privacy & data</Link>.</Alert.Description></Alert.Content></Alert>;
  return (
    <form action={action} className="card grid gap-4 p-6">
      <p className="text-ink-2">Raising as <b className="text-ink">{name}</b>. Pick what you need:</p>
      <div className="grid gap-2 sm:grid-cols-3">{[["export", "Access / download", "A copy of everything we hold."], ["correct", "Correction", "Fix a value we got wrong."], ["erase", "Erasure", "Delete my account (30-day grace)."]].map(([v, t, d]) => <label key={v} className="cursor-pointer rounded-md border border-line p-3 has-checked:border-brand-500 has-checked:bg-brand-50"><input type="radio" name="kind" value={v} defaultChecked={v === "export"} className="mr-2" /><b>{t}</b><div className="text-xs text-ink-2">{d}</div></label>)}</div>
      <label className="grid gap-1"><span className="text-sm font-medium">Details (optional)</span><textarea name="notes" rows={3} maxLength={1000} className={inp} placeholder="Which field, which document, what's wrong…" /></label>
      {state.error && <p role="alert" className="text-sm text-danger-500">{state.error}</p>}
      <button type="submit" disabled={pending} className="cta px-5 py-2.5 disabled:opacity-60">{pending ? "Sending…" : "Send request"}</button>
      <p className="text-xs text-ink-3">Not satisfied with our answer? Escalate to the Data Protection Board of India. We'll include the reference in our reply.</p>
    </form>
  );
}
