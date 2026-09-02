import { describe, it, expect } from "vitest";
import { field } from "@praman/schema";
import { formatSse } from "./sse";
import { coerceInput, rawFor } from "../../../../packages/ui/src/fact-editor";

describe("formatSse", () => {
  it("formats event + data with a blank-line terminator", () => {
    expect(formatSse({ event: "job", data: { id: "j1", pct: 40 } })).toBe('event: job\ndata: {"id":"j1","pct":40}\n\n');
  });
  it("includes id when given and omits event when absent", () => {
    expect(formatSse({ id: "7", data: "hi" })).toBe('id: 7\ndata: "hi"\n\n');
  });
});

describe("coerceInput (fact-editor)", () => {
  it("numbers: strips ₹ , % and truncates ints/years", () => {
    expect(coerceInput(field("family.annual_income_total"), "₹4,50,000")).toBe(450000);
    expect(coerceInput(field("education.class12.year"), "2025.7")).toBe(2025);
    expect(coerceInput(field("education.class12.percentage"), "91.2%")).toBe(91.2);
    expect(coerceInput(field("education.class12.percentage"), "abc")).toBeNull();
    expect(coerceInput(field("education.class12.percentage"), 88)).toBe(88);
  });
  it("bool / string[] / json / pan / phone", () => {
    expect(coerceInput(field("category.pwd"), "हाँ")).toBe(true);
    expect(coerceInput(field("category.pwd"), false)).toBe(false);
    expect(coerceInput(field("identity.languages_known"), "Hindi, English;  Tamil")).toEqual(["Hindi", "English", "Tamil"]);
    expect(coerceInput(field("health.emergency_contacts"), '[{"name":"A"}]')).toEqual([{ name: "A" }]);
    expect(coerceInput(field("health.emergency_contacts"), "{bad")).toBeNull();
    expect(coerceInput(field("identity.pan"), " bxyps1234k ")).toBe("BXYPS1234K");
    expect(coerceInput(field("contact.mobile_secondary"), "+91 98765 43210".replace("+91", ""))).toBe("9876543210");
    expect(coerceInput(field("identity.full_name"), "   ")).toBeNull();
  });
  it("rawFor round-trips arrays and json", () => {
    expect(rawFor(field("identity.languages_known"), ["Hindi", "English"])).toBe("Hindi, English");
    expect(rawFor(field("family.annual_income_total"), 450000)).toBe("450000");
    expect(rawFor(field("identity.dob"), null)).toBe("");
  });
});
