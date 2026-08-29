import { desc, eq } from "drizzle-orm";
import { getDatabase } from "@/db";
import { consents } from "@/db/schema";
import { ensureActorProfile, getActor } from "@/lib/auth";

export async function GET() {
  const actor = await getActor();
  if (!actor) {
    return Response.json({ error: "Authentication required" }, { status: 401 });
  }

  const profile = await ensureActorProfile(actor);
  const rows = await getDatabase()
    .select()
    .from(consents)
    .where(eq(consents.profileId, profile.id))
    .orderBy(desc(consents.approvedAt));

  return Response.json({ consents: rows });
}
