import { createHash, randomBytes } from "node:crypto";

export type ClaimForReadiness = {
  key: string;
  valueText: string;
  label: string;
  sourceLabel: string | null;
  confidence: number;
  verifiedAt: Date | null;
  expiresAt: Date | null;
};

export type RequirementForReadiness = {
  key: string;
  label: string;
  sourceKey: string | null;
  needsUserDecision: boolean;
};

export type UserAnswer = {
  valueText: string;
  confirmed: boolean;
};

export type ReadinessField = {
  key: string;
  label: string;
  valueText: string | null;
  sourceLabel: string | null;
  confidence: number | null;
  state: "prefilled" | "needs_confirmation" | "missing" | "confirmed";
};

export type ReadinessResult = {
  fields: ReadinessField[];
  readyFieldCount: number;
  totalFieldCount: number;
  readinessScore: number;
  needsAction: string[];
};

function isFresh(claim: ClaimForReadiness) {
  if (claim.expiresAt && claim.expiresAt.getTime() < Date.now()) {
    return false;
  }

  return claim.verifiedAt ? claim.verifiedAt.getTime() <= Date.now() : true;
}

export function evaluateReadiness(
  requirements: RequirementForReadiness[],
  claims: ClaimForReadiness[],
  answers: Record<string, UserAnswer> = {},
  totalFieldCount = requirements.length,
): ReadinessResult {
  const fields = requirements.map<ReadinessField>((requirement) => {
    const answer = answers[requirement.key];
    const claim = requirement.sourceKey
      ? claims.find((candidate) => candidate.key === requirement.sourceKey && isFresh(candidate))
      : undefined;

    if (answer?.valueText && answer.confirmed) {
      return {
        key: requirement.key,
        label: requirement.label,
        valueText: answer.valueText,
        sourceLabel: "You confirmed",
        confidence: 100,
        state: "confirmed",
      };
    }

    if (claim) {
      return {
        key: requirement.key,
        label: requirement.label,
        valueText: claim.valueText,
        sourceLabel: claim.sourceLabel,
        confidence: claim.confidence,
        state: requirement.needsUserDecision ? "needs_confirmation" : "prefilled",
      };
    }

    if (answer?.valueText) {
      return {
        key: requirement.key,
        label: requirement.label,
        valueText: answer.valueText,
        sourceLabel: "You entered",
        confidence: null,
        state: requirement.needsUserDecision ? "needs_confirmation" : "prefilled",
      };
    }

    return {
      key: requirement.key,
      label: requirement.label,
      valueText: null,
      sourceLabel: null,
      confidence: null,
      state: requirement.needsUserDecision ? "needs_confirmation" : "missing",
    };
  });

  const readyFieldCount = fields.filter(
    (field) => field.state === "prefilled" || field.state === "confirmed",
  ).length;
  const actionable = fields
    .filter((field) => field.state === "missing" || field.state === "needs_confirmation")
    .map((field) => field.key);

  return {
    fields,
    readyFieldCount,
    totalFieldCount,
    readinessScore: totalFieldCount
      ? Math.round((readyFieldCount / totalFieldCount) * 100)
      : 0,
    needsAction: actionable,
  };
}

export function createConsentHash(input: {
  profileId: string;
  applicationId: string;
  purpose: string;
  scope: string[];
  version: string;
}) {
  return createHash("sha256")
    .update(JSON.stringify(input))
    .digest("hex");
}

export function createReceiptCode(prefix = "AO") {
  return `${prefix}-${new Date().getFullYear()}-${randomBytes(4).toString("hex").toUpperCase()}`;
}
