import { ensureActorProfile, getActor } from "@/lib/auth";
import { getProfileSnapshot } from "@/lib/application-service";

export async function GET() {
  const actor = await getActor();

  if (!actor) {
    return Response.json({ error: "Authentication required" }, { status: 401 });
  }

  const profile = await ensureActorProfile(actor);
  const snapshot = await getProfileSnapshot(profile.id);

  return Response.json({ snapshot });
}
