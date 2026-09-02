import Link from "next/link";
import { db, t, eq } from "@praman/db";
import { requireUser } from "@/lib/session";
import { SideShell } from "@/components/shell/side-shell";
import { PARTNER_NAV } from "@/components/shell/nav";

export default async function PartnerLayout({ children }: { children: React.ReactNode }) {
  const s = await requireUser("/partner");
  const m = await db.select({ p: t.partners, role: t.partnerMembers.role }).from(t.partnerMembers).innerJoin(t.partners, eq(t.partnerMembers.partnerId, t.partners.id)).where(eq(t.partnerMembers.userId, s.user.id));
  // No organisation yet: render the page (pages redirect to /partner/onboarding via requirePartnerMember), so the wizard itself is reachable.
  if (!m.length) return <div className="mx-auto w-full max-w-3xl px-4 py-8 rise">{children}</div>;
  const org = m[0]!.p;
  return <SideShell nav={PARTNER_NAV} title={org.name} subtitle={`Partner console · ${org.status}`} footer={<Link href="/app" className="text-sm text-brand-600 underline">Back to citizen app</Link>}>{children}</SideShell>;
}
