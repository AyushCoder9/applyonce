import { z } from "zod";

export const apiErrorSchema = z.object({
  code: z.string(),
  message: z.string(),
  requestId: z.string().optional(),
  retryable: z.boolean().default(false),
  fields: z.record(z.string(), z.array(z.string())).optional(),
});

export const applicationReceiptSchema = z.object({
  receiptCode: z.string(),
  applicationReference: z.string().nullable(),
  submittedAt: z.coerce.date().nullable(),
  applicationName: z.string(),
  intendedDestination: z.string(),
  submissionChannel: z.literal("applyonce_hosted"),
  externalReceiptConfirmed: z.literal(false),
  snapshotHash: z.string().length(64).nullable(),
  snapshotVersion: z.string().nullable(),
  consentHash: z.string().length(64).nullable(),
  scope: z.array(z.string()),
});

export const connectorStateSchema = z.enum(["unavailable", "approval_pending", "sandbox", "connected", "degraded", "expired", "revoked"]);

export type ApplicationReceipt = z.infer<typeof applicationReceiptSchema>;
