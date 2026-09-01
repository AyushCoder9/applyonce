import { getPartnerRequestContext, getPartnerForm, hasPartnerRole, publishPartnerForm } from "@/lib/partner-service";

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const context = await getPartnerRequestContext(request, "forms:write");
  if (!context) return Response.json({ error: "Authentication required" }, { status: 401 });
  const { organization, membership, apiKey } = context;
  if (!apiKey && !hasPartnerRole(membership.role, ["owner", "admin"])) return Response.json({ error: "Only workspace admins can publish forms" }, { status: 403 });
  if (organization.status !== "approved") return Response.json({ error: "Your organization must be approved before publishing a public form." }, { status: 403 });
  const formId = (await params).id;
  const draft = await getPartnerForm(formId, organization.id);
  if (!draft) return Response.json({ error: "Form not found" }, { status: 404 });
  if (draft.formSchema.fields.length === 0) return Response.json({ error: "Add at least one field before publishing" }, { status: 422 });
  const form = await publishPartnerForm(formId, organization.id, membership.clerkUserId ?? "partner_api_key");
  return form ? Response.json({ form }) : Response.json({ error: "Form not found" }, { status: 404 });
}
