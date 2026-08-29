import { describe, expect, it } from "vitest";
import { createConsentHash, evaluateReadiness } from "./intelligence";

describe("application readiness intelligence", () => {
  it("prefills verified claims and isolates citizen decisions", () => {
    const result = evaluateReadiness(
      [
        { key: "full_name", label: "Full name", sourceKey: "full_name", needsUserDecision: false },
        { key: "exam_city", label: "Exam city", sourceKey: null, needsUserDecision: true },
      ],
      [
        {
          key: "full_name",
          valueText: "Aanya Mehta",
          label: "Full name",
          sourceLabel: "MeriPehchaan",
          confidence: 99,
          verifiedAt: new Date("2026-08-29T10:00:00.000Z"),
          expiresAt: null,
        },
      ],
      {},
      2,
    );

    expect(result.fields[0]?.state).toBe("prefilled");
    expect(result.fields[1]?.state).toBe("needs_confirmation");
    expect(result.readinessScore).toBe(50);
    expect(result.needsAction).toEqual(["exam_city"]);
  });

  it("treats an explicit answer as confirmed", () => {
    const result = evaluateReadiness(
      [{ key: "exam_city", label: "Exam city", sourceKey: null, needsUserDecision: true }],
      [],
      { exam_city: { valueText: "Pune", confirmed: true } },
    );

    expect(result.fields[0]?.state).toBe("confirmed");
    expect(result.needsAction).toEqual([]);
  });

  it("creates a stable purpose-bound consent hash", () => {
    const input = {
      profileId: "profile-1",
      applicationId: "application-1",
      purpose: "National STEM Entrance 2026",
      scope: ["full_name", "class_xii_marksheet"],
      version: "2026-08-01",
    };

    expect(createConsentHash(input)).toBe(createConsentHash(input));
    expect(createConsentHash(input)).toHaveLength(64);
  });
});
