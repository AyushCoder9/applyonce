import { z } from "zod";
import { getActor } from "@/lib/auth";
import { createPartnerApiKey, ensurePartnerOrganization, hasPartnerRole, listPartnerApiKeys } from "@/lib/partner-service";

const scopes = ["forms:read", "forms:write", "submissions:read", "submissions:write", "webhooks:read", "webhooks:write"] as const;
const apiKeySchema = z.object({
  name: z.string().min(2).max(80),
  scopes: z.array(z.enum(scopes)).min(1).max(scopes.length),
});

export async function GET() {
  const actor = await getActor();
  if (!actor) return Response.json({ error: "Authentication required" }, { status: 401 });
  const { organization } = await ensurePartnerOrganization(actor);
  return Response.json({ keys: await listPartnerApiKeys(organization.id) });
}

export async function POST(request: Request) {
  const actor = await getActor();
  if (!actor) return Response.json({ error: "Authentication required" }, { status: 401 });
  const parsed = apiKeySchema.safeParse(await request.json());
  if (!parsed.success) return Response.json({ error: "Add a name and at least one valid scope." }, { status: 400 });
  const { organization, membership } = await ensurePartnerOrganization(actor);
  if (!hasPartnerRole(membership.role, ["owner", "admin", "developer"])) return Response.json({ error: "Only workspace admins or developers can create API keys" }, { status: 403 });
  const created = await createPartnerApiKey({ organizationId: organization.id, createdByClerkUserId: actor.clerkUserId, ...parsed.data });
  if (!created) return Response.json({ error: "The API key could not be created" }, { status: 500 });
  const { key } = created;
  return Response.json({
    key: {
      id: key.id,
      name: key.name,
      keyPrefix: key.keyPrefix,
      scopes: key.scopes,
      expiresAt: key.expiresAt,
      createdAt: key.createdAt,
    },
    secret: created.secret,
    note: "Save this secret now. It cannot be recovered after this response.",
  }, { status: 201 });
}
