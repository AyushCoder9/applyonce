import { randomBytes } from "node:crypto";
import { NextResponse } from "next/server";
import { createShareSession, loadPramanConfig } from "@/lib/praman";
import { rememberState } from "@/lib/store";

/**
 * "Apply with Praman" button posts here. We create a share session server-side
 * (the button never sees the API key) and 303-redirect the browser to `share_url` —
 * per docs/05-API-AND-FLOWS.md §1/F2 and the `@praman/sdk` contract.
 */
export async function POST() {
  const cfg = loadPramanConfig();
  const state = randomBytes(16).toString("hex");
  const returnUrl = new URL("/api/praman/callback", cfg.selfUrl).toString();

  try {
    const { share_url, session_id } = await createShareSession(cfg, { returnUrl, state });
    rememberState(state, session_id);
    const response = NextResponse.redirect(share_url, { status: 303 });
    response.cookies.set("bta_state", state, {httpOnly:true,sameSite:"lax",secure:new URL(cfg.selfUrl).protocol === "https:",maxAge:900,path:"/"});
    return response;
  } catch (err) {
    return NextResponse.json({ ok: false, error: { code: "praman_unreachable", message: (err as Error).message } }, { status: 502 });
  }
}
