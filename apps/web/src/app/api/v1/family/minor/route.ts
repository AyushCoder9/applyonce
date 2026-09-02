import { z } from "zod";
import { db, t, getDek, putFact } from "@praman/db";
import { GENDER, RELATION } from "@praman/schema";
import { handler, citizen, ok, body, log, ApiError } from "@/lib/api";
import { isMinor, validDob } from "@/components/family/logic";

const Minor = z.object({ name: z.string().trim().min(2).max(120), dob: z.string(), gender: z.enum(GENDER), relation: z.enum(RELATION).default("child") });

/** Add a minor: ward profile owned by me + relation(basis=minor, scope=*) + seeded self-declared identity facts. */
export const POST = handler(async (req) => {
  const { user, session, self } = await citizen(req);
  if (!self) throw new ApiError(400, "NO_SELF_PROFILE");
  const b = await body(req, Minor);
  if (!validDob(b.dob)) throw new ApiError(422, "VALIDATION", "Check the date of birth", { dob: "Enter a valid past date" });
  if (!isMinor(b.dob)) throw new ApiError(422, "VALIDATION", "Only under-18s can be added as a minor. Invite adults instead.", { dob: "Must be under 18" });
  const [p] = await db.insert(t.profiles).values({ ownerUserId: user.id, kind: "dependent", displayName: b.name, dobYear: Number(b.dob.slice(0, 4)) }).returning();
  const [r] = await db.insert(t.relations).values({ guardianProfileId: self.id, wardProfileId: p!.id, relation: b.relation, basis: "minor", scope: ["*"] }).returning();
  const dek = await getDek(user.id);
  await putFact(dek, { profileId: p!.id, key: "identity.full_name", value: b.name, source: "self_declared", updatedBy: user.id });
  await putFact(dek, { profileId: p!.id, key: "identity.dob", value: b.dob, source: "self_declared", updatedBy: user.id });
  await putFact(dek, { profileId: p!.id, key: "identity.gender", value: b.gender, source: "self_declared", updatedBy: user.id });
  await log(session, "family.minor.add", "relation", r!.id, { profileId: p!.id, relation: b.relation });
  return ok({ relationId: r!.id, profileId: p!.id }, { status: 201 });
});
