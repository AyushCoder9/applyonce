export type EligibilityValue = string | number | boolean | null;
export type EligibilityClaims = Record<string, EligibilityValue | undefined>;

export type EligibilityRule =
  | { operator: "all" | "any"; rules: EligibilityRule[]; label?: string }
  | { operator: "exists"; claim: string; label?: string }
  | { operator: "equals"; claim: string; value: EligibilityValue; label?: string }
  | { operator: "in"; claim: string; values: EligibilityValue[]; label?: string }
  | { operator: "compare"; claim: string; comparison: "gt" | "gte" | "lt" | "lte"; value: number; label?: string }
  | { operator: "age"; claim: string; minimum?: number; maximum?: number; onDate: string; label?: string };

export type EligibilityStatus = "eligible" | "ineligible" | "needs_information";
export type EligibilityTrace = { status: EligibilityStatus; message: string; claim?: string; children?: EligibilityTrace[] };

function missing(claim: string, label?: string): EligibilityTrace {
  return { status: "needs_information", claim, message: `${label ?? claim} is required to evaluate this condition.` };
}

function yearsOn(dateOfBirth: Date, onDate: Date) {
  let years = onDate.getUTCFullYear() - dateOfBirth.getUTCFullYear();
  const beforeBirthday = onDate.getUTCMonth() < dateOfBirth.getUTCMonth() || (onDate.getUTCMonth() === dateOfBirth.getUTCMonth() && onDate.getUTCDate() < dateOfBirth.getUTCDate());
  if (beforeBirthday) years -= 1;
  return years;
}

export function evaluateEligibility(rule: EligibilityRule, claims: EligibilityClaims): EligibilityTrace {
  if ("rules" in rule) {
    const children = rule.rules.map((child) => evaluateEligibility(child, claims));
    const eligible = children.filter((child) => child.status === "eligible").length;
    const ineligible = children.filter((child) => child.status === "ineligible").length;
    const status: EligibilityStatus = rule.operator === "all"
      ? ineligible > 0 ? "ineligible" : eligible === children.length ? "eligible" : "needs_information"
      : eligible > 0 ? "eligible" : ineligible === children.length ? "ineligible" : "needs_information";
    return { status, message: rule.label ?? (rule.operator === "all" ? "All conditions must pass." : "At least one condition must pass."), children };
  }

  const value = claims[rule.claim];
  if (value === undefined || value === null || value === "") return missing(rule.claim, rule.label);

  if (rule.operator === "exists") return { status: "eligible", claim: rule.claim, message: `${rule.label ?? rule.claim} is available.` };
  if (rule.operator === "equals") {
    const pass = value === rule.value;
    return { status: pass ? "eligible" : "ineligible", claim: rule.claim, message: pass ? `${rule.label ?? rule.claim} matches the requirement.` : `${rule.label ?? rule.claim} does not match the requirement.` };
  }
  if (rule.operator === "in") {
    const pass = rule.values.includes(value);
    return { status: pass ? "eligible" : "ineligible", claim: rule.claim, message: pass ? `${rule.label ?? rule.claim} is accepted.` : `${rule.label ?? rule.claim} is outside the accepted set.` };
  }
  if (rule.operator === "compare") {
    const numeric = typeof value === "number" ? value : Number(value);
    if (!Number.isFinite(numeric)) return { status: "needs_information", claim: rule.claim, message: `${rule.label ?? rule.claim} must be a valid number.` };
    const pass = rule.comparison === "gt" ? numeric > rule.value : rule.comparison === "gte" ? numeric >= rule.value : rule.comparison === "lt" ? numeric < rule.value : numeric <= rule.value;
    return { status: pass ? "eligible" : "ineligible", claim: rule.claim, message: pass ? `${rule.label ?? rule.claim} passes the numeric requirement.` : `${rule.label ?? rule.claim} does not pass the numeric requirement.` };
  }

  const birthDate = new Date(String(value));
  const onDate = new Date(rule.onDate);
  if (Number.isNaN(birthDate.getTime()) || Number.isNaN(onDate.getTime())) return { status: "needs_information", claim: rule.claim, message: `${rule.label ?? rule.claim} must be a valid date.` };
  const age = yearsOn(birthDate, onDate);
  const pass = (rule.minimum === undefined || age >= rule.minimum) && (rule.maximum === undefined || age <= rule.maximum);
  return { status: pass ? "eligible" : "ineligible", claim: rule.claim, message: pass ? `Age ${age} passes the requirement.` : `Age ${age} does not pass the requirement.` };
}
