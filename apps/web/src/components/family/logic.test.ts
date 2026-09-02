import { describe, it, expect } from "vitest";
import { ageAt, isMinor, isHandoverDue, claimTransition, isPending, PENDING, normPhone, validPhone, validDob } from "./logic";

const now = new Date("2026-09-02T00:00:00Z");
describe("family logic", () => {
  it("ageAt counts whole years", () => {
    expect(ageAt("2011-08-02", now)).toBe(15);
    expect(ageAt("2008-09-03", now)).toBe(17); // birthday tomorrow
    expect(ageAt("2008-09-02", now)).toBe(18);
  });
  it("isMinor", () => { expect(isMinor("2011-08-02", now)).toBe(true); expect(isMinor("2008-09-02", now)).toBe(false); });
  it("validDob rejects future/garbage", () => { expect(validDob("2011-08-02", now)).toBe(true); expect(validDob("2030-01-01", now)).toBe(false); expect(validDob("nope", now)).toBe(false); });
  it("handover due only for minors whose 18th-birthday year is reached", () => {
    expect(isHandoverDue(2011, "minor", now)).toBe(false);
    expect(isHandoverDue(2008, "minor", now)).toBe(true);
    expect(isHandoverDue(2008, "elder_consent", now)).toBe(false);
    expect(isHandoverDue(null, "minor", now)).toBe(false);
  });
  it("claimTransition gives 90-day scoped elder_consent", () => {
    const c = claimTransition(now);
    expect(c.basis).toBe("elder_consent");
    expect(c.scope).toEqual(["identity", "education"]);
    expect(c.validUntil.toISOString()).toBe("2026-12-01T00:00:00.000Z");
  });
  it("pending marker", () => { expect(isPending(PENDING)).toBe(true); expect(isPending(null)).toBe(false); expect(isPending(now)).toBe(false); });
  it("phones", () => { expect(normPhone("+91 98765 00002")).toBe("9876500002"); expect(validPhone("9876500002")).toBe(true); expect(validPhone("12345")).toBe(false); });
});
