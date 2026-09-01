import { getPartnerRequestContext, hasPartnerRole } from "@/lib/partner-service";
import { partnerWebhookDeliveryWorkflow } from "@/workflows/partner-webhook-delivery";
import { start } from "workflow/api";

export async function POST(request: Request) {
  const context = await getPartnerRequestContext(request, "webhooks:write");
  if (!context) return Response.json({ error: "Authentication required" }, { status: 401 });
  const { organization, membership, apiKey } = context;
  if (!apiKey && !hasPartnerRole(membership.role, ["owner", "admin", "developer"])) return Response.json({ error: "Only workspace admins or developers can process webhooks" }, { status: 403 });
  const run = await start(partnerWebhookDeliveryWorkflow, [organization.id]);
  const result = await run.returnValue;
  return Response.json({ result, workflowRunId: run.runId });
}
