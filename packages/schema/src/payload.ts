/** Wire types shared by web API, SDK, extension, demo portal. */
import type { Purpose, Source, FactValue } from "./types";

export interface CustomField {
  id: string;            // partner-defined, e.g. "exam_city_1"
  label: string;
  type: "string" | "number" | "bool" | "enum" | "date" | "file";
  required?: boolean;
  options?: string[];
}

/** A partner form = purpose + requested canonical keys + custom questions. */
export interface FormDef {
  id: string;
  slug: string;
  partnerId: string;
  name: string;
  purpose: Purpose;
  requestedFields: { key: string; required: boolean }[];
  customFields: CustomField[];
  retentionDays: number;
  redirectUrl: string;
  webhookUrl?: string | null;
  version: number;
}

export interface SharedFact {
  key: string;
  value: FactValue;
  repeatIndex?: number;
  source: Source;
  verifiedBy?: string | null;
  verifiedAt?: string | null;
  evidence?: { documentId: string; sha256: string; title: string; downloadUrl?: string } | null;
}

/** Signed (JWS ES256) payload the partner receives after exchanging a share_token. */
export interface ApplyOncePayload {
  iss: "applyonce";
  sub: string;              // profile hash (stable per profile+partner, not the profile id)
  aud: string;              // partner id
  iat: number;
  exp: number;
  jti: string;              // share id
  consent_id: string;
  application_id: string;
  form_id: string;
  form_version: number;
  purpose: Purpose;
  profile: { kind: "self" | "dependent"; display_name: string; guardian_acting?: boolean };
  facts: SharedFact[];
  custom: Record<string, unknown>;
  profile_hash: string;     // sha256 over sorted facts, for tamper checks
}

/** FieldDiff shown on consent screen. */
export interface FieldDiffRow {
  key: string;
  required: boolean;
  status: "verified" | "extracted" | "self" | "missing" | "blocked";
  value?: FactValue;
  source?: Source;
  verifiedBy?: string | null;
}

export type ApplicationStatus = "draft" | "submitted" | "under_review" | "shortlisted" | "accepted" | "rejected" | "withdrawn" | "enrolled";
export const APPLICATION_STATUSES: readonly ApplicationStatus[] = ["draft", "submitted", "under_review", "shortlisted", "accepted", "rejected", "withdrawn", "enrolled"];

/**
 * Legal forward-only status changes. `withdrawn` is retained because a partner may
 * mirror a citizen withdrawal, but terminal outcomes cannot be rewritten later.
 */
export const APPLICATION_STATUS_TRANSITIONS: Readonly<Record<ApplicationStatus, readonly ApplicationStatus[]>> = {
  draft: ["submitted", "withdrawn"],
  submitted: ["under_review", "shortlisted", "accepted", "rejected", "withdrawn"],
  under_review: ["shortlisted", "accepted", "rejected", "withdrawn"],
  shortlisted: ["under_review", "accepted", "rejected", "withdrawn"],
  accepted: ["enrolled", "withdrawn"],
  rejected: [],
  withdrawn: [],
  enrolled: [],
};

export function isApplicationStatusTransitionAllowed(from: ApplicationStatus, to: ApplicationStatus): boolean {
  return APPLICATION_STATUS_TRANSITIONS[from].includes(to);
}

export type WebhookEvent = "share.completed" | "consent.revoked" | "verification.updated" | "application.withdrawn";
