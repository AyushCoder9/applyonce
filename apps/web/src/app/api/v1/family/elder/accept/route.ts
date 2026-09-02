import { z } from "zod";
import { db, t, eq, and } from "@praman/db";
import { enqueue } from "@praman/jobs";
import { handler, citizen, ok, body, log, ApiError } from "@/lib/api";
import { claimTransition, isPending } from "@/components/family/logic";
import { verifyFamilyToken } from "../../_tokens";

/**
 * Accept a family link. The logged-in user's phone must match the token.
 * kind=invite (elder/delegate): relation goes live. If the elder already has a self profile, that profile becomes the ward
 *   and the placeholder is deleted; otherwise the placeholder is marked claimed by the elder.
 * kind=claim (ward turned 18): placeholder becomes the ward's own (claimedByUserId); guardian keeps identity+education for 90 days.
 */
export const POST = handler(async (req) => {
  const { user, session } = await citizen(req);
  const { token } = await body(req, z.object({ token: z.string().min(10) }));
  const tk = await verifyFamilyToken(token).catch(() => { throw new ApiError(400, "TOKEN_INVALID", "This link has expired or is not valid. Ask for a new one."); });
  const phone = (user as { phoneNumber?: string }).phoneNumber ?? "";
  if (phone !== `+91${tk.phone}`) throw new ApiError(403, "PHONE_MISMATCH", `Log in with the mobile ending ${tk.phone.slice(-4)} to accept this.`);
  const rel = await db.query.relations.findFirst({ where: eq(t.relations.id, tk.relationId) });
  if (!rel) throw new ApiError(404, "RELATION_NOT_FOUND", "This invite was withdrawn.");
  const placeholder = await db.query.profiles.findFirst({ where: eq(t.profiles.id, rel.wardProfileId) });
  const guardian = await db.query.profiles.findFirst({ where: eq(t.profiles.id, rel.guardianProfileId) });
  if (!placeholder || !guardian) throw new ApiError(404, "RELATION_NOT_FOUND");
  if (guardian.ownerUserId === user.id) throw new ApiError(400, "SELF_LINK", "You cannot accept your own invite.");

  if (tk.kind === "invite") {
    if (!isPending(rel.validUntil)) return ok({ relationId: rel.id, already: true });
    const validUntil = tk.validUntil ? new Date(tk.validUntil) : null;
    const own = await db.query.profiles.findFirst({ where: and(eq(t.profiles.ownerUserId, user.id), eq(t.profiles.kind, "self")) });
    if (own) {
      await db.update(t.relations).set({ wardProfileId: own.id, scope: tk.scope ?? rel.scope, validUntil }).where(eq(t.relations.id, rel.id));
      if (own.displayName === "You") await db.update(t.profiles).set({ displayName: placeholder.displayName }).where(eq(t.profiles.id, own.id)); // fresh account: take the invited name
      await db.delete(t.profiles).where(eq(t.profiles.id, placeholder.id));
    } else {
      await db.update(t.profiles).set({ claimedByUserId: user.id, status: "active" }).where(eq(t.profiles.id, placeholder.id));
      await db.update(t.relations).set({ scope: tk.scope ?? rel.scope, validUntil }).where(eq(t.relations.id, rel.id));
    }
    await log(session, "family.elder.accept", "relation", rel.id, { scope: tk.scope, validUntil, linkedOwnProfile: !!own });
    await enqueue("notify", { userId: guardian.ownerUserId, category: "consent", title: `${user.name} accepted your request`, body: `You can now manage ${(tk.scope ?? rel.scope).join(", ")} for ${placeholder.displayName}.`, link: "/app/family" });
    return ok({ relationId: rel.id, wardProfileId: own?.id ?? placeholder.id });
  }
  // claim at 18
  if (placeholder.claimedByUserId) return ok({ relationId: rel.id, already: true });
  const c = claimTransition();
  await db.update(t.profiles).set({ claimedByUserId: user.id, status: "active" }).where(eq(t.profiles.id, placeholder.id));
  await db.update(t.relations).set({ basis: c.basis, scope: c.scope, validUntil: c.validUntil }).where(eq(t.relations.id, rel.id));
  await log(session, "family.claim", "profile", placeholder.id, { relationId: rel.id, guardianScope: c.scope, guardianUntil: c.validUntil });
  await enqueue("notify", { userId: guardian.ownerUserId, category: "consent", title: `${placeholder.displayName} claimed their profile`, body: `You keep identity and education access for 90 days, then it ends.`, link: "/app/family" });
  return ok({ relationId: rel.id, profileId: placeholder.id });
});
