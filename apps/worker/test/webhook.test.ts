/** webhook.deliver against a local HTTP server that checks the HMAC (real S3/DB not needed for the network hop, but the delivery + secret live in the real DB). */
import http from "node:http";
import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { db, eq, sql, partners, partnerWebhooks, webhookDeliveries, systemDek } from "@applyonce/db";
import { encrypt, verifyWebhook } from "@applyonce/crypto";
import { runInline } from "../src/inline";

const SECRET = "whsec_test_0001";
let server: http.Server;
let port: number;
let received: { valid: boolean; event?: string; idempotencyKey?: string } | null = null;

let partnerId: string;
let webhookId: string;
let deliveryId: string;

beforeAll(async () => {
  server = http.createServer((req, res) => {
    let body = "";
    req.on("data", (c) => (body += c));
    req.on("end", () => {
      const sig = String(req.headers["x-applyonce-signature"] ?? "");
      const ts = String(req.headers["x-applyonce-timestamp"] ?? "");
      received = { valid: verifyWebhook(SECRET, body, sig, ts), event: String(req.headers["x-applyonce-event"]), idempotencyKey: String(req.headers["idempotency-key"]) };
      res.writeHead(200, { "content-type": "application/json" }).end(JSON.stringify({ ok: true }));
    });
  });
  await new Promise<void>((resolve) => server.listen(0, resolve));
  port = (server.address() as { port: number }).port;

  const [partner] = await db.insert(partners).values({ slug: `test-webhook-${Date.now()}`, name: "Test Webhook Partner", kind: "other", status: "verified" }).returning();
  partnerId = partner!.id;
  const [hook] = await db.insert(partnerWebhooks).values({ partnerId, url: `http://127.0.0.1:${port}/webhook`, secretEnc: encrypt(systemDek(), SECRET, `webhook:${partnerId}`) }).returning();
  webhookId = hook!.id;
  const [delivery] = await db.insert(webhookDeliveries).values({ webhookId, event: "share.completed", payload: { test: true, ts: Date.now() } }).returning();
  deliveryId = delivery!.id;
});

afterAll(async () => {
  await new Promise<void>((resolve) => server.close(() => resolve()));
  await db.delete(webhookDeliveries).where(eq(webhookDeliveries.id, deliveryId));
  await db.delete(partnerWebhooks).where(eq(partnerWebhooks.id, webhookId));
  await db.delete(partners).where(eq(partners.id, partnerId));
  await sql.end();
});

describe("webhook.deliver", () => {
  it("signs the payload with a verifiable HMAC and marks the delivery delivered", async () => {
    const result = (await runInline("webhook.deliver", { deliveryId })) as { status: string; responseStatus: number };
    expect(result.status).toBe("delivered");
    expect(result.responseStatus).toBe(200);
    expect(received?.valid).toBe(true);
    expect(received?.event).toBe("share.completed");
    expect(received?.idempotencyKey).toBe(deliveryId);

    const row = await db.query.webhookDeliveries.findFirst({ where: eq(webhookDeliveries.id, deliveryId) });
    expect(row?.status).toBe("delivered");
    expect(row?.responseStatus).toBe(200);
  });
});
