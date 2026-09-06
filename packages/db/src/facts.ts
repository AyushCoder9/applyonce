/**
 * Fact repository: the only way facts are written. Validates against the registry, encrypts sensitive values,
 * enforces "issuer-verified is never overwritten by a weaker source" (creates a mismatch instead), keeps history.
 */
import { and, eq, inArray } from "drizzle-orm";
import { field, isFactKey, validateFact, type Source, type Fact, type FactValue, SOURCES, documentTypeForKey } from "@praman/schema";
import { encryptJson, decryptJson } from "@praman/crypto";
import { db, type Db, type Tx } from "./client";
import { facts, factHistory, mismatches, documents } from "./schema";

const RANK: Record<Source, number> = { self_declared: 0, document_extracted: 1, provider_verified: 2, issuer_verified: 3 };
const aad = (profileId: string, key: string, i: number) => `fact:${profileId}:${key}:${i}`;

export interface PutFact {
  profileId: string; key: string; value: FactValue; repeatIndex?: number; source: Source;
  verifiedBy?: string | null; verifiedAt?: Date | null; expiresAt?: Date | null; evidenceDocumentId?: string | null;
  confidence?: number | null; updatedBy?: string | null; reason?: string;
}
export type PutResult = { status: "created" | "updated" | "unchanged" | "mismatch"; id?: string };

export async function putFact(dek: Buffer, p: PutFact, tx: Db | Tx = db): Promise<PutResult> {
  // Serialize the provenance decision with its write, including derived facts/history.
  if (tx === db) return db.transaction(inner => putFact(dek, p, inner));
  const def = field(p.key);
  if (def.system && p.source === "self_declared") throw new Error(`system key ${p.key} cannot be self-declared`);
  if (!def.sources.includes(p.source)) throw new Error(`${p.key} does not accept source ${p.source}`);
  const parsed = validateFact(p.key, p.value);
  if (!parsed.success) throw new Error(`invalid ${p.key}: ${parsed.error.issues.map((i) => i.message).join(", ")}`);
  const value = parsed.data as FactValue;
  if (def.type === "file_ref" && value != null) {
    const doc = await tx.query.documents.findFirst({ where: and(eq(documents.id, String(value)), eq(documents.profileId, p.profileId), eq(documents.status, "ready")) });
    if (!doc) throw new Error(`invalid ${p.key}: choose a ready document from this profile`);
    const expected = documentTypeForKey(p.key);
    if (expected && doc.docType !== expected) throw new Error(`invalid ${p.key}: choose a ${expected} document`);
  }
  const i = p.repeatIndex ?? 0;
  if (!Number.isInteger(i) || i < 0 || i > 50) throw new Error("repeatIndex must be an integer from 0 to 50");
  if (i > 0 && !def.repeat) throw new Error(`${p.key} is not repeatable`);

  const [existing] = await tx.select().from(facts).where(and(eq(facts.profileId, p.profileId), eq(facts.factKey, p.key), eq(facts.repeatIndex, i))).limit(1).for("update");
  const oldValue = existing ? readValue(dek, existing, p.profileId) : undefined;

  if (existing && RANK[existing.source] > RANK[p.source] && !sameValue(oldValue, value)) {
    await tx.insert(mismatches).values({ profileId: p.profileId, factKey: p.key, sourceA: existing.verifiedBy ?? existing.source, valueA: String(display(def.sensitive ? mask(p.key, oldValue!) : oldValue)), sourceB: p.verifiedBy ?? p.source, valueB: String(display(def.sensitive ? mask(p.key, value) : value)), severity: p.key === "identity.full_name" || p.key === "identity.dob" ? "high" : "medium" });
    return { status: "mismatch", id: existing.id };
  }
  if (existing && sameValue(oldValue, value) && (RANK[existing.source] > RANK[p.source] || (RANK[existing.source] === RANK[p.source] && p.source === "self_declared"))) return { status: "unchanged", id: existing.id };

  const enc = def.sensitive;
  const row = {
    profileId: p.profileId, factKey: p.key, repeatIndex: i,
    valueJson: enc ? null : value, valueEnc: enc ? encryptJson(dek, value, aad(p.profileId, p.key, i)) : null, isSensitive: !!enc,
    source: p.source, verifiedBy: p.verifiedBy ?? null, verifiedAt: p.verifiedAt ?? (p.source !== "self_declared" ? new Date() : null),
    expiresAt: p.expiresAt ?? null, evidenceDocumentId: p.evidenceDocumentId ?? null, confidence: p.confidence ?? null, updatedBy: p.updatedBy ?? null, updatedAt: new Date(),
  };
  if (existing) {
    await tx.update(facts).set(row).where(eq(facts.id, existing.id));
    await tx.insert(factHistory).values({ factId: existing.id, oldValueEnc: encryptJson(dek, oldValue), newValueEnc: encryptJson(dek, value), oldSource: existing.source, changedBy: p.updatedBy ?? null, reason: p.reason ?? null });
    await derive(dek, p, value, tx);
    return { status: "updated", id: existing.id };
  }
  const [ins] = await tx.insert(facts).values(row).returning({ id: facts.id });
  await derive(dek, p, value, tx);
  return { status: "created", id: ins!.id };
}

/** derived keys kept in sync (first/middle/last name, bank last4) */
async function derive(dek: Buffer, p: PutFact, value: FactValue, tx: Db | Tx) {
  const w = (key: string, v: FactValue) => putFact(dek, { ...p, key, value: v, repeatIndex: 0, source: p.source, verifiedBy: p.verifiedBy }, tx).catch(() => undefined);
  if (p.key === "identity.full_name" && typeof value === "string") {
    const parts = value.trim().split(/\s+/);
    await w("identity.first_name", parts[0]!);
    if (parts.length > 2) await w("identity.middle_name", parts.slice(1, -1).join(" "));
    if (parts.length > 1) await w("identity.last_name", parts[parts.length - 1]!);
  }
  if (p.key === "bank.primary.account_no" && typeof value === "string") await w("bank.primary.account_last4", value.slice(-4));
}

export function readValue(dek: Buffer, row: typeof facts.$inferSelect, profileId: string): FactValue {
  return row.isSensitive && row.valueEnc ? decryptJson<FactValue>(dek, row.valueEnc, aad(profileId, row.factKey, row.repeatIndex)) : (row.valueJson as FactValue);
}

export async function getFacts(dek: Buffer, profileId: string, opts: { section?: string; keys?: string[] } = {}, tx: Db | Tx = db): Promise<Fact[]> {
  if (opts.keys && opts.keys.length === 0) return [];
  const where = [eq(facts.profileId, profileId)];
  if (opts.keys?.length) where.push(inArray(facts.factKey, opts.keys));
  const rows = await tx.select().from(facts).where(and(...where));
  return rows
    .filter((r) => !opts.section || r.factKey.startsWith(opts.section + "."))
    .filter((r) => isFactKey(r.factKey) && !field(r.factKey).system || opts.keys?.includes(r.factKey))
    .map((r) => ({ key: r.factKey, value: readValue(dek, r, profileId), repeatIndex: r.repeatIndex, source: r.source, verifiedBy: r.verifiedBy, verifiedAt: r.verifiedAt?.toISOString() ?? null, expiresAt: r.expiresAt?.toISOString() ?? null, evidenceDocumentId: r.evidenceDocumentId, confidence: r.confidence, updatedAt: r.updatedAt.toISOString() }))
    .sort((a, b) => a.key.localeCompare(b.key) || a.repeatIndex - b.repeatIndex);
}

export async function deleteFact(profileId: string, key: string, repeatIndex = 0, tx: Db | Tx = db) {
  await tx.delete(facts).where(and(eq(facts.profileId, profileId), eq(facts.factKey, key), eq(facts.repeatIndex, repeatIndex)));
}

/** Mask for UI when not stepped-up. */
export function mask(key: string, value: FactValue): FactValue {
  if (value == null || !field(key).sensitive) return value;
  const s = String(value);
  if (key === "identity.pan") return s.slice(0, 5) + "****" + s.slice(-1);
  if (typeof value === "number") return "•••••";
  if (Array.isArray(value)) return value.map(() => "•••");
  if (typeof value === "object") return { masked: true };
  return s.length <= 4 ? "••••" : "•".repeat(Math.max(4, s.length - 4)) + s.slice(-4);
}

const sameValue = (a: unknown, b: unknown) => JSON.stringify(norm(a)) === JSON.stringify(norm(b));
const norm = (v: unknown) => (typeof v === "string" ? v.trim().toLowerCase().replace(/\s+/g, " ") : v);
const display = (v: unknown) => (typeof v === "object" ? JSON.stringify(v) : v);
export const isSource = (s: string): s is Source => (SOURCES as readonly string[]).includes(s);

/** Profile completion: keys present per section / keys that matter (non-system, non-derived, non-repeat). */
export function completion(present: Fact[], keys: readonly string[]) {
  const have = new Set(present.map((f) => f.key));
  const total = keys.filter((k) => { const d = field(k); return !d.system && !d.derived && !d.repeat; });
  const filled = total.filter((k) => have.has(k));
  const verified = filled.filter((k) => present.some((f) => f.key === k && (f.source === "issuer_verified" || f.source === "provider_verified")));
  return { total: total.length, filled: filled.length, verified: verified.length, pct: total.length ? Math.round((filled.length / total.length) * 100) : 0 };
}
