import type { Metadata } from "next";
import Link from "next/link";
import { getSession } from "@/lib/session";
import { Container } from "@/components/public/blocks";
import { DpoForm } from "@/components/public/dpo-form";
export const metadata: Metadata = { title: "Your data rights (DPDP)", description: "Access, correct or erase your data under the DPDP Act 2023. Contact Praman's Data Protection Officer." };
export const dynamic = "force-dynamic";
export default async function Dpo() {
  const s = await getSession();
  return (
    <Container className="grid gap-10 py-14 md:grid-cols-[1fr_1.1fr] md:py-20">
      <div>
        <div className="text-xs font-semibold uppercase tracking-[0.08em] text-brand-600">Data Principal rights</div>
        <h1 className="mt-3 font-display text-4xl font-bold md:text-5xl">Your data. Your call.</h1>
        <p className="mt-4 text-lg text-ink-2">Under the DPDP Act 2023 you can access, correct and erase what we hold, withdraw consent, and complain. Most of it you can do yourself in the app, instantly. This form is for everything else, and for the record.</p>
        <ul className="mt-6 grid gap-2 text-sm text-ink-2">
          {[["Download everything", "/app/settings?tab=privacy"], ["Revoke a share", "/app/connections"], ["Fix a value", "/app/vault"], ["Delete my account", "/app/settings?tab=privacy"]].map(([t, h]) => <li key={t}><Link href={h!} className="underline">{t}</Link> — in the app, no waiting.</li>)}
        </ul>
        <div className="mt-8 rounded-lg border border-line bg-surface p-4 text-sm"><b>Data Protection Officer</b><div className="text-ink-2">Praman Technologies, Lucknow, India<br /><a className="underline" href="mailto:dpo@praman.in">dpo@praman.in</a> · reply within 30 days<br />Escalation: Data Protection Board of India</div></div>
      </div>
      <DpoForm loggedIn={!!s} name={s?.user.name} />
    </Container>
  );
}
