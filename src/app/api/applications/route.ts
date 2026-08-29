import { z } from "zod";
import { ensureActorProfile, getActor } from "@/lib/auth";
import { createApplicationPacket, listApplications } from "@/lib/application-service";

const createApplicationSchema = z.object({
  templateSlug: z.string().min(1).max(120),
  answers: z
    .record(
      z.string(),
      z.object({ valueText: z.string().max(1000), confirmed: z.boolean() }),
    )
    .optional(),
});

export async function GET() {
  const actor = await getActor();

  if (!actor) {
    return Response.json({ error: "Authentication required" }, { status: 401 });
  }

  const profile = await ensureActorProfile(actor);
  return Response.json({ applications: await listApplications(profile.id) });
}

export async function POST(request: Request) {
  const actor = await getActor();

  if (!actor) {
    return Response.json({ error: "Authentication required" }, { status: 401 });
  }

  const parsed = createApplicationSchema.safeParse(await request.json());
  if (!parsed.success) {
    return Response.json({ error: "Invalid application packet request" }, { status: 400 });
  }

  const profile = await ensureActorProfile(actor);
  const application = await createApplicationPacket({
    profileId: profile.id,
    templateSlug: parsed.data.templateSlug,
    answers: parsed.data.answers,
  });

  if (!application) {
    return Response.json({ error: "Application template not found" }, { status: 404 });
  }

  return Response.json({ application }, { status: 201 });
}
