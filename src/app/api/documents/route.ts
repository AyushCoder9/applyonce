import { desc, eq } from "drizzle-orm";
import { z } from "zod";
import { getDatabase } from "@/db";
import { documents } from "@/db/schema";
import { ensureActorProfile, getActor } from "@/lib/auth";

const documentMetadataSchema = z.object({
  title: z.string().min(1).max(180),
  documentType: z.string().min(1).max(120),
  provider: z.enum(["meripehchaan", "digilocker", "apaar", "manual"]),
  maskedIdentifier: z.string().max(80).optional(),
  issuedAt: z.string().date().optional(),
  expiresAt: z.string().date().optional(),
});

export async function GET() {
  const actor = await getActor();
  if (!actor) {
    return Response.json({ error: "Authentication required" }, { status: 401 });
  }

  const profile = await ensureActorProfile(actor);
  const rows = await getDatabase()
    .select()
    .from(documents)
    .where(eq(documents.profileId, profile.id))
    .orderBy(desc(documents.updatedAt));

  return Response.json({ documents: rows });
}

export async function POST(request: Request) {
  const actor = await getActor();
  if (!actor) {
    return Response.json({ error: "Authentication required" }, { status: 401 });
  }

  const parsed = documentMetadataSchema.safeParse(await request.json());
  if (!parsed.success) {
    return Response.json({ error: "Invalid document metadata" }, { status: 400 });
  }

  const profile = await ensureActorProfile(actor);
  const [document] = await getDatabase()
    .insert(documents)
    .values({ profileId: profile.id, ...parsed.data, status: "pending" })
    .returning();

  return Response.json(
    {
      document,
      note: "The document record is durable. Upload the private file through /api/documents/upload.",
    },
    { status: 201 },
  );
}
