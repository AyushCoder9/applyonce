import { z } from "zod";
import { getDatabase } from "@/db";
import { sourceConnections } from "@/db/schema";
import { ensureActorProfile, getActor } from "@/lib/auth";
import { getConnector } from "@/lib/connectors/registry";

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
  const connector = getConnector(provider.data);
  if (!connector?.canAuthorize) {
    return Response.json({ error: connector?.disclosure ?? "This source is not available", connector }, { status: 409 });
  }
  const profile = await ensureActorProfile(actor);
  const [connection] = await getDatabase()
    .insert(sourceConnections)
    .values({ profileId: profile.id, provider: provider.data, displayName: labels[provider.data], status: "connected", lastVerifiedAt: new Date() })
    .onConflictDoUpdate({ target: [sourceConnections.profileId, sourceConnections.provider], set: { status: "connected", lastVerifiedAt: new Date(), updatedAt: new Date() } })
    .returning();
  return Response.json({ connection, sandbox: true });
}
