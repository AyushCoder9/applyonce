/** Share flow helpers. `buildDiff`/`diffSummary`/`withQuery` are pure (unit-tested); `loadShareSession` reads the DB. */
import { canShare, field, isFactKey, type Fact, type FieldDiffRow, type Purpose, type CustomField } from "@praman/schema";
import { db, t, eq, mask } from "@praman/db";
import { randomToken, sha256 } from "@praman/crypto";

export interface FormLike { purpose: Purpose; requestedFields: { key: string; required: boolean }[]; customFields?: CustomField[] }

/** Requested vs have vs missing for one profile. Sensitive values are masked (payload is built server-side at consent). */
export function buildDiff(facts: Fact[], form: FormLike, opts: { maskSensitive?: boolean } = {}): FieldDiffRow[] {
  const byKey = new Map(facts.filter((f) => f.repeatIndex === 0).map((f) => [f.key, f]));
  return form.requestedFields.filter((r) => isFactKey(r.key)).map((r) => {
    if (!canShare(r.key, form.purpose)) return { key: r.key, required: r.required, status: "blocked" };
    const f = byKey.get(r.key);
    if (!f || f.value == null || f.value === "") return { key: r.key, required: r.required, status: "missing" };
    const status = f.source === "issuer_verified" || f.source === "provider_verified" ? "verified" : f.source === "document_extracted" ? "extracted" : "self";
    const value = opts.maskSensitive && field(r.key).sensitive ? mask(r.key, f.value) : f.value;
    return { key: r.key, required: r.required, status, value, source: f.source, verifiedBy: f.verifiedBy ?? null };
  });
}

export function diffSummary(rows: FieldDiffRow[]) {
  const n = (s: FieldDiffRow["status"]) => rows.filter((r) => r.status === s).length;
  return { requested: rows.length, verified: n("verified"), extracted: n("extracted"), self: n("self"), missing: n("missing"), missingRequired: rows.filter((r) => r.status === "missing" && r.required).length, blocked: n("blocked") };
}

/** Append query params to a URL that may already have a query string. */
export function withQuery(url: string, params: Record<string, string | null | undefined>) {
  const u = new URL(url);
  for (const [k, v] of Object.entries(params)) if (v != null) u.searchParams.set(k, v);
  return u.toString();
}

/** share_token = `<sessionId>.<random>` so a partner (or the SDK) can derive the session id; DB stores only the hash. */
export const newShareToken = (sessionId: string) => `${sessionId}.${randomToken(24)}`;
export const shareTokenSessionId = (token: string) => token.split(".")[0] ?? "";
export const hashToken = (token: string) => sha256(token);

export const SESSION_TTL_MS = 15 * 60 * 1000;
export const SHARE_TTL_MS = 10 * 60 * 1000;

/** Session + form + partner by URL token. `problem` explains why the flow can’t continue. */
export async function loadShareSession(token: string) {
  const [row] = await db.select({ session: t.shareSessions, form: t.forms, partner: t.partners }).from(t.shareSessions)
    .innerJoin(t.forms, eq(t.shareSessions.formId, t.forms.id)).innerJoin(t.partners, eq(t.shareSessions.partnerId, t.partners.id))
    .where(eq(t.shareSessions.token, token)).limit(1);
  if (!row) return null;
  const problem: "expired" | "used" | "cancelled" | null =
    row.session.status === "open" && row.session.expiresAt.getTime() < Date.now() ? "expired"
    : row.session.status === "expired" ? "expired"
    : row.session.status === "cancelled" ? "cancelled"
    : row.session.status !== "open" ? "used" : null;
  return { ...row, problem };
}
