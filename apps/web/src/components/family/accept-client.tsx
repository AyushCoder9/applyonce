"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button, Alert } from "@heroui/react";
import { ShieldCheck } from "lucide-react";
import { SECTION_META } from "@applyonce/schema";

/** Shared by /app/family/accept (invite) and /app/family/claim (handover). */
export function AcceptClient({ token, kind, guardianName, wardName, scope, phoneLast4, until }: { token: string; kind: "invite" | "claim"; guardianName: string; wardName: string; scope: string[]; phoneLast4: string; until: string | null }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [done, setDone] = useState(false);
  const go = async () => {
    setBusy(true); setErr(null);
    const r = await fetch("/api/v1/family/elder/accept", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ token }) });
    const j = await r.json().catch(() => ({}));
    setBusy(false);
    if (!r.ok) return setErr(j?.error?.message ?? "Could not accept.");
    setDone(true); router.refresh();
  };
  if (done) return <Alert status="success"><Alert.Indicator /><Alert.Content><Alert.Title>{kind === "claim" ? "This profile is yours now." : "Access granted."}</Alert.Title><Alert.Description>{kind === "claim" ? `${guardianName} keeps identity and education access for 90 days, then it ends.` : `${guardianName} can now help with: ${scope.map((s) => SECTION_META.find((m) => m.id === s)?.label.en ?? s).join(", ")}.`} <Link href="/app" className="underline">Go to Home</Link></Alert.Description></Alert.Content></Alert>;
  return (
    <div className="card grid gap-4 p-6">
      <h1 className="font-display text-2xl font-bold">{kind === "claim" ? `Claim your profile, ${wardName}` : `${guardianName} wants to help manage your profile`}</h1>
      {kind === "invite" && (
        <ul className="grid gap-2">{scope.map((s) => <li key={s} className="flex items-center gap-2 rounded-md border border-line px-3 py-2"><ShieldCheck className="size-4 text-brand-600" />{SECTION_META.find((m) => m.id === s)?.label.en ?? s}<span className="ml-auto text-xs text-ink-3">{SECTION_META.find((m) => m.id === s)?.blurb.en}</span></li>)}</ul>
      )}
      <p className="text-ink-2">{kind === "claim" ? "You turned 18. Your guardian created this profile; accepting makes it yours. Your guardian keeps read access to identity and education for 90 days." : `Valid ${until ? `until ${new Date(until).toLocaleDateString("en-IN")}` : "until you revoke it"}. You can withdraw any time from Family. Nothing is shared with anyone without your consent.`}</p>
      <p className="text-xs text-ink-3">Linked to the mobile ending {phoneLast4}. This is your DPDP consent record; every use is in your audit log.</p>
      {err && <Alert status="danger"><Alert.Indicator /><Alert.Content><Alert.Title>{err}</Alert.Title></Alert.Content></Alert>}
      <div className="flex gap-2"><Button className="cta" size="lg" onPress={go} isPending={busy}>{kind === "claim" ? "Claim profile" : "Allow"}</Button><Button variant="outline" size="lg" onPress={() => router.push("/app")}>Not now</Button></div>
    </div>
  );
}
