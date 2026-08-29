import { desc, eq } from "drizzle-orm";
import { z } from "zod";
import { getDatabase } from "@/db";
import { partnerWebhooks } from "@/db/schema";
import { createWebhook, getPartnerRequestContext, hasPartnerRole } from "@/lib/partner-service";

const webhookSchema = z.object({ url: z.string().url().max(500), events: z.array(z.enum(["application.submitted", "application.status_changed", "application.document_requested", "application.document_uploaded", "application.completed", "application.withdrawn"])).min(1).max(20) });

export async function GET(request: Request) {
  const context = await getPartnerRequestContext(request, "webhooks:read");
  if (!context) return Response.json({ error: "Authentication required" }, { status: 401 });
  const { organization } = context;
  const rows = await getDatabase().select().from(partnerWebhooks).where(eq(partnerWebhooks.organizationId, organization.id)).orderBy(desc(partnerWebhooks.createdAt));
  const webhooks = rows.map(({ id, url, events, active, lastDeliveryAt, lastError, createdAt }) => ({ id, url, events, active, lastDeliveryAt, lastError, createdAt }));
  return Response.json({ webhooks });
}

export async function POST(request: Request) {
  const context = await getPartnerRequestContext(request, "webhooks:write");
  if (!context) return Response.json({ error: "Authentication required" }, { status: 401 });
  const parsed = webhookSchema.safeParse(await request.json());
  if (!parsed.success) return Response.json({ error: "Add a valid webhook URL and at least one event." }, { status: 400 });
  const { organization, membership, apiKey } = context;
  if (!apiKey && !hasPartnerRole(membership.role, ["owner", "admin", "developer"])) return Response.json({ error: "Only workspace admins or developers can add webhooks" }, { status: 403 });
  try {
    const created = await createWebhook({ organizationId: organization.id, ...parsed.data });
    return Response.json(created, { status: 201 });
  } catch (error) {
    return Response.json({ error: error instanceof Error ? error.message : "Unable to add webhook" }, { status: 400 });
  }
}
