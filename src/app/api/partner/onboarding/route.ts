import { z } from "zod";
import { getActor } from "@/lib/auth";
import { createPartnerOrganization, findPartnerOrganization } from "@/lib/partner-service";

const onboardingSchema = z.object({
  name: z.string().min(3).max(180),
  kind: z.enum(["education_partner", "exam_organizer", "scholarship_provider", "public_service", "employer", "healthcare_administration"]),
  contactEmail: z.string().email().max(240),
  domain: z.string().max(180).regex(/^[a-z0-9.-]+$/i, "Enter a domain without https://").nullable().optional(),
  acceptTerms: z.literal(true),
});

export async function GET() {
  const actor = await getActor();
  if (!actor) return Response.json({ error: "Authentication required" }, { status: 401 });
  const context = await findPartnerOrganization(actor);
  return Response.json({ organization: context?.organization ?? null, membership: context?.membership ?? null });
}

export async function POST(request: Request) {
  const actor = await getActor();
  if (!actor) return Response.json({ error: "Authentication required" }, { status: 401 });
  const parsed = onboardingSchema.safeParse(await request.json());
  if (!parsed.success) return Response.json({ error: "Add valid organization details and accept the partner terms." }, { status: 400 });
  const created = await createPartnerOrganization({
    actor,
    name: parsed.data.name.trim(),
    kind: parsed.data.kind,
    contactEmail: parsed.data.contactEmail.toLowerCase(),
    verifiedDomain: parsed.data.domain?.toLowerCase() || null,
  });
  return Response.json({ organization: created.organization, membership: created.membership, approvalRequired: created.organization.status !== "approved" }, { status: 201 });
}
