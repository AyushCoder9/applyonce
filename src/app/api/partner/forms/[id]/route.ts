import { z } from "zod";
import { getPartnerRequestContext, getPartnerForm, hasPartnerRole, updatePartnerForm } from "@/lib/partner-service";

const updateSchema = z.object({
  name: z.string().min(3).max(160).optional(),
  description: z.string().min(10).max(500).optional(),
  category: z.string().min(2).max(80).optional(),
  purpose: z.string().min(5).max(240).optional(),
  formSchema: z.object({
    fields: z.array(z.object({ key: z.string().min(1).max(80), label: z.string().min(1).max(160), type: z.string().min(1).max(40), required: z.boolean(), profileKey: z.string().max(80).optional(), helpText: z.string().max(240).optional() })).max(80),
    documents: z.array(z.object({ key: z.string().min(1).max(80), label: z.string().min(1).max(160), required: z.boolean() })).max(30),
  }).optional(),
  branding: z.object({ accentColor: z.string().max(30).optional(), logoUrl: z.string().url().max(500).optional(), organizationName: z.string().max(160).optional() }).optional(),
});

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const context = await getPartnerRequestContext(request, "forms:read");
  if (!context) return Response.json({ error: "Authentication required" }, { status: 401 });
  const { organization } = context;
  const form = await getPartnerForm((await params).id, organization.id);
  return form ? Response.json({ form }) : Response.json({ error: "Form not found" }, { status: 404 });
}

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const context = await getPartnerRequestContext(request, "forms:write");
  if (!context) return Response.json({ error: "Authentication required" }, { status: 401 });
  const parsed = updateSchema.safeParse(await request.json());
  if (!parsed.success) return Response.json({ error: "The form update is not valid." }, { status: 400 });
  const { organization, membership, apiKey } = context;
  if (!apiKey && !hasPartnerRole(membership.role, ["owner", "admin"])) return Response.json({ error: "Only workspace admins can edit forms" }, { status: 403 });
  const form = await updatePartnerForm({ id: (await params).id, organizationId: organization.id, ...parsed.data });
  return form ? Response.json({ form }) : Response.json({ error: "Form not found" }, { status: 404 });
}
