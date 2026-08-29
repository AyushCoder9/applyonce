import { get } from "@vercel/blob";
import { and, eq } from "drizzle-orm";
import { getDatabase } from "@/db";
import { documents } from "@/db/schema";
import { ensureActorProfile, getActor } from "@/lib/auth";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const actor = await getActor();
  if (!actor) {
    return Response.json({ error: "Authentication required" }, { status: 401 });
  }

  const { id } = await params;
  const profile = await ensureActorProfile(actor);
  const [document] = await getDatabase()
    .select()
    .from(documents)
    .where(and(eq(documents.id, id), eq(documents.profileId, profile.id)))
    .limit(1);

  if (!document?.storageKey) {
    return Response.json({ error: "Document file not found" }, { status: 404 });
  }

  const blob = await get(document.storageKey, { access: "private" });
  if (!blob) {
    return Response.json({ error: "Document file not found" }, { status: 404 });
  }

  const responseHeaders = new Headers();
  blob.headers.forEach((value, key) => responseHeaders.set(key, value));
  return new Response(blob.stream, { headers: responseHeaders });
}
