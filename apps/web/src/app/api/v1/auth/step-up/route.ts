import { z } from "zod";
import { headers } from "next/headers";
import { db, t, eq } from "@praman/db";
import { handler, citizen, body, ok, ApiError, log } from "@/lib/api";
import { auth } from "@/lib/auth";
import { STEP_UP_WINDOW_MS } from "@/lib/session";

/** POST {method:'otp', code} | {method:'passkey'} → marks session.steppedUpAt (valid 5 min). */
export const POST = handler(async (req) => {
  const { session, user } = await citizen(req);
  const b = await body(req, z.object({ method: z.enum(["otp", "passkey"]), code: z.string().optional() }));
  if (b.method === "otp") {
    const phone = (user as { phoneNumber?: string | null }).phoneNumber;
    if (!phone || !b.code) throw new ApiError(400, "OTP_REQUIRED", "Enter the 6-digit code");
    try { await auth.api.verifyPhoneNumber({ body: { phoneNumber: phone, code: b.code, disableSession: true }, headers: await headers() }); }
    catch { throw new ApiError(401, "INVALID_OTP", "Wrong code. Check and try again."); }
  } else {
    const row = await db.query.session.findFirst({where:eq(t.session.id,session.session.id)});
    if (!row?.steppedUpAt || Date.now() - row.steppedUpAt.getTime() >= STEP_UP_WINDOW_MS) throw new ApiError(401,"PASSKEY_REQUIRED","Sign in with your passkey again to continue.");
  }
  const at = new Date();
  await db.update(t.session).set({ steppedUpAt: at }).where(eq(t.session.id, session.session.id));
  await log(session, "auth.step_up", "session", session.session.id, { method: b.method });
  return ok({ steppedUpAt: at.toISOString(), expiresAt: new Date(at.getTime() + STEP_UP_WINDOW_MS).toISOString() });
});
