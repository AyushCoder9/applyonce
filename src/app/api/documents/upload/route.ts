import { handleUpload } from "@vercel/blob/client";
import { and, eq } from "drizzle-orm";
import { z } from "zod";
import { getDatabase } from "@/db";
import { documents } from "@/db/schema";
import { ensureActorProfile, getActor } from "@/lib/auth";

const clientPayloadSchema = z.object({
  title: z.string().min(1).max(180),
  documentType: z.string().min(1).max(120),
  provider: z.enum(["meripehchaan", "digilocker", "apaar", "manual"]),
});

export async function POST(request: Request) {
  const actor = await getActor();
  if (!actor) {
    return Response.json({ error: "Authentication required" }, { status: 401 });
  }

  const profile = await ensureActorProfile(actor);
  const db = getDatabase();

  try {
    const response = await handleUpload({
      request,
      body: await request.json(),
      token: process.env.BLOB_READ_WRITE_TOKEN,
      onBeforeGenerateToken: async (pathname, clientPayload) => {
        const parsed = clientPayloadSchema.safeParse(
          clientPayload ? JSON.parse(clientPayload) : null,
        );
        if (!parsed.success || !pathname.startsWith("documents/")) {
          throw new Error("Invalid private document upload request");
        }

        const [document] = await db
          .insert(documents)
          .values({
            profileId: profile.id,
            title: parsed.data.title,
            documentType: parsed.data.documentType,
            provider: parsed.data.provider,
            status: "pending",
          })
          .returning({ id: documents.id });

        if (!document) {
          throw new Error("Unable to reserve document record");
        }

        return {
          allowedContentTypes: ["application/pdf", "image/jpeg", "image/png"],
          maximumSizeInBytes: 10 * 1024 * 1024,
          validUntil: Date.now() + 10 * 60 * 1000,
          addRandomSuffix: true,
          tokenPayload: JSON.stringify({ documentId: document.id, profileId: profile.id }),
        };
      },
      onUploadCompleted: async ({ blob, tokenPayload }) => {
        const payload = z
          .object({ documentId: z.string().uuid(), profileId: z.string().uuid() })
          .parse(JSON.parse(tokenPayload ?? "{}"));

        await db
          .update(documents)
          .set({ storageKey: blob.pathname, checksum: blob.etag, updatedAt: new Date() })
          .where(and(eq(documents.id, payload.documentId), eq(documents.profileId, payload.profileId)));
      },
    });

    return Response.json(response);
  } catch (error) {
    return Response.json(
      { error: error instanceof Error ? error.message : "Unable to create upload token" },
      { status: 400 },
    );
  }
}
