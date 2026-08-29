import { and, desc, eq } from "drizzle-orm";
import { getDatabase } from "@/db";
import { partnerWebhookDeliveries, partnerWebhooks } from "@/db/schema";
import { getPartnerRequestContext } from "@/lib/partner-service";

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const context = await getPartnerRequestContext(request, "webhooks:read");
  if (!context) return Response.json({ error: "Authentication required" }, { status: 401 });
  const { organization } = context;
  const webhookId = (await params).id;
  const rows = await getDatabase()
    .select({ delivery: partnerWebhookDeliveries })
    .from(partnerWebhookDeliveries)
    .innerJoin(partnerWebhooks, eq(partnerWebhookDeliveries.webhookId, partnerWebhooks.id))
    .where(and(eq(partnerWebhookDeliveries.webhookId, webhookId), eq(partnerWebhooks.organizationId, organization.id)))
    .orderBy(desc(partnerWebhookDeliveries.createdAt))
    .limit(50);
  return Response.json({ deliveries: rows.map(({ delivery }) => delivery) });
}
