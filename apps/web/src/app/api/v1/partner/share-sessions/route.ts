import { z } from "zod";
import { db, t, and, eq } from "@applyonce/db";
import { randomToken } from "@applyonce/crypto";
import { handler, partner, body, ok, idempotent, ApiError } from "@/lib/api";
import { SESSION_TTL_MS } from "@/lib/share";
import { deploymentAppUrl } from "@/lib/urls";

const isUuid = (s: string) => /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(s);

/** POST /api/v1/partner/share-sessions {form_id|form_slug, return_url, state} → {share_url, session_id, expires_at} */
export const POST = handler(async (req) => {
  const { partner: p, env } = await partner(req);
  const b = await body(req, z.object({ form_id: z.string().optional(), form_slug: z.string().optional(), return_url: z.url(), state: z.string().max(512).optional() }));
  const ref = b.form_id ?? b.form_slug;
  if (!ref) throw new ApiError(422, "VALIDATION", "form_id or form_slug is required", { form_id: "Required" });
  return ok(await idempotent(req, `share-sessions:${p.id}`, async () => {
    const form = await db.query.forms.findFirst({ where: and(eq(t.forms.partnerId, p.id), isUuid(ref) ? eq(t.forms.id, ref) : eq(t.forms.slug, ref)) });
    if (!form) throw new ApiError(404, "FORM_NOT_FOUND", "No form with that id or slug belongs to this partner");
    if (form.status !== "live") throw new ApiError(409, "FORM_NOT_LIVE", "Publish the form before creating share sessions");
    if (form.deadlineAt && form.deadlineAt.getTime() <= Date.now()) throw new ApiError(409,"FORM_CLOSED","The deadline has passed.");
    const returnUrl = new URL(b.return_url);
    const app = deploymentAppUrl();
    const allowedOrigins = [new URL(form.redirectUrl).origin];
    if (env === "sandbox") allowedOrigins.push(new URL(app).origin);
    if (!allowedOrigins.includes(returnUrl.origin) || returnUrl.username || returnUrl.password || !["https:","http:"].includes(returnUrl.protocol)) throw new ApiError(422,"RETURN_URL_NOT_ALLOWED","Return URL must use the registered form redirect origin.");
    const token = randomToken(32);
    const expiresAt = new Date(Date.now() + SESSION_TTL_MS);
    const [s] = await db.insert(t.shareSessions).values({ partnerId: p.id, formId: form.id, token, returnUrl: b.return_url, state: b.state ?? null, env, expiresAt }).returning({ id: t.shareSessions.id });
    return { session_id: s!.id, share_url: `${app}/share/${token}`, expires_at: expiresAt.toISOString(), env };
  }));
});
