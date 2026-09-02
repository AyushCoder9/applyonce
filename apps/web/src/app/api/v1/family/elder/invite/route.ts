import { z } from "zod";
import { db, t, eq } from "@praman/db";
import { SECTIONS, RELATION } from "@praman/schema";
import { enqueue } from "@praman/jobs";
import { providers } from "@praman/providers";
import { handler, citizen, ok, body, log, ApiError } from "@/lib/api";
import { PENDING, normPhone, validPhone } from "@/components/family/logic";
import { signFamilyToken, appUrl } from "../../_tokens";

const Invite = z.object({
  name: z.string().trim().min(2).max(120), phone: z.string().refine(validPhone, "Enter a valid 10-digit mobile"),
  scope: z.array(z.enum(SECTIONS)).min(1), validUntil: z.string().datetime().optional().nullable(), relation: z.enum(RELATION).default("grandparent"),
});

/** Invite an adult (elder/delegate): placeholder profile (status=invited) + relation with validUntil=epoch (pending). SMS carries a signed accept link. */
export const POST = handler(async (req) => {
  const { user, session, self } = await citizen(req);
  if (!self) throw new ApiError(400, "NO_SELF_PROFILE");
  const b = await body(req, Invite);
  const phone = normPhone(b.phone);
  if ((user as { phoneNumber?: string }).phoneNumber === `+91${phone}`) throw new ApiError(422, "VALIDATION", "That is your own number", { phone: "Use the elder's mobile" });
  const [p] = await db.insert(t.profiles).values({ ownerUserId: user.id, kind: "dependent", displayName: b.name, status: "invited" }).returning();
  const [r] = await db.insert(t.relations).values({ guardianProfileId: self.id, wardProfileId: p!.id, relation: b.relation, basis: "elder_consent", scope: b.scope, validUntil: PENDING }).returning();
  const token = await signFamilyToken({ kind: "invite", relationId: r!.id, phone, scope: b.scope, validUntil: b.validUntil ?? null });
  const link = `${appUrl()}/app/family/accept?token=${token}`;
  const msg = `${user.name} wants to help manage your Praman profile (${b.scope.join(", ")}). Tap to review and accept: ${link}`;
  const existing = await db.query.user.findFirst({ where: eq(t.user.phoneNumber, `+91${phone}`) });
  if (existing) await enqueue("notify", { userId: existing.id, category: "consent", title: `${user.name} asked to manage part of your profile`, body: msg, link: `/app/family/accept?token=${token}`, channels: ["inapp", "sms"] });
  else await providers.sms.send(`+91${phone}`, msg, "transactional"); // no account yet → plain SMS (mock logs it)
  await log(session, "family.elder.invite", "relation", r!.id, { profileId: p!.id, scope: b.scope, phoneLast4: phone.slice(-4) });
  return ok({ relationId: r!.id, profileId: p!.id, ...(process.env.PROVIDER_SMS !== "setu" ? { devLink: link } : {}) }, { status: 201 });
});
