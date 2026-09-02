import { z } from "zod";
import { db, t, and, eq } from "@praman/db";
import { handler, citizen, body, ok, ApiError } from "@/lib/api";

/** POST /api/v1/applications/:id/documents {document_id, label?} — attach one of the profile’s documents. */
export const POST = handler(async (req, { params }) => {
  const b = await body(req, z.object({ document_id: z.uuid(), label: z.string().max(80).optional() }));
  const a = await db.query.applications.findFirst({ where: eq(t.applications.id, params.id!) });
  if (!a) throw new ApiError(404, "APPLICATION_NOT_FOUND");
  await citizen(req, { profileId: a.profileId });
  const doc = await db.query.documents.findFirst({ where: and(eq(t.documents.id, b.document_id), eq(t.documents.profileId, a.profileId)) });
  if (!doc) throw new ApiError(404, "DOCUMENT_NOT_FOUND", "Pick a document from this profile");
  await db.insert(t.applicationDocuments).values({ applicationId: a.id, documentId: doc.id, label: b.label ?? doc.title }).onConflictDoNothing();
  await db.insert(t.applicationEvents).values({ applicationId: a.id, type: "document", title: `Attached ${doc.title}`, actor: "citizen", meta: { documentId: doc.id } });
  return ok({ application_id: a.id, document_id: doc.id, label: b.label ?? doc.title }, { status: 201 });
});
