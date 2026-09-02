import { db, t } from "@praman/db";
import { randomToken } from "@praman/crypto";
import { handler, citizen, ok, log } from "@/lib/api";

const THIRTY_DAYS_MS = 30 * 24 * 60 * 60 * 1000;

/** Mints a 30-day opaque token the extension uses as `Authorization: Bearer <token>`. */
export const POST = handler(async (req) => {
  const { session, user, all } = await citizen(req);
  const expiresAt = new Date(Date.now() + THIRTY_DAYS_MS);
  const id = randomToken(16);
  const token = randomToken();
  await db.insert(t.session).values({
    id,
    userId: user.id,
    token,
    expiresAt,
    userAgent: "praman-extension",
    ipAddress: req.headers.get("x-forwarded-for") ?? null,
  });
  await log(session, "extension.token.create", "session", id);
  return ok({
    token,
    expiresAt: expiresAt.toISOString(),
    user: { name: user.name },
    profiles: all.map((p) => ({ id: p.id, displayName: p.displayName, kind: p.kind })),
  });
});
