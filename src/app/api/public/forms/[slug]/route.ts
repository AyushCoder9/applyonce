import { getActor, ensureActorProfile } from "@/lib/auth";
import { getProfileClaims } from "@/lib/application-service";
import { getPublishedPartnerForm } from "@/lib/partner-service";

export async function GET(_request: Request, { params }: { params: Promise<{ slug: string }> }) {
  const result = await getPublishedPartnerForm((await params).slug);
  if (!result) return Response.json({ error: "Published form not found" }, { status: 404 });

  const actor = await getActor();
  const prefill: Record<string, string> = {};
  let viewer: { authenticated: boolean; fullName?: string; email?: string } = { authenticated: false };
  if (actor) {
    const profile = await ensureActorProfile(actor);
    const claims = await getProfileClaims(profile.id);
    const claimsByKey = new Map(claims.map(({ claim }) => [claim.key, claim.valueText]));
    for (const field of result.form.formSchema.fields) {
      const value = claimsByKey.get(field.profileKey ?? field.key);
      if (value) prefill[field.key] = value;
    }
    prefill.full_name ??= profile.fullName;
    prefill.email_address ??= profile.email;
    viewer = { authenticated: true, fullName: profile.fullName, email: profile.email };
  }

  const publicForm = {
    id: result.form.id,
    slug: result.form.slug,
    name: result.form.name,
    description: result.form.description,
    category: result.form.category,
    purpose: result.form.purpose,
    version: result.form.version,
    publishedAt: result.form.publishedAt,
    formSchema: result.form.formSchema,
    branding: result.form.branding,
  };
  return Response.json({ form: publicForm, organization: { name: result.organization.name, slug: result.organization.slug }, prefill, viewer });
}
