import { put } from "@vercel/blob";
import { z } from "zod";
import { getDatabase } from "@/db";
import { documents } from "@/db/schema";
import { ensureActorProfile, getActor } from "@/lib/auth";
import { getPublishedPartnerForm } from "@/lib/partner-service";

const documentKeySchema = z.string().min(1).max(80);
const MAX_DOCUMENT_SIZE = 10 * 1024 * 1024;
const ALLOWED_TYPES = new Set(["application/pdf", "image/jpeg", "image/png"]);

function safeFilename(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9._-]+/g, "-").replace(/^-+|-+$/g, "").slice(-90) || "document";
}

export async function POST(request: Request, { params }: { params: Promise<{ slug: string }> }) {
  const actor = await getActor();
  if (!actor) return Response.json({ error: "Sign in before uploading a private document." }, { status: 401 });

  const result = await getPublishedPartnerForm((await params).slug);
  if (!result) return Response.json({ error: "Published form not found" }, { status: 404 });

  const formData = await request.formData();
  const file = formData.get("file");
  const documentKey = documentKeySchema.safeParse(formData.get("documentKey"));
  if (!(file instanceof File) || !documentKey.success) return Response.json({ error: "Choose a document and its requested document type." }, { status: 400 });
  if (!ALLOWED_TYPES.has(file.type)) return Response.json({ error: "Use a PDF, JPG, or PNG document." }, { status: 415 });
  if (file.size <= 0 || file.size > MAX_DOCUMENT_SIZE) return Response.json({ error: "Documents must be between 1 byte and 10 MB." }, { status: 413 });

  const definition = result.form.formSchema.documents.find((item) => item.key === documentKey.data);
  if (!definition) return Response.json({ error: "That document is not requested by this form." }, { status: 422 });

  try {
    const profile = await ensureActorProfile(actor);
    const blob = await put(`documents/${profile.id}/${crypto.randomUUID()}-${safeFilename(file.name)}`, file, {
      access: "private",
      addRandomSuffix: false,
      contentType: file.type,
      token: process.env.BLOB_READ_WRITE_TOKEN,
    });
    const [document] = await getDatabase().insert(documents).values({
      profileId: profile.id,
      title: file.name.slice(0, 180),
      documentType: `partner_${definition.key}`,
      provider: "manual",
      status: "pending",
      storageKey: blob.pathname,
      checksum: blob.etag,
      metadata: { partnerFormId: result.form.id, documentKey: definition.key, partnerOrganizationId: result.organization.id },
    }).returning({ id: documents.id, title: documents.title, documentType: documents.documentType, status: documents.status, updatedAt: documents.updatedAt });
    if (!document) return Response.json({ error: "The document record could not be saved." }, { status: 500 });
    return Response.json({ document: { ...document, key: definition.key, label: definition.label } }, { status: 201 });
  } catch (error) {
    return Response.json({ error: error instanceof Error ? error.message : "The private upload could not be completed." }, { status: 400 });
  }
}
