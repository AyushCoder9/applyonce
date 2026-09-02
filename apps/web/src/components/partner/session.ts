import "server-only";
import { redirect } from "next/navigation";
import { db, t, eq, asc } from "@praman/db";
import { requireUser } from "@/lib/session";

/** First membership of the signed-in user (org switcher is a later feature); null when they have none. */
export async function partnerMembership() {
  const session = await requireUser("/partner");
  const rows = await db.select({ partner: t.partners, role: t.partnerMembers.role }).from(t.partnerMembers).innerJoin(t.partners, eq(t.partnerMembers.partnerId, t.partners.id)).where(eq(t.partnerMembers.userId, session.user.id)).orderBy(asc(t.partners.createdAt));
  const m = rows[0];
  return { session, partner: m?.partner ?? null, role: m?.role ?? null };
}
/** Partner console guard: redirects to onboarding when the user has no organisation. */
export async function requirePartnerMember() {
  const m = await partnerMembership();
  if (!m.partner || !m.role) redirect("/partner/onboarding");
  return { session: m.session, partner: m.partner, role: m.role };
}
export type PartnerRole = "owner" | "admin" | "developer" | "reviewer";
export const canManage = (role: PartnerRole | null) => role === "owner" || role === "admin";
