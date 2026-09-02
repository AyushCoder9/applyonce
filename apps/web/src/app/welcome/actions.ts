"use server";
import { db, t, eq, getDek, putFact, audit } from "@praman/db";
import { requireUser, requireProfileAccess } from "@/lib/session";

/** Step 1: name as on Aadhaar (self-declared until DigiLocker verifies it) + UI language. */
export async function saveNameAndLocale(name: string, locale: "en" | "hi") {
  const s = await requireUser("/welcome");
  const a = await requireProfileAccess(s);
  const clean = name.trim().replace(/\s+/g, " ").slice(0, 120);
  if (clean.length < 2) return { ok: false as const, error: "Enter your full name" };
  const dek = await getDek(a.ownerUserId);
  const r = await putFact(dek, { profileId: a.profile.id, key: "identity.full_name", value: clean, source: "self_declared", updatedBy: s.user.id, reason: "onboarding" }).catch((e: Error) => ({ status: "error" as const, message: e.message }));
  await db.update(t.user).set({ name: clean, locale }).where(eq(t.user.id, s.user.id));
  if (a.profile.displayName === "You" || a.profile.displayName === "New user") await db.update(t.profiles).set({ displayName: clean }).where(eq(t.profiles.id, a.profile.id));
  await audit({ actorUserId: s.user.id, action: "onboarding.name", targetType: "profile", targetId: a.profile.id, meta: { locale, status: r.status } });
  return { ok: true as const, status: r.status };
}
