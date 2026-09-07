"use client";
import { useState } from 'react';
import Link from 'next/link';
import { ArrowRight, CheckCircle2, ShieldCheck, Sparkles, AlertTriangle, Clock3 } from 'lucide-react';
import { Button } from '@heroui/react';
import { SourceChip } from '@applyonce/ui';
import { buildReadinessGuide, type ReadinessIntent, type ReadinessReport } from '@applyonce/schema';

const names = { verified:'Verified evidence', self:'Self-declared', extracted:'Review document source', missing:'Needs an answer', expired:'Evidence expired', conflict:'Sources disagree', blocked:'Outside allowed scope' };
export function ReadinessPanel({ report, formId, profileId, aiEnabled, locale = 'en' }: { report: ReadinessReport; formId: string; profileId: string; aiEnabled: boolean; locale?: 'en'|'hi' }) {
  const [advice, setAdvice] = useState<{ mode: string; summary: string; steps: string[] } | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  async function explain(intent: ReadinessIntent) {
    if (!aiEnabled) {
      setError('');
      setAdvice({ mode: 'Local evidence guide · instant', ...buildReadinessGuide(report, intent, locale) });
      return;
    }
    setBusy(true); setError('');
    try {
      const response = await fetch('/api/v1/readiness', {method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({formId,profileId,intent,locale})});
      const result = await response.json();
      if (!response.ok || !result.ok) throw new Error(result.error?.message ?? 'Could not load guidance. Please try again.');
      setAdvice(result.data);
    } catch (e) { setError((e as Error).message); } finally { setBusy(false); }
  }
  return <div className="grid gap-5" data-testid="readiness-panel">
    <section className="card overflow-hidden">
      <div className="grid gap-6 p-6 sm:grid-cols-[1fr_auto] sm:p-8">
        <div><p className="mb-3 flex items-center gap-2 text-xs font-semibold uppercase tracking-widest text-brand-700"><ShieldCheck className="size-4"/>Application readiness</p>
          <h2 className="font-display text-3xl font-bold tracking-tight">{report.closed ? 'This application has closed.' : report.canSubmit ? 'Your evidence is ready.' : 'Catch the gaps. Before you apply.'}</h2>
          <p className="mt-3 max-w-xl text-ink-2">{report.ready} of {report.required} required fields are ready. {report.verified} fields have a verified source. You review every field before sharing.</p>
          <p className="mt-3 text-xs text-ink-3">Readiness checks completeness and evidence. It is not an eligibility or admission decision.</p>
        </div>
        <div className="flex items-center gap-4 sm:block sm:text-right"><span className="font-display text-6xl font-bold tracking-tighter text-brand-700" data-testid="readiness-percent">{report.percent}<span className="text-2xl">%</span></span><p className="text-sm text-ink-2">required fields ready</p></div>
      </div>
      <div role="progressbar" aria-label="Required fields ready" aria-valuenow={report.percent} aria-valuemin={0} aria-valuemax={100} className="h-2 bg-surface-2"><div className="h-full bg-brand-500 transition-all" style={{width:`${report.percent}%`}}/></div>
    </section>
    <div className="grid gap-5 lg:grid-cols-[3fr_2fr]">
      <section className="card p-5 sm:p-6"><div className="mb-4 flex items-center justify-between gap-2"><h3 className="font-display text-xl font-bold">Your next moves</h3><span className="text-xs text-ink-3">{report.blockers.length} to resolve</span></div>
        {report.blockers.length ? <ol className="divide-y divide-line">{report.blockers.map((c,i) => <li key={c.key} className="flex items-start gap-3 py-3"><span className="mt-0.5 grid size-6 shrink-0 place-items-center rounded-full bg-pending-50 text-xs font-semibold text-pending-700">{i+1}</span><div className="min-w-0 flex-1"><p className="font-medium">{c.label[locale]}</p><p className="mt-0.5 text-sm text-ink-2">{names[c.status]}</p></div><Link href={c.href} className="inline-flex min-h-10 shrink-0 items-center gap-1 text-sm font-semibold text-brand-700" aria-label={`Fix ${c.label[locale]}`}>Fix<ArrowRight className="size-4"/></Link></li>)}</ol> : <div className="flex items-start gap-3 rounded-lg bg-verified-50 p-4 text-verified-700"><CheckCircle2 className="size-5 shrink-0"/><p>Required fields are complete. Continue to choose what you share and approve with your OTP or passkey.</p></div>}
        {report.expiring.length > 0 && <div className="mt-4 rounded-lg bg-pending-50 p-4 text-sm text-pending-700"><p className="flex items-center gap-2 font-semibold"><Clock3 className="size-4"/>Keep an eye on expiry</p>{report.expiring.map(c => <p key={c.key} className="mt-2">{c.label[locale]} · {c.expiresInDays} days remaining</p>)}<Link href="/app/verify" className="mt-3 inline-block font-semibold underline">Review evidence</Link></div>}
      </section>
      <aside className="card flex flex-col p-5 sm:p-6"><div className="flex items-center gap-2"><Sparkles className="size-5 text-brand-600"/><h3 className="font-display text-xl font-bold">Ask ApplyOnce</h3></div><p className="mt-2 text-sm text-ink-2">A clear explanation, grounded in this form’s evidence checks.</p><p className="mt-2 text-xs font-medium text-brand-700">{aiEnabled ? 'AI explanations available' : 'Local guide · works without an AI key'}</p>
        <div className="mt-4 flex flex-wrap gap-2">{([['next','What should I do first?'],['privacy','What will be shared?'],['trust','What does verified mean?']] as const).map(([intent,label])=><Button key={intent} variant="outline" size="sm" isDisabled={busy} onPress={()=>explain(intent)}>{label}</Button>)}</div>
        <div aria-live="polite" className="mt-4">{busy && <p className="text-sm text-ink-2">Checking the evidence…</p>}{error && <p role="alert" className="text-sm text-danger-500">{error}</p>}{advice && <div className="rounded-lg bg-surface-2 p-4"><p className="mb-2 text-xs font-semibold text-ink-3">{advice.mode}</p><p className="text-sm leading-relaxed">{advice.summary}</p><ol className="mt-3 list-inside list-decimal space-y-2 text-sm text-ink-2">{advice.steps.map((step,i)=><li key={i}>{step}</li>)}</ol></div>}</div>
        <p className="mt-auto pt-5 text-xs leading-relaxed text-ink-3">{aiEnabled ? 'Only field labels and check results are sent for explanations. Names, values and documents stay out of the prompt.' : 'All checks and guidance run locally. No profile data is sent to an AI provider.'} Guidance cannot change evidence or submit an application.</p>
      </aside>
    </div>
    <details className="card p-5"><summary className="cursor-pointer font-semibold">Evidence behind the score · {report.requested} fields</summary><ul className="mt-4 divide-y divide-line">{report.checks.map(c=><li key={c.key} className="flex flex-wrap items-center justify-between gap-3 py-3 text-sm"><span className="font-medium">{c.label[locale]}{c.required ? ' *' : ' · optional'}</span><span className="flex flex-wrap items-center gap-2"><span className={['expired','conflict','blocked'].includes(c.status)?'text-danger-500':'text-ink-2'}>{names[c.status]}</span>{c.source && <SourceChip source={c.source} verifiedBy={c.verifiedBy}/>}</span></li>)}</ul></details>
  </div>;
}
