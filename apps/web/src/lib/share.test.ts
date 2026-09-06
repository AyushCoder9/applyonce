import { describe, it, expect } from "vitest";
import type { Fact } from "@applyonce/schema";
import { buildDiff, diffSummary, withQuery, newShareToken, shareTokenSessionId } from "./share";

process.env.APPLYONCE_KEK_HEX ??= "0".repeat(64);

const fact = (key: string, value: Fact["value"], source: Fact["source"] = "issuer_verified", verifiedBy: string | null = "cbse"): Fact => ({ key, value, repeatIndex: 0, source, verifiedBy });
const form = { purpose: "exam_application" as const, requestedFields: [
  { key: "identity.full_name", required: true }, { key: "identity.dob", required: true }, { key: "identity.pan", required: false },
  { key: "education.class12.percentage", required: true }, { key: "category.social", required: true }, { key: "health.allergies", required: false },
  { key: "identity.aadhaar_ref_key", required: false }, { key: "not.a.key", required: true },
] };

describe("buildDiff", () => {
  const facts = [fact("identity.full_name", "Aarav Sharma", "issuer_verified", "uidai"), fact("identity.dob", "2007-03-14", "issuer_verified", "uidai"), fact("identity.pan", "ABCDE1234F", "provider_verified", "nsdl_pan"), fact("education.class12.percentage", 92.4, "document_extracted", "ocr")];
  const rows = buildDiff(facts, form, { maskSensitive: true });
  it("classifies verified / extracted / missing / blocked, drops unknown keys, masks sensitive values", () => {
    const by = Object.fromEntries(rows.map((r) => [r.key, r]));
    expect(rows.map((r) => r.key)).not.toContain("not.a.key");
    expect(by["identity.full_name"]!.status).toBe("verified");
    expect(by["identity.full_name"]!.verifiedBy).toBe("uidai");
    expect(by["education.class12.percentage"]!.status).toBe("extracted");
    expect(by["category.social"]!.status).toBe("missing");
    expect(by["health.allergies"]!.status).toBe("blocked");           // healthcare-only key
    expect(by["identity.aadhaar_ref_key"]!.status).toBe("blocked");   // system key
    expect(by["identity.pan"]!.status).toBe("verified");
    expect(by["identity.pan"]!.value).toBe("ABCDE****F");
  });
  it("never masks when not asked, and keeps required flags", () => {
    const plain = buildDiff(facts, form);
    expect(plain.find((r) => r.key === "identity.pan")!.value).toBe("ABCDE1234F");
    expect(plain.find((r) => r.key === "identity.dob")!.required).toBe(true);
  });
  it("summarises counts the consent screen shows", () => {
    expect(diffSummary(rows)).toEqual({ requested: 7, verified: 3, extracted: 1, self: 0, missing: 1, missingRequired: 1, blocked: 2 });
  });
  it("treats self-declared as self and empty values as missing", () => {
    const r = buildDiff([fact("category.social", "OBC-NCL", "self_declared", null), fact("identity.dob", "", "self_declared", null)], form);
    expect(r.find((x) => x.key === "category.social")!.status).toBe("self");
    expect(r.find((x) => x.key === "identity.dob")!.status).toBe("missing");
  });
});

describe("tokens + return url", () => {
  it("share token carries the session id and only the hash is comparable", () => {
    const tok = newShareToken("11111111-2222-3333-4444-555555555555");
    expect(shareTokenSessionId(tok)).toBe("11111111-2222-3333-4444-555555555555");
    expect(tok.length).toBeGreaterThan(50);
  });
  it("appends query params whether or not the URL already has some", () => {
    expect(withQuery("https://bta.example/return", { share_token: "a.b", state: "x" })).toBe("https://bta.example/return?share_token=a.b&state=x");
    expect(withQuery("https://bta.example/return?cart=1", { share_token: "a.b", state: null })).toBe("https://bta.example/return?cart=1&share_token=a.b");
  });
});
