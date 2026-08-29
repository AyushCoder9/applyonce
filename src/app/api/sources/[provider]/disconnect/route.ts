import { and, eq } from "drizzle-orm";
import { getDatabase } from "@/db";
import { sourceConnections } from "@/db/schema";
import { ensureActorProfile, getActor } from "@/lib/auth";

export async function DELETE(_request: Request, { params }: { params: Promise<{ provider: string }> }) {
  const actor = await getActor();
  if (!actor) return Response.json({ error: "Authentication required" }, { status: 401 });
  const profile = await ensureActorProfile(actor);
  const provider = (await params).provider;
  const [connection] = await getDatabase()
    .update(sourceConnections)
    .set({ status: "disconnected", updatedAt: new Date() })
    .where(and(eq(sourceConnections.profileId, profile.id), eq(sourceConnections.provider, provider as "meripehchaan" | "digilocker" | "apaar" | "manual")))
    .returning({ id: sourceConnections.id, provider: sourceConnections.provider, status: sourceConnections.status });
  return connection ? Response.json({ connection }) : Response.json({ error: "Source connection not found" }, { status: 404 });
}
