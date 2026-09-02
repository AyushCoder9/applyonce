import { z } from "zod";
import { db, t, eq } from "@praman/db";
import { handler, ok, body, log, ApiError } from "@/lib/api";
import { adminApi } from "../../../_auth";
export const POST = handler(async (req, { params }) => {
  const s = await adminApi();
  const { status, note } = await body(req, z.object({ status: z.enum(["pending", "verified", "suspended"]), note: z.string().max(500).optional() }));
  const [p] = await db.update(t.partners).set({ status }).where(eq(t.partners.id, params.id!)).returning({ id: t.partners.id, status: t.partners.status });
  if (!p) throw new ApiError(404, "PARTNER_NOT_FOUND");
  await log(s, `admin.partner.${status}`, "partner", p.id, { note });
  return ok(p);
});
