import "server-only";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { db, t, and, eq, or, isNull, gt } from "@praman/db";
import { auth } from "./auth";

export const STEP_UP_WINDOW_MS = 5 * 60 * 1000;

export async function getSession() {
  return auth.api.getSession({ headers: await headers() });
}
export type Session = NonNullable<Awaited<ReturnType<typeof getSession>>>;

export async function requireUser(next?: string) {
  const s = await getSession();
  if (!s) redirect(`/auth/login${next ? `?next=${encodeURIComponent(next)}` : ""}`);
  return s;
}
export async function requireAdmin() {
  const s = await requireUser("/admin");
  if ((s.user as { role?: string }).role !== "admin") redirect("/app");
  return s;
}
export const isSteppedUp = (s: Session) => {
  const at = (s.session as { steppedUpAt?: Date | string | null }).steppedUpAt;
  return !!at && Date.now() - new Date(at).getTime() < STEP_UP_WINDOW_MS;
};

/** Profiles the user may act on: own + wards via active relations. */
export async function listProfiles(userId: string) {
  const own = await db.select().from(t.profiles).where(and(eq(t.profiles.ownerUserId, userId), eq(t.profiles.status, "active")));
  const claimed = await db.select().from(t.profiles).where(eq(t.profiles.claimedByUserId, userId));
  const ownIds = own.map((p) => p.id);
  const wards = ownIds.length
    ? await db.select({ p: t.profiles, r: t.relations }).from(t.relations).innerJoin(t.profiles, eq(t.relations.wardProfileId, t.profiles.id))
        .where(and(or(...ownIds.map((id) => eq(t.relations.guardianProfileId, id))), or(isNull(t.relations.validUntil), gt(t.relations.validUntil, new Date()))))
    : [];
  const self = own.find((p) => p.kind === "self") ?? claimed[0];
  return {
    self,
    all: [
      ...own.map((p) => ({ ...p, role: p.kind === "self" ? ("self" as const) : ("owner" as const), scope: ["*"] })),
      ...claimed.map((p) => ({ ...p, role: "self" as const, scope: ["*"] })),
      ...wards.filter((w) => !ownIds.includes(w.p.id)).map((w) => ({ ...w.p, role: "guardian" as const, scope: w.r.scope })),
    ],
  };
}

/** ACL: resolve a profile the session may access, with scope. Throws 403-style error. */
export async function requireProfileAccess(session: Session, profileId?: string | null) {
  const { self, all } = await listProfiles(session.user.id);
  const active = (session.session as { activeProfileId?: string | null }).activeProfileId;
  const target = profileId ?? active ?? self?.id;
  const p = all.find((x) => x.id === target);
  if (!p) throw new AccessError("PROFILE_FORBIDDEN");
  return { profile: p, scope: p.scope as string[], self, all, ownerUserId: p.ownerUserId };
}
export class AccessError extends Error { status = 403; }
export const scopeAllows = (scope: string[], section: string) => scope.includes("*") || scope.includes(section);
