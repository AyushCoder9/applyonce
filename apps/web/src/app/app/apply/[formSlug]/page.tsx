import { redirect, notFound } from "next/navigation";
import { db, t, and, eq } from "@praman/db";
import { randomToken } from "@praman/crypto";
import { requireUser } from "@/lib/session";
import { SESSION_TTL_MS } from "@/lib/share";

/** Citizen-initiated share: creates a session for the form (return URL = the form’s redirect URL) and enters the consent flow. */
export default async function StartApply({ params }: { params: Promise<{ formSlug: string }> }) {
  await requireUser("/app/apply");
  const { formSlug } = await params;
  const form = await db.query.forms.findFirst({ where: and(eq(t.forms.slug, formSlug), eq(t.forms.status, "live")) });
  if (!form) notFound();
  const token = randomToken(32);
  await db.insert(t.shareSessions).values({ partnerId: form.partnerId, formId: form.id, token, returnUrl: form.redirectUrl, state: `catalog:${form.slug}`, env: "live", expiresAt: new Date(Date.now() + SESSION_TTL_MS) });
  redirect(`/share/${token}`);
}
