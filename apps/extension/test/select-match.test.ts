import { describe, it, expect } from "vitest";
import { matchOption, matchBoolOption, type SelectOption } from "../src/lib/select-match";

const socialCategoryOptions: SelectOption[] = [
  { value: "GEN", label: "General" },
  { value: "EWS", label: "EWS" },
  { value: "OBC-NCL", label: "OBC (Non-Creamy Layer)" },
  { value: "OBC-CL", label: "OBC (Creamy Layer)" },
  { value: "SC", label: "SC" },
  { value: "ST", label: "ST" },
];

describe("matchOption", () => {
  it("matches by exact raw value first", () => {
    expect(matchOption(socialCategoryOptions, { value: "SC" })).toBe("SC");
  });
  it("is case-insensitive on value", () => {
    expect(matchOption(socialCategoryOptions, { value: "sc" })).toBe("SC");
  });
  it("matches by exact label when value doesn't match any option value", () => {
    // registry value "OBC-NCL" isn't literally an <option value>, but its label is
    expect(matchOption([{ value: "obc_ncl", label: "OBC-NCL" }], { value: "OBC-NCL" })).toBe("obc_ncl");
  });
  it("matches by full label text when the raw value doesn't match any option", () => {
    expect(matchOption(socialCategoryOptions, { value: "does-not-exist", label: "OBC (Non-Creamy Layer)" })).toBe("OBC-NCL");
  });
  it("falls back to fuzzy startsWith the other direction", () => {
    // portal option is abbreviated, our label is the full display string
    expect(matchOption([{ value: "obc", label: "OBC" }], { label: "OBC (Non-Creamy Layer)" })).toBe("obc");
  });
  it("returns null when nothing matches", () => {
    expect(matchOption(socialCategoryOptions, { value: "ZZZ", label: "Nonexistent" })).toBeNull();
  });
  it("handles empty options", () => {
    expect(matchOption([], { value: "SC" })).toBeNull();
  });
});

describe("matchBoolOption", () => {
  it("matches Yes/No labelled options", () => {
    const opts: SelectOption[] = [{ value: "Y", label: "Yes" }, { value: "N", label: "No" }];
    expect(matchBoolOption(opts, true)).toBe("Y");
    expect(matchBoolOption(opts, false)).toBe("N");
  });
  it("matches true/false valued options", () => {
    const opts: SelectOption[] = [{ value: "true", label: "true" }, { value: "false", label: "false" }];
    expect(matchBoolOption(opts, true)).toBe("true");
  });
});
