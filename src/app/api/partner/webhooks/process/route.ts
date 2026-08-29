import { getPartnerRequestContext, hasPartnerRole, processPartnerWebhookDeliveries } from "@/lib/partner-service";

export async function POST(request: Request) {
  const context = await getPartnerRequestContext(request, "webhooks:write");
  if (!context) return Response.json({ error: "Authentication required" }, { status: 401 });
  const { organization, membership, apiKey } = context;
  if (!apiKey && !hasPartnerRole(membership.role, ["owner", "admin", "developer"])) return Response.json({ error: "Only workspace admins or developers can process webhooks" }, { status: 403 });
  return Response.json({ result: await processPartnerWebhookDeliveries(organization.id) });
}
