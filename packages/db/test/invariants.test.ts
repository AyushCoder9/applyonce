/** Runs against the local docker Postgres (DATABASE_URL). Proves: no share without valid consent; facts encrypt + provenance rules. */
import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { db, sql, t, eq, getDek, putFact, getFacts, mask } from "../src";

process.env.PRAMAN_KEK_HEX ??= "0".repeat(64);
let profileId: string, partnerId: string, userId = "usr_test_inv";

beforeAll(async () => {
  await db.insert(t.user).values({ id: userId, name: "Test", phoneNumber: "+919999999999" }).onConflictDoNothing();
  const [p] = await db.insert(t.profiles).values({ ownerUserId: userId, displayName: "Test" }).returning();
  profileId = p!.id;
  const [pa] = await db.insert(t.partners).values({ slug: `test-${Date.now()}`, name: "Test Partner", kind: "other", status: "verified" }).returning();
  partnerId = pa!.id;
});
afterAll(async () => { await sql`DELETE FROM shares WHERE consent_id IN (SELECT id FROM consents WHERE granted_by_user_id = ${userId})`; await sql`DELETE FROM consents WHERE granted_by_user_id = ${userId}`; await db.delete(t.user).where(eq(t.user.id, userId)); await db.delete(t.partners).where(eq(t.partners.id, partnerId)); await sql.end(); });

const pgErr = async (p: Promise<unknown>, re: RegExp) => { try { await p; } catch (e: any) { expect(String(e.cause?.message ?? e.message)).toMatch(re); return; } throw new Error("expected rejection"); };
const share = (consentId: string, keys: string[]) => db.insert(t.shares).values({ consentId, sharedKeys: keys, payloadHash: "h", payloadEnc: Buffer.from("x"), shareTokenHash: `tok_${Math.random()}`, expiresAt: new Date(Date.now() + 6e5) });

describe("consent invariant (DB trigger)", () => {
  it("rejects a share whose keys exceed consent scope, revoked, or expired consent; accepts a valid one", async () => {
    const [c] = await db.insert(t.consents).values({ profileId, grantedByUserId: userId, partnerId, purpose: "exam_application", scope: ["identity.full_name", "identity.dob"], expiresAt: new Date(Date.now() + 864e5), stepUpMethod: "test" }).returning();
    await pgErr(share(c!.id, ["identity.full_name", "identity.pan"]), /PRAMAN_SCOPE_EXCEEDED/);
    await expect(share(c!.id, ["identity.full_name"])).resolves.toBeDefined();
    await db.update(t.consents).set({ revokedAt: new Date() }).where(eq(t.consents.id, c!.id));
    await pgErr(share(c!.id, ["identity.dob"]), /PRAMAN_CONSENT_REVOKED/);
    const [e] = await db.insert(t.consents).values({ profileId, grantedByUserId: userId, partnerId, purpose: "exam_application", scope: ["identity.dob"], expiresAt: new Date(Date.now() - 1000), stepUpMethod: "test" }).returning();
    await pgErr(share(e!.id, ["identity.dob"]), /PRAMAN_CONSENT_EXPIRED/);
  });
  it("audit log is immutable", async () => {
    await db.insert(t.auditLog).values({ action: "test", targetType: "x", hash: "h1" });
    await pgErr(db.delete(t.auditLog).where(eq(t.auditLog.action, "test")), /PRAMAN_AUDIT_IMMUTABLE/);
  });
});

describe("facts", () => {
  it("encrypts sensitive values, keeps provenance, refuses to downgrade issuer-verified", async () => {
    const dek = await getDek(userId);
    await putFact(dek, { profileId, key: "identity.pan", value: "ABCDE1234F", source: "self_declared" });
    const [raw] = await db.select().from(t.facts).where(eq(t.facts.factKey, "identity.pan"));
    expect(raw!.valueJson).toBeNull(); expect(raw!.valueEnc).not.toBeNull();
    expect((await getFacts(dek, profileId, { keys: ["identity.pan"] }))[0]!.value).toBe("ABCDE1234F");
    expect(mask("identity.pan", "ABCDE1234F")).toBe("ABCDE****F");
    await putFact(dek, { profileId, key: "identity.full_name", value: "Test User", source: "issuer_verified", verifiedBy: "uidai" });
    const r = await putFact(dek, { profileId, key: "identity.full_name", value: "Test Usr", source: "self_declared" });
    expect(r.status).toBe("mismatch");
    expect((await getFacts(dek, profileId, { keys: ["identity.full_name"] }))[0]!.value).toBe("Test User");
    expect((await getFacts(dek, profileId, { keys: ["identity.first_name"] }))[0]!.value).toBe("Test");
    expect((await db.select().from(t.mismatches).where(eq(t.mismatches.profileId, profileId))).length).toBe(1);
    await expect(putFact(dek, { profileId, key: "identity.nope", value: "x", source: "self_declared" })).rejects.toThrow(/Unknown fact_key/);
    await expect(putFact(dek, { profileId, key: "identity.aadhaar_ref_key", value: "x", source: "self_declared" })).rejects.toThrow();
  });
});
