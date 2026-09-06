import "server-only";
import { db, t, eq, getDek, getFacts, completion } from "@praman/db";
import { fieldsInSection, scopeContains, type Section } from "@praman/schema";
import { listProfiles } from "@/lib/session";
import { isHandoverDue, isPending } from "./logic";

export const CORE_SECTIONS: Section[] = ["identity", "contact", "address", "family", "category", "education"];
const CORE_KEYS = CORE_SECTIONS.flatMap((s) => fieldsInSection(s).map((f) => f.key));

export type FamilyMember = {
  relationId: string; profileId: string; displayName: string; dobYear: number | null; relation: string;
  basis: "minor" | "elder_consent" | "poa"; scope: string[]; validUntil: string | null; status: string;
  pending: boolean; handoverDue: boolean; claimed: boolean; filled: number; total: number; verified: number;
};

/** Wards of the user's self profile (incl. pending invites), with completion over core sections. */
export async function familyList(userId: string): Promise<{ selfProfileId: string | null; members: FamilyMember[] }> {
  const { self } = await listProfiles(userId);
  if (!self) return { selfProfileId: null, members: [] };
  const rows = await db.select({ r: t.relations, p: t.profiles }).from(t.relations).innerJoin(t.profiles, eq(t.relations.wardProfileId, t.profiles.id)).where(eq(t.relations.guardianProfileId, self.id));
  const members: FamilyMember[] = [];
  for (const { r, p } of rows) {
    let c = { filled: 0, total: CORE_KEYS.length, verified: 0 };
    try { const keys=CORE_KEYS.filter(key=>scopeContains(r.scope,key)); const valid=!r.validUntil || r.validUntil.getTime()>Date.now(); const dek = await getDek(p.ownerUserId); c = completion(valid?await getFacts(dek, p.id, { keys }):[], keys); } catch { /* no facts yet */ }
    members.push({
      relationId: r.id, profileId: p.id, displayName: p.displayName, dobYear: p.dobYear, relation: r.relation, basis: r.basis, scope: r.scope,
      validUntil: r.validUntil && !isPending(r.validUntil) ? r.validUntil.toISOString() : null, status: p.status,
      pending: isPending(r.validUntil), handoverDue: isHandoverDue(p.dobYear, r.basis) && !p.claimedByUserId, claimed: !!p.claimedByUserId,
      filled: c.filled, total: c.total, verified: c.verified,
    });
  }
  members.sort((a, b) => a.displayName.localeCompare(b.displayName));
  return { selfProfileId: self.id, members };
}
