import { del } from "@vercel/blob";
import { and, eq } from "drizzle-orm";
import { getDatabase } from "@/db";
import { documents } from "@/db/schema";
import { ensureActorProfile, getActor } from "@/lib/auth";

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const actor = await getActor();
  if (!actor) {
    return Response.json({ error: "Authentication required" }, { status: 401 });
  }

  const { id } = await params;
  const profile = await ensureActorProfile(actor);
  const db = getDatabase();
  const [document] = await db
    .select()
    .from(documents)
    .where(and(eq(documents.id, id), eq(documents.profileId, profile.id)))
    .limit(1);

  if (!document) {
    return Response.json({ error: "Document not found" }, { status: 404 });
  }

  if (document.storageKey) {
    await del(document.storageKey);
  }
  await db.delete(documents).where(eq(documents.id, document.id));

  return Response.json({ deleted: true });
}
