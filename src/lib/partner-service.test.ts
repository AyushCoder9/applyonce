import { describe, expect, it } from "vitest";
import { createPartnerSecret, hashSecret, hasPartnerRole, isPrivateNetworkAddress } from "./partner-service";

describe("partner security helpers", () => {
  it("hashes the same secret deterministically without exposing the secret", () => {
    const secret = "synthetic_partner_secret";
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

  it("blocks private IPv4, IPv6, and mapped loopback webhook targets", () => {
    expect(isPrivateNetworkAddress("127.0.0.1")).toBe(true);
    expect(isPrivateNetworkAddress("10.4.2.1")).toBe(true);
    expect(isPrivateNetworkAddress("fd12::10")).toBe(true);
    expect(isPrivateNetworkAddress("::ffff:127.0.0.1")).toBe(true);
    expect(isPrivateNetworkAddress("8.8.8.8")).toBe(false);
    expect(isPrivateNetworkAddress("2001:4860:4860::8888")).toBe(false);
  });
});
