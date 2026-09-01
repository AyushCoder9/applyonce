import { and, desc, eq } from "drizzle-orm";
import { z } from "zod";
import { getDatabase } from "@/db";
import { applicationEvents, consents } from "@/db/schema";
import { ensureActorProfile, getActor } from "@/lib/auth";
import { getApplication, submitApplication } from "@/lib/application-service";
import { createConsentHash } from "@/lib/intelligence";

const submitSchema = z.object({
  purpose: z.string().min(5).max(240),
  scope: z.array(z.string().min(1).max(120)).min(1).max(100),
  method: z.enum(["otp", "passkey", "manual"]).default("manual"),
});

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const actor = await getActor();
  if (!actor) {
    return Response.json({ error: "Authentication required" }, { status: 401 });
  }

  const { id } = await params;
  const parsed = submitSchema.safeParse(await request.json());
  if (!parsed.success) {
    return Response.json({ error: "Consent purpose and scope are required" }, { status: 400 });
  }

  const profile = await ensureActorProfile(actor);
  const application = await getApplication(id, profile.id);
  if (!application) {
    return Response.json({ error: "Application not found" }, { status: 404 });
  }

  if (application.application.status === "submitted" && application.application.receiptCode) {
    const [existingConsent] = await getDatabase()
      .select({ consentHash: consents.consentHash })
      .from(consents)
      .where(and(eq(consents.applicationId, id), eq(consents.profileId, profile.id)))
      .orderBy(desc(consents.approvedAt))
      .limit(1);
    return Response.json({ application, consentHash: existingConsent?.consentHash ?? null, idempotent: true });
  }

  const unresolved = application.fields.filter(
    (field) => field.state === "missing" || field.state === "needs_confirmation",
  );
  if (unresolved.length > 0) {
    return Response.json(
      {
        error: "Application still needs confirmation",
        fields: unresolved.map((field) => field.requirementKey),
      },
      { status: 422 },
    );
  }

  const consentHash = createConsentHash({
    profileId: profile.id,
    applicationId: id,
    purpose: parsed.data.purpose,
    scope: parsed.data.scope,
    version: "2026-08-30",
  });

  const submitted = await submitApplication({
    applicationId: id,
    profileId: profile.id,
    purpose: parsed.data.purpose,
    scope: parsed.data.scope,
    consentHash,
    consentMethod: parsed.data.method,
  });

  if (!submitted) {
    return Response.json({ error: "Unable to submit application" }, { status: 500 });
  }

  return Response.json({ application: submitted, consentHash }, { status: 200 });
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const actor = await getActor();
  if (!actor) {
    return Response.json({ error: "Authentication required" }, { status: 401 });
  }

  const { id } = await params;
  const profile = await ensureActorProfile(actor);
  const db = getDatabase();
  const revokedAt = new Date();
  const revoked = await db
    .update(consents)
    .set({ revokedAt })
    .where(and(eq(consents.applicationId, id), eq(consents.profileId, profile.id)))
    .returning({ id: consents.id });

  if (revoked.length > 0) {
    await db.insert(applicationEvents).values({
      profileId: profile.id,
      applicationId: id,
      eventType: "consent_revoked",
      title: "Application consent revoked",
      description: "The previously approved sharing scope was revoked by the citizen.",
    });
  }

  return Response.json({ revoked: revoked.length > 0, revokedAt });
}
