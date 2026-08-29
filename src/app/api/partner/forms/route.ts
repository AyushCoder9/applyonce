import { z } from "zod";
import { createPartnerForm, getPartnerRequestContext, hasPartnerRole, listPartnerForms } from "@/lib/partner-service";

const fieldSchema = z.object({
  key: z.string().min(1).max(80),
  label: z.string().min(1).max(160),
  type: z.string().min(1).max(40),
  required: z.boolean().default(false),
  profileKey: z.string().max(80).optional(),
  helpText: z.string().max(240).optional(),
});

const formSchema = z.object({
  name: z.string().min(3).max(160),
  description: z.string().min(10).max(500),
  category: z.string().min(2).max(80),
  purpose: z.string().min(5).max(240),
  formSchema: z.object({
    fields: z.array(fieldSchema).max(80).default([]),
    documents: z.array(z.object({ key: z.string().min(1).max(80), label: z.string().min(1).max(160), required: z.boolean().default(true) })).max(30).default([]),
  }).optional(),
});

export async function GET(request: Request) {
  const context = await getPartnerRequestContext(request, "forms:read");
  if (!context) return Response.json({ error: "Authentication required" }, { status: 401 });
  const { organization } = context;
  return Response.json({ forms: await listPartnerForms(organization.id), organization });
}

export async function POST(request: Request) {
  const context = await getPartnerRequestContext(request, "forms:write");
  if (!context) return Response.json({ error: "Authentication required" }, { status: 401 });
  const parsed = formSchema.safeParse(await request.json());
  if (!parsed.success) return Response.json({ error: "Add a name, description, purpose, and category to create a form." }, { status: 400 });
  const { organization, membership, apiKey } = context;
  if (!apiKey && !hasPartnerRole(membership.role, ["owner", "admin"])) return Response.json({ error: "Only workspace admins can create forms" }, { status: 403 });
  const form = await createPartnerForm({ ...parsed.data, organizationId: organization.id, createdByClerkUserId: membership.clerkUserId ?? "partner_api_key" });
  return Response.json({ form }, { status: 201 });
}
