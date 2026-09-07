import { randomBytes } from "node:crypto";
import { NextResponse } from "next/server";
import { createShareSession, loadApplyOnceConfig } from "@/lib/applyonce";
import { rememberState } from "@/lib/store";

/**
 * "Apply with ApplyOnce" button posts here. We create a share session server-side
 * (the button never sees the API key) and 303-redirect the browser to `share_url` —
 * per docs/05-API-AND-FLOWS.md §1/F2 and the `@applyonce/sdk` contract.
 */
export async function POST(request: Request) {
  const cfg = loadApplyOnceConfig();
  const state = randomBytes(16).toString("hex");
  // Bind the callback to the origin the citizen actually opened. This keeps
  // preview/canary aliases and local audit ports browser-bound instead of
  // redirecting them to a build-time canonical host.
  const requestOrigin = new URL(request.url).origin;
  const returnUrl = new URL("/api/applyonce/callback", requestOrigin).toString();

  try {
    const { share_url, session_id } = await createShareSession(cfg, { returnUrl, state });
    await rememberState(state, session_id);
    const response = NextResponse.redirect(share_url, { status: 303 });
    response.cookies.set("bta_state", state, {httpOnly:true,sameSite:"lax",secure:new URL(requestOrigin).protocol === "https:",maxAge:900,path:"/"});
    return response;
  } catch (err) {
    return NextResponse.json({ ok: false, error: { code: "applyonce_unreachable", message: (err as Error).message } }, { status: 502 });
  }
}
