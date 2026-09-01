import { describe, expect, it } from "vitest";
import { evaluateEligibility, type EligibilityRule } from "./eligibility";

const rule: EligibilityRule = {
  operator: "all",
  rules: [
    { operator: "age", claim: "date_of_birth", minimum: 16, maximum: 21, onDate: "2026-07-01", label: "Applicant age" },
    { operator: "compare", claim: "class_xii_percentage", comparison: "gte", value: 60, label: "Class 12 percentage" },
    { operator: "in", claim: "citizenship", values: ["Indian"], label: "Citizenship" },
  ],
};

describe("deterministic eligibility engine", () => {
  it("returns eligible only when every condition passes", () => {
    expect(evaluateEligibility(rule, { date_of_birth: "2008-04-16", class_xii_percentage: 82, citizenship: "Indian" }).status).toBe("eligible");
  });

  it("returns needs_information when a required value is absent", () => {
    const result = evaluateEligibility(rule, { date_of_birth: "2008-04-16", citizenship: "Indian" });
    expect(result.status).toBe("needs_information");
    expect(result.children?.[1]?.claim).toBe("class_xii_percentage");
  });

  it("returns ineligible with a complete trace", () => {
    const result = evaluateEligibility(rule, { date_of_birth: "2008-04-16", class_xii_percentage: 52, citizenship: "Indian" });
    expect(result.status).toBe("ineligible");
    expect(result.children).toHaveLength(3);
  });

  it("supports any-groups without hiding missing data", () => {
    const anyRule: EligibilityRule = { operator: "any", rules: [{ operator: "equals", claim: "category", value: "SC" }, { operator: "compare", claim: "income", comparison: "lte", value: 500000 }] };
    expect(evaluateEligibility(anyRule, { category: "General" }).status).toBe("needs_information");
    expect(evaluateEligibility(anyRule, { category: "SC" }).status).toBe("eligible");
  });
});
