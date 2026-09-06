"use client";
/** /app/verify body — provider cards with live job progress (SSE), mismatch fix flow, expiry calendar. */
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Button, Chip, ProgressBar, toast } from "@heroui/react";
import { ShieldCheck, CreditCard, HeartPulse, Landmark, PenTool, RotateCw, Check, AlertTriangle, CalendarClock, Loader2 } from "lucide-react";
import type { Fact } from "@praman/schema";
import { PanInput, SourceChip, fmtDate, daysUntil, label, verifierName, cx } from "@praman/ui";
import { api, tr, type Locale } from "./i18n";
import { useEvents, type JobEvent } from "./use-events";

export type LinkRow = { provider: string; status: string; lastSyncAt?: string | null; linkedAt?: string | null; meta?: Record<string, unknown> | null };
export type Mismatch = { id: string; factKey: string; sourceA: string; valueA: string; sourceB: string; valueB: string; severity: string; createdAt: string };
type Job = JobEvent & { createdAt?: string };

const PROVIDERS = [
  { id: "digilocker", icon: ShieldCheck, en: "DigiLocker", hi: "डिजिलॉकर", blurbEn: "Aadhaar, PAN, marksheets and certificates — straight from the issuers.", blurbHi: "आधार, पैन, मार्कशीट और प्रमाण पत्र — सीधे जारीकर्ताओं से।" },
  { id: "pan", icon: CreditCard, en: "PAN", hi: "पैन", blurbEn: "Checks your PAN with the Income Tax Department and matches the name.", blurbHi: "आयकर विभाग से पैन जाँचता है और नाम मिलाता है।" },
  { id: "abha", icon: HeartPulse, en: "ABHA (health ID)", hi: "आभा (स्वास्थ्य आईडी)", blurbEn: "Links your ABHA number and blood group for hospital and scheme forms.", blurbHi: "अस्पताल और योजना फ़ॉर्म के लिए आभा नंबर व रक्त समूह जोड़ता है।" },
  { id: "aa", icon: Landmark, en: "Account Aggregator", hi: "अकाउंट एग्रीगेटर", blurbEn: "Verifies family income from bank statements for scholarships (RBI-regulated consent).", blurbHi: "छात्रवृत्ति हेतु बैंक स्टेटमेंट से आय सत्यापित करता है (RBI-नियंत्रित सहमति)।" },
  { id: "esign", icon: PenTool, en: "e-Sign", hi: "ई-साइन", blurbEn: "Sign declarations with Aadhaar e-Sign. Create an OTP-confirmed sandbox declaration receipt.", blurbHi: "आधार ई-साइन से घोषणाएँ हस्ताक्षरित करें। सैंडबॉक्स घोषणा रसीद बनाएँ।" },
] as const;

export function VerifyHub({ profileId, links, jobs: initialJobs, mismatches, expiring, locale = "en", focusJobId, error }: { profileId: string; links: LinkRow[]; jobs: Job[]; mismatches: Mismatch[]; expiring: Fact[]; locale?: Locale; focusJobId?: string | null; error?: string | null }) {
  const router = useRouter();
  const [jobs, setJobs] = useState<Record<string, Job>>(() => Object.fromEntries(initialJobs.map((j) => [j.id, j])));
  const [busy, setBusy] = useState<string | null>(null);
  const [pan, setPan] = useState("");
  useEffect(() => { if (error) toast.danger(tr(locale, "Connection cancelled", "कनेक्शन रद्द"), { description: error.replace(/_/g, " ") }); }, [error, locale]);
  useEvents({
    onJob: (j) => { setJobs((m) => ({ ...m, [j.id]: { ...m[j.id], ...j } })); if (j.status === "succeeded") { toast.success(tr(locale, "Verification complete", "सत्यापन पूर्ण"), { description: j.progress?.step }); router.refresh(); } if (j.status === "failed") toast.danger(tr(locale, "Verification failed", "सत्यापन विफल"), { description: j.error ?? undefined }); },
  });
  const linkOf = (p: string) => links.find((l) => l.provider === p);
  const activeJob = (p: string) => Object.values(jobs).filter((j) => j.provider === p && j.profileId === profileId).sort((a, b) => (b.createdAt ?? "").localeCompare(a.createdAt ?? ""))[0];
  const go = async (path: string, key: string) => {
    setBusy(key);
    try { const r = await api<{ url: string }>(path, { method: "POST", json: { next: "/app/verify" } }); window.location.href = r.url; }
    catch (e) { toast.danger((e as Error).message); setBusy(null); }
  };
  const sync = async () => {
    setBusy("digilocker");
    try { const r = await api<{ jobId: string }>("/providers/digilocker/sync", { method: "POST", json: {} }); setJobs((m) => ({ ...m, [r.jobId]: { id: r.jobId, profileId, provider: "digilocker", kind: "sync", status: "queued", progress: { step: "Queued", pct: 0, log: [] }, createdAt: new Date().toISOString() } })); toast.info(tr(locale, "Re-fetching from DigiLocker…", "DigiLocker से फिर ला रहे हैं…")); }
    catch (e) { toast.danger((e as Error).message); }
    finally { setBusy(null); }
  };
  const verifyPan = async () => {
    setBusy("pan");
    try { const r = await api<{ jobId: string }>("/providers/pan/verify", { method: "POST", json: { pan } }); setJobs((m) => ({ ...m, [r.jobId]: { id: r.jobId, profileId, provider: "pan", kind: "verify_pan", status: "queued", progress: { step: "Queued", pct: 0, log: [] }, createdAt: new Date().toISOString() } })); setPan(""); }
    catch (e) { toast.danger((e as Error).message); }
    finally { setBusy(null); }
  };
  const resolve = async (m: Mismatch, keep: "a" | "b") => {
    setBusy(m.id);
    try { await api(`/profiles/${profileId}/mismatches/${m.id}/resolve`, { method: "POST", json: { keep } }); toast.success(keep === "a" ? tr(locale, "Kept the verified value", "सत्यापित मान रखा") : tr(locale, "Re-verification requested; the verified value is unchanged", "आपका मान रखा — जल्द पुनः सत्यापित करें")); router.refresh(); }
    catch (e) { toast.danger((e as Error).message); }
    finally { setBusy(null); }
  };

  return (
    <div className="grid gap-8">
      <section className="grid gap-3 md:grid-cols-2" data-testid="provider-cards">
        {PROVIDERS.map((p) => {
          const link = linkOf(p.id), job = activeJob(p.id), running = job && (job.status === "queued" || job.status === "running"), I = p.icon;
          const linked = link?.status === "linked";
          return (
            <article key={p.id} className={cx("card flex flex-col gap-3 p-5", focusJobId && job?.id === focusJobId && "ring-2 ring-brand-500/40")} data-provider={p.id}>
              <div className="flex items-start gap-3">
                <span className={cx("grid size-11 shrink-0 place-items-center rounded-md", linked ? "bg-verified-50 text-verified-700" : "bg-brand-50 text-brand-600")}><I className="size-6" strokeWidth={1.75} /></span>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2"><h3 className="font-display text-lg font-bold">{locale === "hi" ? p.hi : p.en}</h3>
                    {linked ? <Chip size="sm" color="success" variant="soft"><span className="inline-flex items-center gap-1"><Check className="size-3.5" />{tr(locale, "Connected", "जुड़ा")}</span></Chip> : p.id === "esign" ? <Chip size="sm" variant="soft">{tr(locale, "Sandbox", "सैंडबॉक्स")}</Chip> : <Chip size="sm" color="warning" variant="soft">{tr(locale, "Not connected", "नहीं जुड़ा")}</Chip>}</div>
                  <p className="mt-0.5 text-sm text-ink-2">{locale === "hi" ? p.blurbHi : p.blurbEn}</p>
                  {linked && link?.lastSyncAt && <p className="mt-1 text-xs text-ink-3">{tr(locale, "Last sync", "अंतिम सिंक")} {fmtDate(link.lastSyncAt, locale)}</p>}
                </div>
              </div>
              {job && (running || job.status === "failed" || (focusJobId === job.id)) && (
                <div className="rounded-md bg-surface-2 p-3 text-sm" data-testid="job-progress" data-status={job.status}>
                  <div className="flex items-center gap-2">{running ? <Loader2 className="size-4 animate-spin text-brand-600" /> : job.status === "failed" ? <AlertTriangle className="size-4 text-danger-500" /> : <Check className="size-4 text-verified-700" />}<span className="font-medium">{job.progress?.step ?? job.status}</span><span className="ml-auto tabular text-ink-3">{job.progress?.pct ?? 0}%</span></div>
                  {running && <ProgressBar value={job.progress?.pct ?? 0} color="accent" aria-label="Progress" className="mt-2" />}
                  {job.progress?.log && job.progress.log.length > 1 && <ul className="mt-2 grid gap-0.5 text-xs text-ink-2">{job.progress.log.slice(-4).map((l, i) => <li key={i} className="rise">· {l}</li>)}</ul>}
                  {job.error && <p className="mt-1 text-xs text-danger-500">{job.error}</p>}
                </div>
              )}
              <div className="mt-auto flex flex-wrap items-center gap-2">
                {p.id === "digilocker" && (linked
                  ? <Button variant="outline" onPress={sync} isDisabled={!!running || busy === "digilocker"} isPending={busy === "digilocker"}><RotateCw className="size-4" />{tr(locale, "Re-sync", "फिर सिंक करें")}</Button>
                  : <Button className="cta" onPress={() => go("/providers/digilocker/start", "digilocker")} isPending={busy === "digilocker"} data-testid="connect-digilocker">{tr(locale, "Connect DigiLocker", "DigiLocker जोड़ें")}</Button>)}
                {p.id === "pan" && (
                  <div className="grid w-full gap-2 sm:grid-cols-[1fr_auto] sm:items-end">
                    <PanInput label={linked ? tr(locale, "Verify another PAN", "अन्य पैन सत्यापित करें") : tr(locale, "PAN number", "पैन नंबर")} value={pan} onChange={setPan} locale={locale} />
                    <Button variant={linked ? "outline" : "primary"} onPress={verifyPan} isDisabled={!/^[A-Z]{5}\d{4}[A-Z]$/.test(pan) || !!running} isPending={busy === "pan"}>{tr(locale, "Verify", "सत्यापित करें")}</Button>
                  </div>
                )}
                {p.id === "abha" && <Button variant="outline" onPress={() => go("/providers/abha/link", "abha")} isPending={busy === "abha"} isDisabled={!!running}>{linked ? tr(locale, "Re-link", "फिर जोड़ें") : tr(locale, "Link ABHA", "आभा जोड़ें")}</Button>}
                {p.id === "aa" && <Button variant="outline" onPress={() => go("/providers/aa/consent", "aa")} isPending={busy === "aa"} isDisabled={!!running}>{linked ? tr(locale, "Refresh income", "आय ताज़ा करें") : tr(locale, "Give consent", "सहमति दें")}</Button>}
                {p.id === "esign" && <a href="/app/sign" className="rounded-md border border-line px-4 py-2 text-sm font-semibold">{tr(locale,"Create a declaration","घोषणा बनाएँ")}</a>}
              </div>
            </article>
          );
        })}
      </section>

      <section id="mismatches" className="scroll-mt-20" data-testid="mismatches">
        <h2 className="mb-1 font-display text-xl font-bold">{tr(locale, "Mismatches", "बेमेल")}</h2>
        <p className="mb-3 text-sm text-ink-2">{tr(locale, "Where your entry differs from an issuer’s record. Partners usually reject on name and date-of-birth mismatches, so fix these first.", "जहाँ आपकी प्रविष्टि जारीकर्ता के रिकॉर्ड से अलग है। नाम और जन्म तिथि के बेमेल पर साझेदार अक्सर अस्वीकार करते हैं — पहले ये ठीक करें।")}</p>
        {mismatches.length === 0 ? <div className="card flex items-center gap-3 p-5 text-ink-2"><Check className="size-5 text-verified-700" />{tr(locale, "No open mismatches.", "कोई खुला बेमेल नहीं।")}</div> : (
          <ul className="grid gap-3">{mismatches.map((m) => (
            <li key={m.id} className={cx("card p-5", m.severity === "high" && "border-danger-500/30")}>
              <div className="flex flex-wrap items-center gap-2"><AlertTriangle className={cx("size-5", m.severity === "high" ? "text-danger-500" : "text-pending-700")} /><span className="font-semibold">{label(m.factKey, locale)}</span><Chip size="sm" variant="soft" color={m.severity === "high" ? "danger" : "warning"}>{m.severity}</Chip><span className="ml-auto text-xs text-ink-3">{fmtDate(m.createdAt, locale)}</span></div>
              <div className="mt-3 grid gap-2 sm:grid-cols-2">
                <div className="rounded-md border border-verified-500/40 bg-verified-50 p-3"><div className="text-xs text-ink-3">{tr(locale, "Issuer says", "जारीकर्ता के अनुसार")} · {verifierName(m.sourceA) || m.sourceA}</div><div className="font-medium">{m.valueA}</div></div>
                <div className="rounded-md border border-pending-500/40 bg-pending-50 p-3"><div className="text-xs text-ink-3">{tr(locale, "You entered", "आपने लिखा")} · {m.sourceB.replace("_", " ")}</div><div className="font-medium">{m.valueB}</div></div>
              </div>
              <div className="mt-3 flex flex-wrap gap-2">
                <Button size="sm" onPress={() => resolve(m, "a")} isPending={busy === m.id}>{tr(locale, "Keep the verified value", "सत्यापित मान रखें")}</Button>
                <Button size="sm" variant="outline" onPress={() => resolve(m, "b")} isDisabled={busy === m.id}>{tr(locale, "Mine is right — re-verify", "मेरा सही है — पुनः सत्यापित करें")}</Button>
              </div>
            </li>
          ))}</ul>
        )}
      </section>

      <section id="expiry" className="scroll-mt-20" data-testid="expiry">
        <h2 className="mb-1 font-display text-xl font-bold">{tr(locale, "Expiry calendar", "समाप्ति कैलेंडर")}</h2>
        <p className="mb-3 text-sm text-ink-2">{tr(locale, "Certificates with a validity date. We remind you 60, 30 and 7 days before.", "वैधता तिथि वाले प्रमाण पत्र। हम 60, 30 और 7 दिन पहले याद दिलाते हैं।")}</p>
        {expiring.length === 0 ? <div className="card p-5 text-ink-2">{tr(locale, "Nothing with an expiry date yet.", "अभी कोई समाप्ति तिथि वाला मान नहीं।")}</div> : (
          <ul className="card divide-y divide-line">{expiring.map((f) => { const d = daysUntil(f.expiresAt) ?? 0; return (
            <li key={`${f.key}:${f.repeatIndex}`} className="flex flex-wrap items-center gap-3 px-5 py-3">
              <span className={cx("grid min-w-16 place-items-center rounded-md px-2 py-1 text-center text-xs font-bold", d < 0 ? "bg-danger-50 text-danger-500" : d <= 60 ? "bg-pending-50 text-pending-700" : "bg-surface-2 text-ink-2")}><CalendarClock className="mb-0.5 size-3.5" />{d < 0 ? tr(locale, "Expired", "समाप्त") : `${d}d`}</span>
              <span className="min-w-0 flex-1"><span className="block font-medium">{label(f.key, locale)}</span><span className="text-sm text-ink-2">{fmtDate(f.expiresAt, locale)}</span></span>
              <SourceChip source={f.source} verifiedBy={f.verifiedBy} expiresAt={f.expiresAt} locale={locale} />
              {linkOf("digilocker") && d <= 60 && <Button size="sm" variant="outline" onPress={sync} isDisabled={busy === "digilocker"}><RotateCw className="size-4" />{tr(locale, "Re-fetch from DigiLocker", "DigiLocker से फिर लाएँ")}</Button>}
            </li>
          ); })}</ul>
        )}
      </section>
    </div>
  );
}
