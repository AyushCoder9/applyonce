import { z } from "zod";
import { getPartnerRequestContext, hasPartnerRole, updatePartnerSubmissionStatus } from "@/lib/partner-service";

const statusSchema = z.object({ status: z.enum(["received", "under_review", "needs_documents", "accepted", "rejected", "completed"]) });

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const context = await getPartnerRequestContext(request, "submissions:write");
  if (!context) return Response.json({ error: "Authentication required" }, { status: 401 });
  const parsed = statusSchema.safeParse(await request.json());
  if (!parsed.success) return Response.json({ error: "Invalid submission status" }, { status: 400 });
  const { organization, membership, apiKey } = context;
  if (!apiKey && !hasPartnerRole(membership.role, ["owner", "admin", "reviewer", "support"])) return Response.json({ error: "You do not have permission to update submissions" }, { status: 403 });
  const submission = await updatePartnerSubmissionStatus({ id: (await params).id, organizationId: organization.id, status: parsed.data.status });
  return submission ? Response.json({ submission }) : Response.json({ error: "Submission not found" }, { status: 404 });
}
