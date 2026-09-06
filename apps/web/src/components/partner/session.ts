import "server-only";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { db, t, eq, asc } from "@praman/db";
import { requireUser } from "@/lib/session";

/** The selected organization is always resolved through current membership. */
export async function partnerMembership() {
  const session = await requireUser("/partner");
  const rows = await db.select({ partner: t.partners, role: t.partnerMembers.role }).from(t.partnerMembers).innerJoin(t.partners, eq(t.partnerMembers.partnerId, t.partners.id)).where(eq(t.partnerMembers.userId, session.user.id)).orderBy(asc(t.partners.createdAt));
  const selected = (await cookies()).get("praman_partner")?.value;
  const m = rows.find(row => row.partner.id === selected) ?? rows[0];
  return { session, partner: m?.partner ?? null, role: m?.role ?? null, memberships: rows };
}
/** Partner console guard: redirects to onboarding when the user has no organisation. */
export async function requirePartnerMember() {
  const m = await partnerMembership();
  if (!m.partner || !m.role) redirect("/partner/onboarding");
  return { session: m.session, partner: m.partner, role: m.role };
}
export type PartnerRole = "owner" | "admin" | "developer" | "reviewer";
export const canManage = (role: PartnerRole | null) => role === "owner" || role === "admin";
