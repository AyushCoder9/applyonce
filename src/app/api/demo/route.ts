import { findProfileByClerkUserId, getProfileSnapshot } from "@/lib/application-service";

export async function GET() {
  const profile = await findProfileByClerkUserId("demo_applyonce");

  if (!profile) {
    return Response.json(
      {
        synthetic: true,
        ready: false,
        message: "The synthetic demo seed has not been loaded yet.",
      },
      { status: 503 },
    );
  }

  const snapshot = await getProfileSnapshot(profile.id);

  return Response.json({ synthetic: true, ready: true, snapshot });
}
