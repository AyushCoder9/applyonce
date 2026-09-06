import { z } from "zod";
import { db, t, eq, and } from "@praman/db";
import { SECTIONS } from "@praman/schema";
import { enqueue } from "@praman/jobs";
import { providers } from "@praman/providers";
import { handler, citizen, ok, body, log, ApiError } from "@/lib/api";
import { isHandoverDue, normPhone, validPhone } from "@/components/family/logic";
import { signFamilyToken, appUrl } from "../_tokens";

const Patch = z.object({
  scope: z.array(z.union([z.literal("*"), z.enum(SECTIONS)])).min(1).optional(),
  validUntil: z.string().datetime().nullable().optional(),
  sendClaimLink: z.boolean().optional(), phone: z.string().optional(), // handover at 18
});

async function own(req: Request, relationId: string) {
  const c = await citizen(req);
  if (!c.self) throw new ApiError(400, "NO_SELF_PROFILE");
  const rel = await db.query.relations.findFirst({ where: and(eq(t.relations.id, relationId), eq(t.relations.guardianProfileId, c.self.id)) });
  if (!rel) throw new ApiError(404, "RELATION_NOT_FOUND");
  const ward = (await db.query.profiles.findFirst({ where: eq(t.profiles.id, rel.wardProfileId) }))!;
  return { ...c, rel, ward };
}

export const PATCH = handler(async (req, { params }) => {
  const { session, user, rel, ward } = await own(req, params.relationId!);
  const b = await body(req, Patch);
  if (b.sendClaimLink) {
    if (!isHandoverDue(ward.dobYear, rel.basis)) throw new ApiError(400, "NOT_DUE", `${ward.displayName} is not 18 yet.`);
    if (!b.phone || !validPhone(b.phone)) throw new ApiError(422, "VALIDATION", "Enter the ward's own mobile", { phone: "10-digit mobile" });
    const phone = normPhone(b.phone);
    const token = await signFamilyToken({ kind: "claim", relationId: rel.id, phone });
    const link = `${appUrl()}/app/family/claim?token=${token}`;
    const msg = `${ward.displayName}, you're 18 — your Praman profile is yours now. Log in with this number and claim it: ${link}`;
    const existing = await db.query.user.findFirst({ where: eq(t.user.phoneNumber, `+91${phone}`) });
    if (existing) await enqueue("notify", { userId: existing.id, category: "system", title: "Claim your Praman profile", body: msg, link: `/app/family/claim?token=${token}`, channels: ["inapp", "sms"] });
    else await providers.sms.send(`+91${phone}`, msg, "transactional");
    await log(session, "family.claim.link_sent", "relation", rel.id, { profileId: ward.id, phoneLast4: phone.slice(-4) });
    return ok({ sent: true, ...(process.env.PROVIDER_SMS !== "setu" ? { devLink: link } : {}) });
  }
  if (rel.basis !== "minor") {
    if (b.scope?.some((section) => !rel.scope.includes("*") && !rel.scope.includes(section))) throw new ApiError(403, "CONSENT_REQUIRED", "Ask the family member to approve wider access with a new invite.");
    if (b.validUntil !== undefined && rel.validUntil && (!b.validUntil || new Date(b.validUntil) > rel.validUntil)) throw new ApiError(403, "CONSENT_REQUIRED", "Only the family member can approve a longer access period.");
  }
  const set: Partial<typeof t.relations.$inferInsert> = {};
  if (b.scope) set.scope = b.scope;
  if (b.validUntil !== undefined) set.validUntil = b.validUntil ? new Date(b.validUntil) : null;
  if (rel.basis === "minor" && b.validUntil !== undefined) throw new ApiError(400, "MINOR_NO_EXPIRY", "Access to a minor lasts until they turn 18.");
  if (!Object.keys(set).length) throw new ApiError(400, "NO_CHANGES");
  await db.update(t.relations).set(set).where(eq(t.relations.id, rel.id));
  await log(session, "family.relation.update", "relation", rel.id, { ...set, by: user.id });
  return ok({ relationId: rel.id, ...set });
});

/** Revoke: pending invite → delete placeholder profile too; live relation → delete relation only (ward's data stays with its owner). */
export const DELETE = handler(async (req, { params }) => {
  const { session, rel, ward } = await own(req, params.relationId!);
  await db.delete(t.relations).where(eq(t.relations.id, rel.id));
  if (ward.status === "invited" || (rel.basis === "minor" && ward.ownerUserId === session.user.id && !ward.claimedByUserId)) await db.update(t.profiles).set({ status: "archived" }).where(eq(t.profiles.id, ward.id));
  await log(session, "family.relation.revoke", "relation", rel.id, { profileId: ward.id, basis: rel.basis });
  return ok({ revoked: true });
});
