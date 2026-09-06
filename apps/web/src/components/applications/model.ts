/** Application wire shape + status presentation shared by API routes and pages. */
import type { t } from "@applyonce/db";
import type { ApplicationStatus } from "@applyonce/schema";

export const serializeApp = (a: typeof t.applications.$inferSelect) => ({ id: a.id, profile_id: a.profileId, partner_id: a.partnerId, form_id: a.formId, title: a.title, org_name: a.orgName, kind: a.kind, external_ref: a.externalRef, status: a.status, deadline_at: a.deadlineAt?.toISOString() ?? null, submitted_at: a.submittedAt?.toISOString() ?? null, source: a.source, portal_url: a.portalUrl, created_at: a.createdAt.toISOString(), updated_at: a.updatedAt.toISOString() });
export type AppDto = ReturnType<typeof serializeApp>;

export const STATUS_META: Record<ApplicationStatus, { label: string; hi: string; color: "default" | "accent" | "success" | "warning" | "danger" }> = {
  draft: { label: "Draft", hi: "ड्राफ्ट", color: "default" },
  submitted: { label: "Submitted", hi: "जमा", color: "accent" },
  under_review: { label: "Under review", hi: "समीक्षा में", color: "warning" },
  shortlisted: { label: "Shortlisted", hi: "शॉर्टलिस्ट", color: "success" },
  accepted: { label: "Accepted", hi: "स्वीकृत", color: "success" },
  rejected: { label: "Not selected", hi: "चयनित नहीं", color: "danger" },
  withdrawn: { label: "Withdrawn", hi: "वापस लिया", color: "default" },
  enrolled: { label: "Enrolled", hi: "नामांकित", color: "success" },
};
export const KIND_LABEL: Record<string, string> = { exam: "Exam", admission: "Admission", scholarship: "Scholarship", job: "Job", kyc: "KYC", healthcare: "Healthcare", scheme: "Scheme", other: "Other" };
