import Link from 'next/link';
import { redirect, notFound } from 'next/navigation';
import { db, t, and, eq, isNull, getDek, getFacts } from '@applyonce/db';
import { randomToken } from '@applyonce/crypto';
import { assessReadiness } from '@applyonce/schema';
import { PageHeader } from '@applyonce/ui';
import { requireUser, requireProfileAccess } from '@/lib/session';
import { SESSION_TTL_MS } from '@/lib/share';
import { ReadinessPanel } from '@/components/readiness/readiness-panel';
import { demoPortalUrl, deploymentAppUrl } from '@/lib/urls';

export default async function StartApply({ params }: { params: Promise<{ formSlug: string }> }) {
  const { formSlug } = await params;
  const session = await requireUser(`/app/apply/${formSlug}`);
  const access = await requireProfileAccess(session);
  const form = await db.query.forms.findFirst({ where: and(eq(t.forms.slug, formSlug), eq(t.forms.status, 'live')) });
  if (!form) notFound();
  const partner = await db.query.partners.findFirst({ where: eq(t.partners.id, form.partnerId) });
  if (!partner || partner.status === 'suspended') notFound();
  const facts = await getFacts(await getDek(access.ownerUserId), access.profile.id, {keys:form.requestedFields.map(f=>f.key)});
  const conflicts = await db.select({key:t.mismatches.factKey}).from(t.mismatches).where(and(eq(t.mismatches.profileId,access.profile.id),isNull(t.mismatches.resolvedAt)));
  const report = assessReadiness(facts,form,{scope:access.scope,conflicts:conflicts.map(c=>c.key)});
  const demoUrl = demoPortalUrl();
  const isBta = Boolean(demoUrl && new URL(form.redirectUrl).origin === new URL(demoUrl).origin && partner.slug === 'bta');
  async function begin() {
    'use server';
    await requireUser('/app/apply');
    const current = await db.query.forms.findFirst({where:eq(t.forms.id,form!.id)});
    if (!current || current.status !== 'live' || (current.deadlineAt && current.deadlineAt <= new Date())) redirect('/app/apply');
    const token = randomToken(32);
    await db.insert(t.shareSessions).values({partnerId:current.partnerId,formId:current.id,token,returnUrl:`${deploymentAppUrl()}/app/applications`,state:`hosted:${current.slug}`,env:'sandbox',expiresAt:new Date(Date.now()+SESSION_TTL_MS)});
    redirect(`/share/${token}`);
  }
  return <><PageHeader back={{href:'/app/apply',label:'All forms'}} eyebrow={partner.name} title={form.name} subtitle={`Applying as ${access.profile.displayName}. Check the evidence before sharing it.`}/>
    <ReadinessPanel report={report} formId={form.id} profileId={access.profile.id} aiEnabled={!!process.env.OPENAI_API_KEY && !!process.env.OPENAI_MODEL} locale={(session.user as {locale?:string}).locale==='hi'?'hi':'en'}/>
    <div className="card mt-5 flex flex-wrap items-center justify-between gap-4 p-5"><p className="max-w-xl text-sm text-ink-2">{isBta?'Continue through the BTA sandbox portal and return to your tracker after submission.':'This institution uses ApplyOnce’s hosted sandbox form. Submission, receipts and tracking work here.'} Missing answers can be completed on the next screen.</p>
      {report.closed ? <Link href="/app/apply" className="cta px-5 py-3">Find an open form</Link> : isBta && demoUrl ? <form action={`${demoUrl}/api/applyonce/session`} method="post"><button className="cta px-5 py-3" type="submit">Continue to consent</button></form> : <form action={begin}><button className="cta px-5 py-3" type="submit">Continue to consent</button></form>}
    </div></>;
}
