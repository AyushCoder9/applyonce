import { z } from "zod";
import { db, t, and, eq } from "@praman/db";
import { randomToken } from "@praman/crypto";
import { handler, partner, body, ok, idempotent, ApiError } from "@/lib/api";
import { SESSION_TTL_MS } from "@/lib/share";

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
    const token = randomToken(32);
    const expiresAt = new Date(Date.now() + SESSION_TTL_MS);
    const [s] = await db.insert(t.shareSessions).values({ partnerId: p.id, formId: form.id, token, returnUrl: b.return_url, state: b.state ?? null, env, expiresAt }).returning({ id: t.shareSessions.id });
    return { session_id: s!.id, share_url: `${process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3300"}/share/${token}`, expires_at: expiresAt.toISOString(), env };
  }));
});
