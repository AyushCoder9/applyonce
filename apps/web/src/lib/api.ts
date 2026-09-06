import "server-only";
import { NextResponse } from "next/server";
import { z } from "zod";
import { db, t, eq, and, isNull, audit } from "@praman/db";
import { sha256 } from "@praman/crypto";
import { getSession, requireProfileAccess, AccessError, isSteppedUp, type Session } from "./session";

export class ApiError extends Error { constructor(public status: number, public code: string, message?: string, public fields?: Record<string, string>) { super(message ?? code); } }
export const ok = <T>(data: T, init?: ResponseInit) => NextResponse.json({ ok: true, data }, init);
export const fail = (status: number, code: string, message?: string, fields?: Record<string, string>) => NextResponse.json({ ok: false, error: { code, message: message ?? code, fields } }, { status });

type Ctx = { params: Promise<Record<string, string>> };
type Handler = (req: Request, ctx: { params: Record<string, string> }) => Promise<Response>;

/** Wrap a route handler: uniform errors, zod errors → 422. */
export const handler = (fn: Handler) => async (req: Request, ctx: Ctx) => {
  try { return await fn(req, { params: await ctx.params }); }
  catch (e) {
    if (e instanceof ApiError) return fail(e.status, e.code, e.message, e.fields);
    if (e instanceof AccessError) return fail(403, e.message);
    if (e instanceof z.ZodError) return fail(422, "VALIDATION", "Check the highlighted fields", Object.fromEntries(e.issues.map((i) => [i.path.join("."), i.message])));
    console.error(e);
    return fail(500, "INTERNAL", process.env.NODE_ENV === "production" ? "Something went wrong" : String((e as Error).message));
  }
};

export async function body<T extends z.ZodType>(req: Request, schema: T): Promise<z.infer<T>> {
  const j = await req.json().catch(() => { throw new ApiError(400, "BAD_JSON"); });
  return schema.parse(j);
}

/** Citizen auth for API routes. */
export async function citizen(req: Request, opts: { profileId?: string | null; stepUp?: boolean } = {}) {
  const origin = req.headers.get("origin");
  if (!["GET","HEAD","OPTIONS"].includes(req.method) && origin && ![new URL(req.url).origin,process.env.BETTER_AUTH_URL].includes(origin)) throw new ApiError(403,"ORIGIN_NOT_ALLOWED");
  const s = await getSession();
  if (!s) throw new ApiError(401, "UNAUTHENTICATED");
  if (opts.stepUp && !isSteppedUp(s)) throw new ApiError(403, "STEP_UP_REQUIRED", "Confirm with your passkey or OTP to continue");
  const url = new URL(req.url);
  const pid = opts.profileId ?? url.searchParams.get("profile") ?? undefined;
  const access = await requireProfileAccess(s, pid);
  return { session: s, user: s.user, ...access };
}

/** Partner auth via `Authorization: Bearer pk_(sandbox|live)_…` */
export async function partner(req: Request) {
  const h = req.headers.get("authorization") ?? "";
  const key = h.startsWith("Bearer ") ? h.slice(7).trim() : "";
  if (!key.startsWith("pk_")) throw new ApiError(401, "PARTNER_KEY_REQUIRED");
  const row = await db.query.partnerApiKeys.findFirst({ where: and(eq(t.partnerApiKeys.keyHash, sha256(key)), isNull(t.partnerApiKeys.revokedAt)) });
  if (!row) throw new ApiError(401, "PARTNER_KEY_INVALID");
  const p = await db.query.partners.findFirst({ where: eq(t.partners.id, row.partnerId) });
  if (!p || p.status === "suspended" || (row.env === "live" && p.status !== "verified")) throw new ApiError(403, "PARTNER_SUSPENDED");
  db.update(t.partnerApiKeys).set({ lastUsedAt: new Date() }).where(eq(t.partnerApiKeys.id, row.id)).catch(() => {});
  return { partner: p, env: row.env, keyId: row.id };
}

/** Idempotency for mutating partner calls. */
export async function idempotent<T>(req: Request, scope: string, fn: () => Promise<T>): Promise<T> {
  const key = req.headers.get("idempotency-key");
  if (!key) return fn();
  const k = `${scope}:${key}`;
  const hit = await db.query.idempotencyKeys.findFirst({ where: eq(t.idempotencyKeys.key, k) });
  if (hit) return hit.responseJson as T;
  const res = await fn();
  await db.insert(t.idempotencyKeys).values({ key: k, scope, responseJson: res as never }).onConflictDoNothing();
  return res;
}

export const log = (s: Session | null, action: string, targetType: string, targetId?: string | null, meta?: Record<string, unknown>) =>
  audit({ actorUserId: s?.user.id ?? null, action, targetType, targetId, meta });
