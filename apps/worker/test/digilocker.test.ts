/** digilocker.sync against the real seeded DB. Sunita's seed has only 2 docs (aadhaar, pan) + a provider_link with meta.ref. */
import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { db, eq, and, sql, profiles, verificationJobs, documents, getDek, getFacts } from "@praman/db";
import { SUNITA } from "@praman/providers/fixtures";
import { runInline } from "../src/inline";

let profileId: string;
let jobId: string;

beforeAll(async () => {
  const profile = await db.query.profiles.findFirst({ where: and(eq(profiles.ownerUserId, SUNITA.id), eq(profiles.kind, "self")) });
  if (!profile) throw new Error("seed missing — run `pnpm db:seed` (or `pnpm db:reset`) at repo root first");
  profileId = profile.id;
  const [job] = await db.insert(verificationJobs).values({ profileId, provider: "digilocker", kind: "sync" }).returning();
  jobId = job!.id;
});

afterAll(async () => {
  await db.delete(verificationJobs).where(eq(verificationJobs.id, jobId));
  await sql.end();
});

describe("digilocker.sync", () => {
  it("writes issuer-verified identity.full_name and a document row for Sunita", async () => {
    const result = (await runInline("digilocker.sync", { jobId, userId: SUNITA.id, profileId, providerRef: `dl_${SUNITA.id}` })) as { docs: number; facts: number; mismatches: number };
    expect(result.docs).toBeGreaterThanOrEqual(2);

    const dek = await getDek(SUNITA.id);
    const [nameFact] = await getFacts(dek, profileId, { keys: ["identity.full_name"] });
    expect(nameFact?.source).toBe("issuer_verified");
    expect(nameFact?.value).toBe(SUNITA.aadhaar.name);

    const docs = await db.select().from(documents).where(eq(documents.profileId, profileId));
    expect(docs.length).toBeGreaterThanOrEqual(2);
    expect(docs.some((d) => d.docType === "aadhaar" && d.status === "ready")).toBe(true);

    const finished = await db.query.verificationJobs.findFirst({ where: eq(verificationJobs.id, jobId) });
    expect(finished?.status).toBe("succeeded");
  });
});
