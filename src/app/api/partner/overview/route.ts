import { getPartnerRequestContext, listPartnerForms, listPartnerSubmissions } from "@/lib/partner-service";

export async function GET(request: Request) {
  const context = await getPartnerRequestContext(request, "forms:read");
  if (!context) return Response.json({ error: "Authentication required" }, { status: 401 });
  const { organization, membership } = context;
  const [forms, submissions] = await Promise.all([
    listPartnerForms(organization.id),
    listPartnerSubmissions(organization.id),
  ]);

  return Response.json({
    organization: { id: organization.id, name: organization.name, slug: organization.slug, kind: organization.kind },
    membership: { role: membership.role },
    forms,
    submissions,
    metrics: {
      publishedForms: forms.filter((form) => form.status === "published").length,
      submissions: submissions.length,
      needsReview: submissions.filter(({ submission }) => submission.status === "received" || submission.status === "under_review").length,
      needsDocuments: submissions.filter(({ submission }) => submission.status === "needs_documents").length,
    },
  });
}
