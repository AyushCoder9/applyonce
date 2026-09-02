import Link from "next/link";
import { db, t, eq } from "@praman/db";
import { requireUser } from "@/lib/session";
import { SideShell } from "@/components/shell/side-shell";
import { PARTNER_NAV } from "@/components/shell/nav";

export default async function PartnerLayout({ children }: { children: React.ReactNode }) {
  const s = await requireUser("/partner");
  const m = await db.select({ p: t.partners, role: t.partnerMembers.role }).from(t.partnerMembers).innerJoin(t.partners, eq(t.partnerMembers.partnerId, t.partners.id)).where(eq(t.partnerMembers.userId, s.user.id));
  if (!m.length) return <div className="mx-auto max-w-lg p-8 text-center"><h1 className="text-2xl font-bold">No organisation yet</h1><p className="mt-2 text-ink-2">Register your institution to get sandbox keys and an “Apply with Praman” button.</p><Link href="/partner/onboarding" className="cta mt-6 inline-block px-6 py-3">Register organisation</Link></div>;
  const org = m[0]!.p;
  return <SideShell nav={PARTNER_NAV} title={org.name} subtitle={`Partner console · ${org.status}`} footer={<Link href="/app" className="text-sm text-brand-600 underline">Back to citizen app</Link>}>{children}</SideShell>;
}
