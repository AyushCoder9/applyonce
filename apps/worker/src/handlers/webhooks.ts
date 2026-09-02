/** webhooks queue: webhook.deliver — HMAC POST, DB-tracked retries (5 attempts, exponential via BullMQ opts set by the producer) */
import { db, eq, systemDek, webhookDeliveries, partnerWebhooks } from "@praman/db";
import { decryptString, signWebhook } from "@praman/crypto";
import type { JobMap } from "@praman/jobs";

const MAX_ATTEMPTS = 5;
const TIMEOUT_MS = 10_000;

export async function webhookDeliver(data: JobMap["webhook.deliver"]) {
  const { deliveryId } = data;
  const delivery = await db.query.webhookDeliveries.findFirst({ where: eq(webhookDeliveries.id, deliveryId) });
  if (!delivery) throw new Error(`webhook_delivery ${deliveryId} not found`);
  const hook = await db.query.partnerWebhooks.findFirst({ where: eq(partnerWebhooks.id, delivery.webhookId) });
  if (!hook) throw new Error(`partner_webhook ${delivery.webhookId} not found`);

  const secret = decryptString(systemDek(), hook.secretEnc, `webhook:${hook.partnerId}`);
  const body = JSON.stringify(delivery.payload);
  const { ts, sig } = signWebhook(secret, body);
  const attempts = delivery.attempts + 1;
  const isFinalAttempt = attempts >= MAX_ATTEMPTS;

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
  let res: Response;
  try {
    res = await fetch(hook.url, {
      method: "POST",
      headers: { "content-type": "application/json", "X-Praman-Timestamp": String(ts), "X-Praman-Signature": sig, "X-Praman-Event": delivery.event, "Idempotency-Key": deliveryId },
      body,
      signal: controller.signal,
    });
  } catch (err) {
    const message = (err as Error).message ?? String(err);
    await db.update(webhookDeliveries).set({ attempts, lastError: message, status: isFinalAttempt ? "failed" : "pending" }).where(eq(webhookDeliveries.id, deliveryId));
    throw err;
  } finally {
    clearTimeout(timer);
  }

  if (res.ok) {
    await db.update(webhookDeliveries).set({ status: "delivered", attempts, responseStatus: res.status, lastError: null }).where(eq(webhookDeliveries.id, deliveryId));
    return { status: "delivered", responseStatus: res.status };
  }
  const text = await res.text().catch(() => "");
  await db.update(webhookDeliveries).set({ attempts, responseStatus: res.status, lastError: text.slice(0, 500) || `HTTP ${res.status}`, status: isFinalAttempt ? "failed" : "pending" }).where(eq(webhookDeliveries.id, deliveryId));
  throw new Error(`webhook ${hook.url} responded ${res.status}`);
}
