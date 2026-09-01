import { desc, eq } from "drizzle-orm";
import { z } from "zod";
import { getDatabase } from "@/db";
import { organizations, platformAuditEvents } from "@/db/schema";
import { getPlatformOperator } from "@/lib/ops-auth";

const updateSchema = z.object({
  organizationId: z.string().uuid(),
  status: z.enum(["approved", "suspended", "rejected"]),
  reason: z.string().trim().min(8).max(500),
});

export async function GET() {
  const operator = await getPlatformOperator();
  if (!operator) return Response.json({ error: "Platform operator access required" }, { status: 403 });
  const partners = await getDatabase().select().from(organizations).orderBy(desc(organizations.createdAt));
  return Response.json({ partners });
}

export async function PATCH(request: Request) {
  const operator = await getPlatformOperator();
  if (!operator) return Response.json({ error: "Platform operator access required" }, { status: 403 });
  const parsed = updateSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return Response.json({ error: "A valid status and review reason are required", fields: parsed.error.flatten().fieldErrors }, { status: 400 });

  const db = getDatabase();
  const [updated] = await db.transaction(async (tx) => {
    const changed = await tx
      .update(organizations)
      .set({ status: parsed.data.status, updatedAt: new Date() })
      .where(eq(organizations.id, parsed.data.organizationId))
      .returning();
    if (!changed[0]) return [];
    await tx.insert(platformAuditEvents).values({
      actorClerkUserId: operator.userId,
      action: `organization.${parsed.data.status}`,
      targetType: "organization",
      targetId: parsed.data.organizationId,
      metadata: { reason: parsed.data.reason, previousStatus: "reviewed" },
    });
    return changed;
  });

  if (!updated) return Response.json({ error: "Organization not found" }, { status: 404 });
  return Response.json({ organization: updated });
}
