import { describe, it, expect } from "vitest";
import { mockProviders, docToFacts, AARAV, getProviders } from "../src";
import { isFactKey, validateFact } from "@applyonce/schema";

describe("mock providers + fixtures", () => {
  it("digilocker round trip", async () => {
    const { transaction } = await mockProviders.digilocker.startAuth("u1", "http://x/cb");
    const { providerRef } = await mockProviders.digilocker.completeAuth(transaction, AARAV.phone);
    const docs = await mockProviders.digilocker.listIssuedDocs(providerRef);
    expect(docs.length).toBeGreaterThan(5);
    const a = await mockProviders.digilocker.fetchAadhaarXml(providerRef);
    expect(a.last4).toBe("4321");
  });
  it("every fixture doc maps to valid registry keys + values", () => {
    for (const p of [AARAV]) for (const d of p.docs) for (const f of docToFacts(d, p)) {
      expect(isFactKey(f.key), f.key).toBe(true);
      expect(validateFact(f.key, f.value).success, `${f.key}=${JSON.stringify(f.value)}`).toBe(true);
    }
    for (const [k, v] of Object.entries(AARAV.selfFacts)) expect(validateFact(k, v).success, k).toBe(true);
  });
  it("env picks providers", async () => {
    expect(getProviders({ PROVIDER_DIGILOCKER: "mock" }).digilocker).toBe(mockProviders.digilocker);
    expect(getProviders({ PROVIDER_DIGILOCKER: "setu", SETU_CLIENT_ID: "id", SETU_CLIENT_SECRET: "secret", SETU_PRODUCT_INSTANCE_ID: "product" }).digilocker).not.toBe(mockProviders.digilocker);
    expect(getProviders({ PROVIDER_DIGILOCKER: "apisetu", DIGILOCKER_CLIENT_ID: "id", DIGILOCKER_CLIENT_SECRET: "secret" }).digilocker).not.toBe(mockProviders.digilocker);
    const bad = getProviders({ PROVIDER_DIGILOCKER: "unexpected" });
    await expect(bad.digilocker.startAuth("u", "https://app.test/callback")).rejects.toThrow("refusing to fall back to mock");
  });
});
