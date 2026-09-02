import { z } from "zod";
import { handler, partner, ok, ApiError } from "@/lib/api";
import { queueWebhook, flushDeliveries } from "@/lib/webhooks";

/** POST /api/v1/partner/webhooks/test {webhook_id?} — queues a `test.ping` delivery to every active endpoint (or one). */
export const POST = handler(async (req) => {
  const { partner: p, env } = await partner(req);
  const text = await req.text();
  const b = z.object({ webhook_id: z.uuid().optional() }).parse(text ? JSON.parse(text) : {});
  const ids = await queueWebhook(p.id, "test.ping", { partner_id: p.id, env, message: "Hello from Praman" }, undefined, { webhookId: b.webhook_id });
  if (!ids.length) throw new ApiError(404, "NO_WEBHOOKS", "Add a webhook endpoint under Developers first");
  await flushDeliveries(ids);
  return ok({ delivery_ids: ids });
});
