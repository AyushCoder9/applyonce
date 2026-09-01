import { getPartnerRequestContext, hasPartnerRole, revokePartnerApiKey } from "@/lib/partner-service";

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const context = await getPartnerRequestContext(request, "forms:write");
  if (!context) return Response.json({ error: "Partner workspace required" }, { status: 401 });
  const { organization, membership } = context;
  if (!hasPartnerRole(membership.role, ["owner", "admin", "developer"])) return Response.json({ error: "Only workspace admins or developers can revoke API keys" }, { status: 403 });
  const key = await revokePartnerApiKey((await params).id, organization.id);
  return key ? Response.json({ revoked: true }) : Response.json({ error: "API key not found or already revoked" }, { status: 404 });
}
