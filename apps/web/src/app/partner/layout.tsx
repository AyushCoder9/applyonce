import Link from "next/link";
import { partnerMembership } from "@/components/partner/session";
import { switchOrganisation } from "@/components/partner/actions";
import { SideShell } from "@/components/shell/side-shell";
import { PARTNER_NAV } from "@/components/shell/nav";

export default async function PartnerLayout({ children }: { children: React.ReactNode }) {
  const {partner, memberships} = await partnerMembership();
  if (!partner) return <div className="mx-auto w-full max-w-3xl px-4 py-8 rise">{children}</div>;
  const footer = <div className="grid gap-4">
    {memberships.length > 1 && <form action={switchOrganisation} className="grid gap-2">
      <label htmlFor="partner-switch" className="text-xs font-semibold">Organization</label>
      <select id="partner-switch" name="partnerId" defaultValue={partner.id} className="w-full rounded-md border border-line bg-surface p-2 text-sm">
        {memberships.map(m => <option key={m.partner.id} value={m.partner.id}>{m.partner.name}</option>)}
      </select><button className="rounded-md bg-brand-50 p-2 text-sm font-semibold text-brand-700">Switch organization</button>
    </form>}
    <Link href="/app" className="text-sm text-brand-600 underline">Back to citizen app</Link>
  </div>;
  return <SideShell nav={PARTNER_NAV} title={partner.name} subtitle={`Partner console · ${partner.status} · synthetic sandbox`} footer={footer}>{children}</SideShell>;
}
