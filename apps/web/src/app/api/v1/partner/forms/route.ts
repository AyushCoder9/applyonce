import { db, t, eq, desc } from "@praman/db";
import { handler, partner, ok, idempotent } from "@/lib/api";
import { saveForm, publicForm } from "@/components/partner/forms";

/** GET /api/v1/partner/forms */
export const GET = handler(async (req) => {
  const { partner: p } = await partner(req);
  const rows = await db.select().from(t.forms).where(eq(t.forms.partnerId, p.id)).orderBy(desc(t.forms.createdAt));
  return ok(rows.map(publicForm));
});

/** POST /api/v1/partner/forms — unknown or purpose-blocked keys → 422 listing them. */
export const POST = handler(async (req) => {
  const { partner: p } = await partner(req);
  const raw = await req.json().catch(() => ({}));
  return ok(await idempotent(req, `forms:${p.id}`, async () => publicForm(await saveForm(p.id, raw))), { status: 201 });
});
