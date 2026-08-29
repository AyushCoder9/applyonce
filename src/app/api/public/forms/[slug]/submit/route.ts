import { and, eq, inArray } from "drizzle-orm";
import { z } from "zod";
import { getDatabase } from "@/db";
import { documents } from "@/db/schema";
import { ensureActorProfile, getActor } from "@/lib/auth";
import { createPublicSubmission, getPublishedPartnerForm } from "@/lib/partner-service";

const submissionSchema = z.object({
  applicantName: z.string().min(2).max(160),
  applicantEmail: z.string().email().max(180),
  data: z.record(z.string(), z.string().max(2000)).default({}).refine((data) => Object.keys(data).length <= 100, "Too many fields"),
  documentIds: z.array(z.string().uuid()).max(30).default([]),
  consentAccepted: z.literal(true),
  consentMethod: z.enum(["otp", "passkey", "biometric", "manual"]).default("manual"),
});

export async function POST(request: Request, { params }: { params: Promise<{ slug: string }> }) {
  const parsed = submissionSchema.safeParse(await request.json());
  if (!parsed.success) return Response.json({ error: "Add your details and confirm the consent before submitting." }, { status: 400 });
  const result = await getPublishedPartnerForm((await params).slug);
  if (!result) return Response.json({ error: "Published form not found" }, { status: 404 });

  const requiredKeys = result.form.formSchema.fields.filter((field) => field.required).map((field) => field.key);
  const missing = requiredKeys.filter((key) => !parsed.data.data[key]?.trim());
  if (missing.length > 0) return Response.json({ error: "Complete the required fields before submitting.", fields: missing }, { status: 422 });

  const actor = await getActor();
  const profile = actor ? await ensureActorProfile(actor) : null;
  if (parsed.data.documentIds.length > 0 && !profile) {
    return Response.json({ error: "Sign in before sharing private documents." }, { status: 401 });
  }
  let submittedDocumentKeys: string[] = [];
  if (profile && parsed.data.documentIds.length > 0) {
    const ownedDocuments = await getDatabase().select({ id: documents.id, metadata: documents.metadata }).from(documents).where(and(eq(documents.profileId, profile.id), inArray(documents.id, parsed.data.documentIds)));
    if (ownedDocuments.length !== parsed.data.documentIds.length || ownedDocuments.some(({ metadata }) => metadata.partnerFormId !== result.form.id)) {
      return Response.json({ error: "One or more documents do not belong to this application." }, { status: 403 });
    }
    submittedDocumentKeys = ownedDocuments.map(({ metadata }) => typeof metadata.documentKey === "string" ? metadata.documentKey : "").filter(Boolean);
  }
  const allowedKeys = new Set(result.form.formSchema.fields.map((field) => field.key));
  const data = Object.fromEntries(Object.entries(parsed.data.data).filter(([key]) => allowedKeys.has(key)));
  const idempotencyKey = request.headers.get("Idempotency-Key")?.trim().slice(0, 160);
  if (!idempotencyKey) return Response.json({ error: "Add an Idempotency-Key so a retry cannot submit twice." }, { status: 400 });
  const requiredDocumentKeys = result.form.formSchema.documents.filter((document) => document.required).map((document) => document.key);
  const missingDocuments = requiredDocumentKeys.filter((key) => !submittedDocumentKeys.includes(key));
  const scope = [...result.form.formSchema.fields.map((field) => field.key), ...submittedDocumentKeys];
  const submission = await createPublicSubmission({
    formId: result.form.id,
    profileId: profile?.id,
    applicantName: parsed.data.applicantName,
    applicantEmail: parsed.data.applicantEmail,
    data,
    purpose: result.form.purpose,
    scope,
    consentMethod: parsed.data.consentMethod,
    status: missingDocuments.length > 0 ? "needs_documents" : "received",
    documentIds: parsed.data.documentIds,
    formName: result.form.name,
    organizationName: result.organization.name,
    organizationId: result.organization.id,
    idempotencyKey,
  });
  return Response.json({ submission, organization: result.organization }, { status: 201 });
}
