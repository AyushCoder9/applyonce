import { describe, it, expect } from "vitest";
import { applyTransform, pickArrayIndex, isIsoDate } from "../src/lib/transforms";

describe("applyTransform", () => {
  it("passes through with no transform", () => {
    expect(applyTransform("Aarav Sharma")).toBe("Aarav Sharma");
  });
  it("upper / lower", () => {
    expect(applyTransform("abcde1234f", "upper")).toBe("ABCDE1234F");
    expect(applyTransform("ABCDE1234F", "lower")).toBe("abcde1234f");
  });
  it("dd/mm/yyyy from an ISO date", () => {
    expect(applyTransform("2007-03-14", "dd/mm/yyyy")).toBe("14/03/2007");
  });
  it("dd/mm/yyyy passthrough when not ISO", () => {
    expect(applyTransform("14/03/2007", "dd/mm/yyyy")).toBe("14/03/2007");
  });
  it("yyyy extracts the year", () => {
    expect(applyTransform("2025-05-01", "yyyy")).toBe("2025");
  });
  it("first_word / last_word", () => {
    expect(applyTransform("Aarav Kumar Sharma", "first_word")).toBe("Aarav");
    expect(applyTransform("Aarav Kumar Sharma", "last_word")).toBe("Sharma");
  });
  it("digits strips non-numeric characters", () => {
    expect(applyTransform("+91 98765 43210", "digits")).toBe("919876543210");
  });
  it("map: applies an inline value->option map", () => {
    expect(applyTransform("M", 'map:{"M":"Male","F":"Female"}')).toBe("Male");
    expect(applyTransform("X", 'map:{"M":"Male","F":"Female"}')).toBe("X"); // unmapped passthrough
  });
  it("map: falls back to raw value on invalid JSON", () => {
    expect(applyTransform("M", "map:not-json")).toBe("M");
  });
  it("booleans stringify before transform", () => {
    expect(applyTransform(true, "upper")).toBe("TRUE");
  });
  it("nullish values become empty string", () => {
    expect(applyTransform(null)).toBe("");
    expect(applyTransform(undefined)).toBe("");
  });
});

describe("pickArrayIndex", () => {
  it("returns the value unchanged when no index given", () => {
    expect(pickArrayIndex(["Lucknow", "Kanpur"])).toEqual(["Lucknow", "Kanpur"]);
  });
  it("picks the i-th entry from an array", () => {
    expect(pickArrayIndex(["Lucknow", "Kanpur"], 0)).toBe("Lucknow");
    expect(pickArrayIndex(["Lucknow", "Kanpur"], 1)).toBe("Kanpur");
  });
  it("returns undefined for a non-array value with an index requested", () => {
    expect(pickArrayIndex("Lucknow", 0)).toBeUndefined();
  });
});

describe("isIsoDate", () => {
  it("recognizes yyyy-mm-dd", () => expect(isIsoDate("2007-03-14")).toBe(true));
  it("rejects dd/mm/yyyy", () => expect(isIsoDate("14/03/2007")).toBe(false));
});
