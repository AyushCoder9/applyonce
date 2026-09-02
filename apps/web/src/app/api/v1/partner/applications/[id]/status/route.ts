import { z } from "zod";
import { randomUUID } from "node:crypto";
import { APPLICATION_STATUSES } from "@praman/schema";
import { handler, partner, body, ok } from "@/lib/api";
import { pushApplicationStatus } from "@/lib/webhooks";

/** POST /api/v1/partner/applications/:id/status {status, note, external_ref} — Idempotency-Key dedupes pushes. */
export const POST = handler(async (req, { params }) => {
  const { partner: p } = await partner(req);
  const b = await body(req, z.object({ status: z.enum(APPLICATION_STATUSES), note: z.string().max(1000).optional(), external_ref: z.string().max(120).optional() }));
  const key = req.headers.get("idempotency-key") ?? randomUUID();
  return ok(await pushApplicationStatus(p.id, params.id!, { status: b.status, note: b.note, externalRef: b.external_ref }, `${p.id}:${key}`));
});
