import { asc, eq } from "drizzle-orm";
import { getDatabase } from "@/db";
import { organizationMembers } from "@/db/schema";
import { getPartnerRequestContext } from "@/lib/partner-service";

export async function GET(request: Request) {
  const context = await getPartnerRequestContext(request, "forms:read");
  if (!context) return Response.json({ error: "Authentication required" }, { status: 401 });

  const members = await getDatabase()
    .select({ id: organizationMembers.id, email: organizationMembers.email, role: organizationMembers.role, createdAt: organizationMembers.createdAt, updatedAt: organizationMembers.updatedAt })
    .from(organizationMembers)
    .where(eq(organizationMembers.organizationId, context.organization.id))
    .orderBy(asc(organizationMembers.createdAt));

  return Response.json({ members });
}
