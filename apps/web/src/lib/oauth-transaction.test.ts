import { describe, expect, it } from "vitest";
import { openOAuthTransaction, sealOAuthTransaction } from "./oauth-transaction";

const value = { provider: "digilocker" as const, userId: "user-1", profileId: "profile-1", next: "/app/verify", transaction: { state: "state", redirectUri: "https://app.test/callback", codeVerifier: "verifier" } };

describe("OAuth transaction cookie", () => {
  it("round-trips confidential PKCE material", () => {
    const sealed = sealOAuthTransaction(value);
    expect(sealed).not.toContain("verifier");
    expect(openOAuthTransaction(sealed)).toMatchObject(value);
  });

  it("rejects tampering and open redirects", () => {
    const sealed = sealOAuthTransaction(value);
    const at = Math.floor(sealed.length / 2);
    const replacement = sealed[at] === "x" ? "y" : "x";
    expect(() => openOAuthTransaction(`${sealed.slice(0, at)}${replacement}${sealed.slice(at + 1)}`)).toThrow();
    const unsafe = sealOAuthTransaction({ ...value, next: "//attacker.test" });
    expect(() => openOAuthTransaction(unsafe)).toThrow("Invalid OAuth return path");
  });
});
