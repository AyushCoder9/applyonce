import { z } from "zod";
import { isFactKey } from "@praman/schema";
import { handler, partner, body, ok, idempotent, ApiError } from "@/lib/api";
import { createVerificationRequest } from "@/lib/webhooks";

/** POST /api/v1/partner/verification-requests {application_id, fact_keys, reason} */
export const POST = handler(async (req) => {
  const { partner: p } = await partner(req);
  const b = await body(req, z.object({ application_id: z.uuid(), fact_keys: z.array(z.string()).min(1).max(50), reason: z.string().max(500).optional() }));
  const bad = b.fact_keys.filter((k) => !isFactKey(k));
  if (bad.length) throw new ApiError(422, "UNKNOWN_FACT_KEY", `Unknown fact keys: ${bad.join(", ")}`, Object.fromEntries(bad.map((k) => [k, "Unknown fact_key"])));
  return ok(await idempotent(req, `verification-requests:${p.id}`, async () => {
    const r = await createVerificationRequest(p.id, { applicationId: b.application_id, factKeys: b.fact_keys, reason: b.reason });
    return { id: r.id, application_id: r.applicationId, fact_keys: r.factKeys, status: r.status, created_at: r.createdAt.toISOString() };
  }));
});
