import { createHmac } from "node:crypto";
import { describe, expect, it, vi } from "vitest";
import { createApiSetuDigiLocker, parseDigiLockerAadhaarXml, providerReadiness } from "../src";

const json = (value: unknown, init: ResponseInit = {}) => new Response(JSON.stringify(value), { ...init, headers: { "content-type": "application/json", ...init.headers } });
const signed = (value: string, secret = "secret") => new Response(value, { headers: { "content-type": "application/xml", hmac: createHmac("sha256", secret).update(value).digest("hex") } });

describe("direct DigiLocker Requester adapter", () => {
  it("creates an OAuth authorization request with state and S256 PKCE", async () => {
    const provider = createApiSetuDigiLocker({ clientId: "client", clientSecret: "secret", baseUrl: "https://example.test/public" });
    const started = await provider.startAuth("user-1", "https://app.test/callback");
    const url = new URL(started.url);
    expect(url.pathname).toBe("/public/oauth2/1/authorize");
    expect(url.searchParams.get("client_id")).toBe("client");
    expect(url.searchParams.get("code_challenge_method")).toBe("S256");
    expect(url.searchParams.get("code_challenge")).toMatch(/^[A-Za-z0-9_-]{43}$/);
    expect(started.transaction.codeVerifier).toBeTruthy();
    expect(started.transaction.state).toBe(url.searchParams.get("state"));
  });

  it("exchanges a PKCE code and uses the encrypted-at-rest opaque reference", async () => {
    const fetcher = vi.fn<typeof fetch>()
      .mockResolvedValueOnce(json({ access_token: "access", refresh_token: "refresh", expires_in: 900, reference_key: "432120260908" }))
      .mockResolvedValueOnce(json({ digilockerid: "dl-1", name: "Aarav Sharma", dob: "14-03-2007" }))
      .mockResolvedValueOnce(json({ items: [{ uri: "in.gov.cbse-MARKSHEET-1", doctype: "HSCER", name: "Class XII marksheet", issuerid: "in.gov.cbse", issuer: "CBSE", mime: "application/pdf" }] }));
    const provider = createApiSetuDigiLocker({ clientId: "client", clientSecret: "secret", baseUrl: "https://example.test/public", fetch: fetcher });
    const done = await provider.completeAuth({ state: "state", redirectUri: "https://app.test/callback", codeVerifier: "verifier" }, "code");
    expect(done.name).toBe("Aarav Sharma");
    expect(done.dob).toBe("2007-03-14");
    expect(done.providerRef).toMatch(/^digilocker:v1:/);
    const documents = await provider.listIssuedDocs(done.providerRef);
    expect(documents[0]).toMatchObject({ docType: "marksheet_12", issuerName: "CBSE" });
    const tokenRequest = fetcher.mock.calls[0]!;
    expect(String(tokenRequest[1]?.body)).toContain("code_verifier=verifier");
  });

  it("requires and verifies the official response integrity HMAC", async () => {
    const body = "%PDF-1.4 safe";
    const fetcher = vi.fn<typeof fetch>().mockResolvedValueOnce(new Response(body));
    const provider = createApiSetuDigiLocker({ clientId: "client", clientSecret: "secret", baseUrl: "https://example.test/public", fetch: fetcher });
    const ref = `digilocker:v1:${Buffer.from(JSON.stringify({ accessToken: "access", expiresAt: new Date(Date.now() + 60_000).toISOString() })).toString("base64url")}`;
    await expect(provider.fetchDoc(ref, "doc-uri")).rejects.toThrow("missing its integrity HMAC");

    fetcher.mockResolvedValueOnce(signed(body));
    await expect(provider.fetchDoc(ref, "doc-uri")).resolves.toMatchObject({ mime: "application/xml" });
  });

  it("rejects active-content XML and parses only approved Aadhaar attributes", () => {
    expect(() => parseDigiLockerAadhaarXml('<!DOCTYPE x [<!ENTITY e SYSTEM "file:///etc/passwd">]><KycRes/>')).toThrow("Unsafe declarations");
    const parsed = parseDigiLockerAadhaarXml('<KycRes referenceId="transaction-not-aadhaar"><UidData uid="XXXXXXXX4321"><Poi name="Aarav Sharma" dob="14-03-2007" gender="M"/><Poa house="10" vtc="Lucknow" dist="Lucknow" state="UP" pc="226010"/><Pht>photo</Pht></UidData></KycRes>');
    expect(parsed).toMatchObject({ name: "Aarav Sharma", dob: "2007-03-14", last4: "4321", address: { pincode: "226010" } });
    expect(parseDigiLockerAadhaarXml('<KycRes referenceId="432120260908"><UidData><Poi name="Aarav Sharma" dob="14-03-2007" gender="M"/><Poa vtc="Lucknow" dist="Lucknow" state="UP" pc="226010"/></UidData></KycRes>').last4).toBe("");
  });
});

describe("provider readiness", () => {
  it("never upgrades mock to live and exposes missing approval gates", () => {
    const rows = providerReadiness({ PROVIDER_DIGILOCKER: "mock", PROVIDER_AADHAAR: "disabled" });
    expect(rows.find((row) => row.id === "digilocker")?.state).toBe("demo");
    expect(rows.find((row) => row.id === "aadhaar_offline")).toMatchObject({ state: "unavailable", onboardingUrl: "https://ovse.uidai.gov.in/" });
  });

  it("keeps credentials configured but unverified until an E2E proof flag exists", () => {
    const env = { PROVIDER_DIGILOCKER: "apisetu", DIGILOCKER_CLIENT_ID: "id", DIGILOCKER_CLIENT_SECRET: "secret" };
    expect(providerReadiness(env).find((row) => row.id === "digilocker")?.state).toBe("configured_unverified");
    expect(providerReadiness({ ...env, DIGILOCKER_PRODUCTION_VERIFIED: "1" }).find((row) => row.id === "digilocker")?.state).toBe("live");
  });
});
