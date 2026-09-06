import { db, t, eq } from "@applyonce/db";
import { PageHeader } from "@applyonce/ui";
import { requirePartnerMember, canManage } from "@/components/partner/session";
import { TeamForm } from "@/components/partner/team-form";

export const metadata = { title: "Team" };

export default async function TeamPage() {
  const { partner, role, session } = await requirePartnerMember();
  const members = await db.select({ userId: t.partnerMembers.userId, role: t.partnerMembers.role, name: t.user.name, phone: t.user.phoneNumber }).from(t.partnerMembers).innerJoin(t.user, eq(t.partnerMembers.userId, t.user.id)).where(eq(t.partnerMembers.partnerId, partner.id));
  return (
    <>
      <PageHeader title="Team" subtitle={`${members.length} member${members.length === 1 ? "" : "s"} of ${partner.name}`} />
      <TeamForm members={members} me={session.user.id} canManage={canManage(role)} />
    </>
  );
}
