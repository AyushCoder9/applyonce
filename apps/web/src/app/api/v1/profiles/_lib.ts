import "server-only";
import { db, t, eq, and, getDek, getFacts, mask } from "@praman/db";
import { field, type Fact } from "@praman/schema";
import { decryptString } from "@praman/crypto";
import { scopeAllows } from "@/lib/session";
import { ApiError } from "@/lib/api";

export type Access = { profile: { id: string; ownerUserId: string; kind: "self" | "dependent"; displayName: string }; scope: string[]; ownerUserId: string };
export type FactOut = Fact & { masked?: boolean };
export const sectionOf = (key: string) => key.split(".")[0]!;

/** Facts the caller may see; sensitive values masked unless `reveal` (caller must have checked step-up). */
export async function loadFacts(a: Access, opts: { section?: string; keys?: string[]; reveal?: boolean } = {}): Promise<FactOut[]> {
  const dek = await getDek(a.ownerUserId);
  const rows = await getFacts(dek, a.profile.id, { section: opts.section, keys: opts.keys });
  const visible = rows.filter((f) => !field(f.key).system && scopeAllows(a.scope, sectionOf(f.key)));
  return opts.reveal ? visible : visible.map((f) => (field(f.key).sensitive ? { ...f, value: mask(f.key, f.value), masked: true } : f));
}

export async function createJob(profileId: string, provider: typeof t.providerName.enumValues[number], kind: string, inputJson: Record<string, unknown> = {}) {
  const [j] = await db.insert(t.verificationJobs).values({ profileId, provider, kind, inputJson, status: "queued", progress: { step: "Queued", pct: 0, log: [] } }).returning();
  return j!;
}

/** Decrypt a provider link's reference for this user. */
export async function providerRef(userId: string, provider: typeof t.providerName.enumValues[number]) {
  const link = await db.query.providerLinks.findFirst({ where: and(eq(t.providerLinks.userId, userId), eq(t.providerLinks.provider, provider)) });
  if (!link) throw new ApiError(404, "NOT_LINKED", `${provider} is not connected yet`);
  if (link.providerRefEnc) return decryptString(await getDek(userId), link.providerRefEnc, `provider:${userId}:${provider}`);
  const meta = (link.meta ?? {}) as { ref?: string };
  if (meta.ref) return meta.ref; // seeded links keep a plain ref in meta
  throw new ApiError(409, "LINK_BROKEN", "Reconnect this provider");
}

/** Origin for redirects/callbacks — the request’s own origin (dev servers move ports), else NEXT_PUBLIC_APP_URL. */
export const appUrl = (req?: Request) => (req ? new URL(req.url).origin : process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3300");
export const withJob = (next: string, jobId: string) => `${next}${next.includes("?") ? "&" : "?"}job=${jobId}`;
