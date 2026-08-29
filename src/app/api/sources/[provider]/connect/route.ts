import { z } from "zod";
import { getDatabase } from "@/db";
import { sourceConnections } from "@/db/schema";
import { ensureActorProfile, getActor } from "@/lib/auth";

const providerSchema = z.enum(["meripehchaan", "digilocker", "apaar"]);
const labels = {
  meripehchaan: "MeriPehchaan",
  digilocker: "DigiLocker",
  apaar: "APAAR",
} as const;

export async function POST(_request: Request, { params }: { params: Promise<{ provider: string }> }) {
  const actor = await getActor();
  if (!actor) return Response.json({ error: "Authentication required" }, { status: 401 });
  const provider = providerSchema.safeParse((await params).provider);
  if (!provider.success) return Response.json({ error: "Unsupported source provider" }, { status: 400 });
  const profile = await ensureActorProfile(actor);
  const [connection] = await getDatabase()
    .insert(sourceConnections)
    .values({ profileId: profile.id, provider: provider.data, displayName: labels[provider.data], status: "connected", lastVerifiedAt: new Date() })
    .onConflictDoUpdate({ target: [sourceConnections.profileId, sourceConnections.provider], set: { status: "connected", lastVerifiedAt: new Date(), updatedAt: new Date() } })
    .returning();
  return Response.json({ connection, sandbox: true });
}
