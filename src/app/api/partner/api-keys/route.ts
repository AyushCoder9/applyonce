import { z } from "zod";
import { createPartnerApiKey, getPartnerRequestContext, hasPartnerRole, listPartnerApiKeys } from "@/lib/partner-service";

const scopes = ["forms:read", "forms:write", "submissions:read", "submissions:write", "webhooks:read", "webhooks:write"] as const;
const apiKeySchema = z.object({
  name: z.string().min(2).max(80),
  scopes: z.array(z.enum(scopes)).min(1).max(scopes.length),
});

export async function GET(request: Request) {
  const context = await getPartnerRequestContext(request, "forms:read");
  if (!context) return Response.json({ error: "Partner workspace required" }, { status: 401 });
  const { organization } = context;
  return Response.json({ keys: await listPartnerApiKeys(organization.id) });
}

export async function POST(request: Request) {
  const context = await getPartnerRequestContext(request, "forms:write");
  if (!context) return Response.json({ error: "Partner workspace required" }, { status: 401 });
  const parsed = apiKeySchema.safeParse(await request.json());
  if (!parsed.success) return Response.json({ error: "Add a name and at least one valid scope." }, { status: 400 });
  const { organization, membership } = context;
  if (!hasPartnerRole(membership.role, ["owner", "admin", "developer"])) return Response.json({ error: "Only workspace admins or developers can create API keys" }, { status: 403 });
  const created = await createPartnerApiKey({ organizationId: organization.id, createdByClerkUserId: membership.clerkUserId ?? "partner_api_key", ...parsed.data });
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
