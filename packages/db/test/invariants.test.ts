/** Runs against the local docker Postgres (DATABASE_URL). Proves: no share without valid consent; facts encrypt + provenance rules. */
import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { db, sql, t, eq, getDek, putFact, getFacts, mask, listAccessibleProfiles } from "../src";

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


describe("audit regressions", () => {
  it("empty scopes never become full vault reads; verified refresh extends expiry", async () => {
    const dek = await getDek(userId);
    expect(await getFacts(dek,profileId,{keys:[]})).toEqual([]);
    await putFact(dek,{profileId,key:"identity.gender",value:"M",source:"issuer_verified",verifiedBy:"uidai",expiresAt:new Date(Date.now()-1000)});
    const expiresAt = new Date(Date.now()+86400000);
    await putFact(dek,{profileId,key:"identity.gender",value:"M",source:"issuer_verified",verifiedBy:"uidai",expiresAt});
    expect((await getFacts(dek,profileId,{keys:["identity.gender"]}))[0]!.expiresAt).toBe(expiresAt.toISOString());
  });
  it("document references require the matching type, ready state and same profile", async () => {
    const dek = await getDek(userId);
    const [ward] = await db.insert(t.profiles).values({ownerUserId:userId,kind:"dependent",displayName:"Ward"}).returning();
    const [foreign] = await db.insert(t.documents).values({profileId:ward!.id,docType:"photo",title:"Foreign photo",origin:"upload",status:"ready"}).returning();
    const [wrong] = await db.insert(t.documents).values({profileId,docType:"signature",title:"Signature",origin:"upload",status:"ready"}).returning();
    await expect(putFact(dek,{profileId,key:"identity.photo",value:foreign!.id,source:"self_declared"})).rejects.toThrow(/ready document/);
    await expect(putFact(dek,{profileId,key:"identity.photo",value:wrong!.id,source:"self_declared"})).rejects.toThrow(/photo document/);
    const withoutRelation = await listAccessibleProfiles(userId);
    expect(withoutRelation.all.some(p=>p.id===ward!.id)).toBe(false);
    await db.insert(t.relations).values({guardianProfileId:profileId,wardProfileId:ward!.id,relation:"guardian",basis:"elder_consent",scope:["health"]});
    expect((await listAccessibleProfiles(userId)).all.find(p=>p.id===ward!.id)?.scope).toEqual(["health"]);
  });
});


describe("concurrent provenance",()=>{
  it("a weaker simultaneous write cannot downgrade verified evidence",async()=>{
    const dek=await getDek(userId);
    await putFact(dek,{profileId,key:"identity.nationality",value:"IN",source:"self_declared"});
    await Promise.all([
      putFact(dek,{profileId,key:"identity.nationality",value:"IN",source:"issuer_verified",verifiedBy:"uidai"}),
      ...Array.from({length:6},()=>putFact(dek,{profileId,key:"identity.nationality",value:"NRI",source:"self_declared"})),
    ]);
    const fact=(await getFacts(dek,profileId,{keys:["identity.nationality"]}))[0]!;
    expect(fact.source).toBe("issuer_verified");expect(fact.value).toBe("IN");
  });
});
