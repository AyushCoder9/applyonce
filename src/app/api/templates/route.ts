import { asc, eq } from "drizzle-orm";
import { getDatabase } from "@/db";
import { applicationRequirements, applicationTemplates } from "@/db/schema";

export async function GET() {
  const db = getDatabase();
  const templates = await db
    .select()
    .from(applicationTemplates)
    .where(eq(applicationTemplates.active, true))
    .orderBy(asc(applicationTemplates.name));

  const requirements = await db
    .select()
    .from(applicationRequirements)
    .orderBy(asc(applicationRequirements.sortOrder));

  return Response.json({
    templates: templates.map((template) => ({
      ...template,
      requirements: requirements.filter((requirement) => requirement.templateId === template.id),
    })),
  });
}
