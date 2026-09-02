import "server-only";
import { db, t, eq, and, gt } from "@praman/db";
import { listProfiles } from "@/lib/session";
import { ApiError } from "@/lib/api";

/**
 * Extension auth: NOT a better-auth session cookie. The extension holds a long-lived
 * (30-day) opaque token minted by `POST /api/v1/extension/token`, stored as a normal
 * row in the existing `session` table (userAgent: 'praman-extension'). We look it up by
 * the raw token — same as better-auth does internally — no bearer plugin needed.
 *
 * Token is read from `Authorization: Bearer <token>` (background service worker calls),
 * falling back to a `?token=` query param so a plain `<a href>`/`<img>`-style link (the
 * "attach from Praman" document download) also works without custom headers. ponytail:
 * a query-param token is weaker than a header, acceptable for a short-lived doc-preview
 * URL — the underlying document PUT/upload flow never uses this fallback.
 */
export async function extensionUser(req: Request) {
  const url = new URL(req.url);
  const h = req.headers.get("authorization") ?? "";
  const token = h.startsWith("Bearer ") ? h.slice(7).trim() : (url.searchParams.get("token") ?? "");
  if (!token) throw new ApiError(401, "EXTENSION_TOKEN_REQUIRED", "Connect the extension from praman.in/app/extension/connect");

  const row = await db.query.session.findFirst({ where: and(eq(t.session.token, token), gt(t.session.expiresAt, new Date())) });
  if (!row) throw new ApiError(401, "EXTENSION_TOKEN_INVALID", "This extension isn't connected, or the connection expired. Reconnect.");

  const user = await db.query.user.findFirst({ where: eq(t.user.id, row.userId) });
  if (!user) throw new ApiError(401, "EXTENSION_TOKEN_INVALID");

  const { self, all } = await listProfiles(user.id);
  const pid = url.searchParams.get("profile") ?? self?.id ?? all[0]?.id;
  const profile = all.find((p) => p.id === pid);
  if (!profile) throw new ApiError(403, "PROFILE_FORBIDDEN", "No accessible profile for this token");

  return { extSession: row, user, profile, all, ownerUserId: profile.ownerUserId };
}
