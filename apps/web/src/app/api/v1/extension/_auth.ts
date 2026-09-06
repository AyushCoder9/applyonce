import "server-only";
import { db, t, eq, and, gt } from "@applyonce/db";
import { listProfiles } from "@/lib/session";
import { ApiError } from "@/lib/api";

/** Dedicated, revocable extension sessions; bearer credentials never belong in URLs. */
export async function extensionUser(req: Request) {
  const url = new URL(req.url);
  const h = req.headers.get("authorization") ?? "";
  const token = h.startsWith("Bearer ") ? h.slice(7).trim() : "";
  if (!token) throw new ApiError(401, "EXTENSION_TOKEN_REQUIRED", "Connect the extension from applyonce.in/app/extension/connect");

  const row = await db.query.session.findFirst({ where: and(eq(t.session.token, token), gt(t.session.expiresAt, new Date()), eq(t.session.userAgent,"applyonce-extension")) });
  if (!row) throw new ApiError(401, "EXTENSION_TOKEN_INVALID", "This extension isn't connected, or the connection expired. Reconnect.");

  const user = await db.query.user.findFirst({ where: eq(t.user.id, row.userId) });
  if (!user) throw new ApiError(401, "EXTENSION_TOKEN_INVALID");

  const { self, all } = await listProfiles(user.id);
  const pid = url.searchParams.get("profile") ?? self?.id ?? all[0]?.id;
  const profile = all.find((p) => p.id === pid);
  if (!profile) throw new ApiError(403, "PROFILE_FORBIDDEN", "No accessible profile for this token");

  return { extSession: row, user, profile, all, ownerUserId: profile.ownerUserId };
}
