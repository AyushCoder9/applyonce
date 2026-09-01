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
  metadata: z
    .object({
      currentAddress: z.string().max(500).nullable().optional(),
      permanentAddress: z.string().max(500).nullable().optional(),
      postalCode: z.string().max(12).nullable().optional(),
      parentName: z.string().max(160).nullable().optional(),
      parentPhone: z.string().max(40).nullable().optional(),
      guardianName: z.string().max(160).nullable().optional(),
      highestQualification: z.string().max(160).nullable().optional(),
      currentInstitution: z.string().max(220).nullable().optional(),
      class10Board: z.string().max(160).nullable().optional(),
      class10Year: z.string().max(4).nullable().optional(),
      class12Board: z.string().max(160).nullable().optional(),
      class12Year: z.string().max(4).nullable().optional(),
      employmentStatus: z.string().max(120).nullable().optional(),
      employer: z.string().max(220).nullable().optional(),
      disabilityStatus: z.string().max(160).nullable().optional(),
      identifierReference: z.string().max(80).nullable().optional(),
    })
    .optional(),
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
  const { metadata, ...profileValues } = parsed.data;
  const [updated] = await db
    .update(profiles)
    .set({
      ...profileValues,
      ...(metadata ? { metadata: { ...profile.metadata, ...metadata } } : {}),
      updatedAt: new Date(),
    })
    .where(and(eq(profiles.id, profile.id), eq(profiles.clerkUserId, actor.clerkUserId)))
    .returning();

  return Response.json({ snapshot: updated ? await getProfileSnapshot(updated.id) : null });
}
