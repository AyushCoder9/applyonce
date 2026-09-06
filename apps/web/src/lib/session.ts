import "server-only";
import { cache } from "react";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { db, t, and, eq, or, isNull, gt, listAccessibleProfiles } from "@applyonce/db";
import { auth } from "./auth";

export const STEP_UP_WINDOW_MS = 5 * 60 * 1000;

export const getSession = cache(async function getSession() {
  return auth.api.getSession({ headers: await headers() });
});
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
export const listProfiles = cache(listAccessibleProfiles);

/** ACL: resolve a profile the session may access, with scope. Throws 403-style error. */
export async function requireProfileAccess(session: Session, profileId?: string | null) {
  const { self, all } = await listProfiles(session.user.id);
  const active = (session.session as { activeProfileId?: string | null }).activeProfileId;
  const target = profileId ?? (all.some((p) => p.id === active) ? active : self?.id);
  const p = all.find((x) => x.id === target);
  if (!p) throw new AccessError("PROFILE_FORBIDDEN");
  return { profile: p, scope: p.scope as string[], self, all, ownerUserId: p.ownerUserId };
}
export class AccessError extends Error { status = 403; }
export const scopeAllows = (scope: string[], section: string) => scope.includes("*") || scope.includes(section);
