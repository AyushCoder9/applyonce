import { describe, expect, it } from "vitest";
import { createPartnerSecret, hashSecret, hasPartnerRole } from "./partner-service";

describe("partner security helpers", () => {
  it("hashes the same secret deterministically without exposing the secret", () => {
    const secret = "ao_live_test_secret";
    const digest = hashSecret(secret);
    expect(digest).toHaveLength(64);
    expect(digest).toBe(hashSecret(secret));
    expect(digest).not.toContain(secret);
  });

  it("creates prefixed, non-repeating secrets", () => {
    const first = createPartnerSecret("ao_live");
    const second = createPartnerSecret("ao_live");
    expect(first.startsWith("ao_live_")).toBe(true);
    expect(second.startsWith("ao_live_")).toBe(true);
    expect(first).not.toBe(second);
  });

  it("keeps role checks explicit", () => {
    expect(hasPartnerRole("reviewer", ["owner", "admin"])).toBe(false);
    expect(hasPartnerRole("admin", ["owner", "admin"])).toBe(true);
  });
});
