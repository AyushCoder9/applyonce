import { canShare } from './consent';
import { field, isFactKey } from './registry';
import type { Fact, Purpose } from './types';
import type { CustomField } from './payload';

export type ReadinessStatus = 'verified' | 'self' | 'extracted' | 'missing' | 'expired' | 'conflict' | 'blocked';
export type ReadinessIntent = 'next' | 'privacy' | 'trust';
export type ReadinessLocale = 'en' | 'hi';
export interface ReadinessForm { purpose: Purpose; requestedFields: { key: string; required: boolean }[]; deadlineAt?: Date | string | null }
export const hasValue = (value: unknown) => value != null && value !== '' && (!Array.isArray(value) || value.length > 0);
export const scopeContains = (scope: readonly string[], key: string) => scope.includes('*') || scope.includes(key.split('.')[0]!);

/** Deterministic evidence checks. No inference about eligibility, and no values in the result. */
export function assessReadiness(facts: Fact[], form: ReadinessForm, options: { scope?: string[]; conflicts?: string[]; now?: number } = {}) {
  const now = options.now ?? Date.now();
  const byKey = new Map(facts.filter(f => f.repeatIndex === 0).map(f => [f.key, f]));
  const scope = options.scope ?? ['*'];
  const checks = [...new Map(form.requestedFields.map(r => [r.key, r])).values()].map(r => {
    const def = isFactKey(r.key) ? field(r.key) : null;
    const fact = byKey.get(r.key);
    const days = fact?.expiresAt ? Math.ceil((Date.parse(fact.expiresAt) - now) / 864e5) : null;
    const status: ReadinessStatus = !def || def.system || !canShare(r.key, form.purpose) || !scopeContains(scope, r.key) ? 'blocked'
      : !fact || !hasValue(fact.value) ? 'missing'
      : options.conflicts?.includes(r.key) ? 'conflict'
      : fact.expiresAt && Date.parse(fact.expiresAt) <= now ? 'expired'
      : fact.source === 'issuer_verified' || fact.source === 'provider_verified' ? 'verified'
      : fact.source === 'document_extracted' ? 'extracted' : 'self';
    return { key: r.key, required: r.required, label: def?.label ?? { en: r.key, hi: r.key }, status,
      source: fact?.source ?? null, verifiedBy: fact?.verifiedBy ?? null, expiresInDays: days,
      href: status === 'expired' || status === 'conflict' ? '/app/verify' : def?.type === 'file_ref' ? '/app/documents?upload=1' : `/app/vault/${def?.section ?? 'identity'}` };
  });
  const required = checks.filter(c => c.required);
  const usable = (status: ReadinessStatus) => ['verified', 'self', 'extracted'].includes(status);
  const ready = required.filter(c => usable(c.status)).length;
  const blockers = required.filter(c => !usable(c.status));
  const closed = !!form.deadlineAt && +new Date(form.deadlineAt) <= now;
  return { checkedAt: new Date(now).toISOString(), required: required.length, ready, percent: required.length ? Math.round(ready / required.length * 100) : 100,
    verified: checks.filter(c => c.status === 'verified').length, requested: checks.length,
    expiring: checks.filter(c => c.expiresInDays != null && c.expiresInDays >= 0 && c.expiresInDays <= 30),
    blockers, checks, closed, canSubmit: !closed && blockers.length === 0 };
}

export type ReadinessReport = ReturnType<typeof assessReadiness>;
export interface ReadinessGuide { summary: string; steps: string[] }

/**
 * Deterministic, value-free guidance derived from the readiness report. This is
 * safe to run in the browser because the report contains labels and check
 * states, never profile values or document contents.
 */
export function buildReadinessGuide(report: ReadinessReport, intent: ReadinessIntent, locale: ReadinessLocale): ReadinessGuide {
  const hi = locale === 'hi';
  if (intent === 'privacy') return {
    summary: hi ? 'केवल आपकी चुनी गई जानकारी सहमति के बाद साझा होगी।' : 'Only the fields you approve are shared after fresh OTP or passkey confirmation.',
    steps: hi
      ? ['सहमति पृष्ठ पर उद्देश्य और अवधि पढ़ें।', 'वैकल्पिक जानकारी अनचेक करें।', 'Connections में साझा जानकारी देखें और सहमति वापस लें।']
      : ['Review purpose and retention on the consent screen.', 'Untick optional fields you want to keep private.', 'Use Connections to inspect your receipt or revoke access.'],
  };
  if (intent === 'trust') return {
    summary: hi ? 'सत्यापित स्रोत और स्वयं दी गई जानकारी अलग हैं।' : 'Verified means an issuer or provider supplied the fact. It does not mean AI judged it to be true.',
    steps: hi
      ? ['हर तथ्य का स्रोत देखें।', 'समाप्त या बेमेल प्रमाण ठीक करें।', 'डेमो प्रदाता नमूना डेटा देते हैं।']
      : ['Check the source shown beside each field.', 'Renew expired evidence and resolve conflicting values.', 'Sandbox providers return sample evidence; production requires provider access.'],
  };
  const actions: Record<Exclude<ReadinessStatus, 'verified' | 'self' | 'extracted'>, { en: string; hi: string }> = {
    missing: { en: 'add the missing answer', hi: 'जानकारी जोड़ें' },
    expired: { en: 'renew the evidence in Verify', hi: 'प्रमाण नया करें' },
    conflict: { en: 'resolve the mismatch in Verify', hi: 'बेमेल हल करें' },
    blocked: { en: 'ask the profile owner to apply', hi: 'प्रोफ़ाइल स्वामी से आवेदन करवाएँ' },
  };
  return {
    summary: hi
      ? `${report.required} में से ${report.ready} आवश्यक फ़ील्ड तैयार हैं।`
      : `${report.ready} of ${report.required} required fields are ready. ${report.closed ? 'The deadline has passed.' : report.blockers.length ? 'Start with the items below.' : 'Continue to review and approve the share.'}`,
    steps: report.blockers.length
      ? report.blockers.slice(0, 4).map((check) => `${check.label[locale]}: ${actions[check.status as keyof typeof actions][locale]}`)
      : [hi ? 'सहमति से पहले सभी जानकारी जाँचें।' : 'Review the evidence, choose optional fields, then confirm consent.'],
  };
}

/** Custom questions are validated server-side as well as in the form UI. */
export function customAnswerErrors(fields: CustomField[], answers: Record<string, unknown>) {
  const errors: Record<string, string> = {};
  for (const f of fields) {
    const value = answers[f.id];
    if (!hasValue(value)) { if (f.required) errors[f.id] = 'Required'; continue; }
    const valid = f.type === 'bool' ? typeof value === 'boolean' && (!f.required || value)
      : f.type === 'number' ? typeof value === 'number' && Number.isFinite(value)
      : f.type === 'enum' ? typeof value === 'string' && !!f.options?.includes(value)
      : f.type === 'date' ? typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value) && Number.isFinite(Date.parse(value)) && new Date(value).toISOString().slice(0, 10) === value
      : f.type === 'file' ? typeof value === 'string' && /^[0-9a-f-]{36}$/i.test(value)
      : typeof value === 'string' && value.trim().length > 0 && value.length <= 2000;
    if (!valid) errors[f.id] = f.type === 'enum' ? 'Choose one of the listed options' : f.type === 'bool' ? 'Confirm this declaration' : 'Enter a valid answer';
  }
  return errors;
}
