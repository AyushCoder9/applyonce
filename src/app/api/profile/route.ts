import { and, eq } from "drizzle-orm";
import { z } from "zod";
import { getDatabase } from "@/db";
import { profiles } from "@/db/schema";
import { ensureActorProfile, getActor } from "@/lib/auth";
import { getProfileSnapshot } from "@/lib/application-service";

const profileUpdateSchema = z.object({
  phone: z.string().max(40).nullable().optional(),
  dateOfBirth: z.string().date().nullable().optional(),
  city: z.string().max(120).nullable().optional(),
  state: z.string().max(120).nullable().optional(),
  category: z.string().max(80).nullable().optional(),
  annualIncomePaise: z.number().int().nonnegative().nullable().optional(),
});

export async function PATCH(request: Request) {
  const actor = await getActor();
  if (!actor) {
    return Response.json({ error: "Authentication required" }, { status: 401 });
  }

  const parsed = profileUpdateSchema.safeParse(await request.json());
  if (!parsed.success) {
    return Response.json({ error: "Invalid profile update" }, { status: 400 });
  }

  const profile = await ensureActorProfile(actor);
  const db = getDatabase();
  const [updated] = await db
    .update(profiles)
    .set({ ...parsed.data, updatedAt: new Date() })
    .where(and(eq(profiles.id, profile.id), eq(profiles.clerkUserId, actor.clerkUserId)))
    .returning();

  return Response.json({ snapshot: updated ? await getProfileSnapshot(updated.id) : null });
}
