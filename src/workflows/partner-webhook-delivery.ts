import { processPartnerWebhookDeliveries } from "@/lib/partner-service";

async function deliverPendingWebhooks(organizationId: string) {
  "use step";

  return processPartnerWebhookDeliveries(organizationId);
}

export async function partnerWebhookDeliveryWorkflow(organizationId: string) {
  "use workflow";

  console.log("Starting partner webhook delivery workflow", { organizationId });
  return deliverPendingWebhooks(organizationId);
}
