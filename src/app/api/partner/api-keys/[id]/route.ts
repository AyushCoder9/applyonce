import { getActor } from "@/lib/auth";
import { ensurePartnerOrganization, hasPartnerRole, revokePartnerApiKey } from "@/lib/partner-service";

export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const actor = await getActor();
  if (!actor) return Response.json({ error: "Authentication required" }, { status: 401 });
  const { organization, membership } = await ensurePartnerOrganization(actor);
  if (!hasPartnerRole(membership.role, ["owner", "admin", "developer"])) return Response.json({ error: "Only workspace admins or developers can revoke API keys" }, { status: 403 });
  const key = await revokePartnerApiKey((await params).id, organization.id);
  return key ? Response.json({ revoked: true }) : Response.json({ error: "API key not found or already revoked" }, { status: 404 });
}
