import { db } from "./client";
import * as t from "./schema";
import { and,eq,or,isNull,gt } from "drizzle-orm";

export async function listAccessibleProfiles(userId: string) {
  const own = await db.select().from(t.profiles).where(and(eq(t.profiles.ownerUserId, userId), eq(t.profiles.status, "active"), eq(t.profiles.kind, "self"), isNull(t.profiles.claimedByUserId)));
  const claimed = await db.select().from(t.profiles).where(and(eq(t.profiles.claimedByUserId, userId), eq(t.profiles.status, "active")));
  const ownIds = [...new Set([...own, ...claimed].map((p) => p.id))];
  const wards = ownIds.length
    ? await db.select({ p: t.profiles, r: t.relations }).from(t.relations).innerJoin(t.profiles, eq(t.relations.wardProfileId, t.profiles.id))
        .where(and(or(...ownIds.map((id) => eq(t.relations.guardianProfileId, id))), or(isNull(t.relations.validUntil), gt(t.relations.validUntil, new Date())), eq(t.profiles.status, "active")))
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
