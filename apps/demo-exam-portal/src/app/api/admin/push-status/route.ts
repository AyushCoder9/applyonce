import { cookies } from "next/headers";
import { APPLICATION_STATUSES, isApplicationStatusTransitionAllowed, type ApplicationStatus } from "@applyonce/schema";
import { NextResponse } from "next/server";
import { generateIdempotencyKey } from "@/lib/id";
import { loadApplyOnceConfig, pushStatus } from "@/lib/applyonce";
import { appendHistory, getApplication } from "@/lib/store";

/** The no-auth demo admin panel on `/status/[ref]`: push a status change, notifying ApplyOnce's tracker if this application came from there. */
export async function POST(request: Request) {
  if(process.env.NODE_ENV === "production" && process.env.DEMO_ADMIN_ENABLED !== "1") return NextResponse.json({error:"Sandbox controls disabled"},{status:403});
  const form = await request.formData();
  const ref = String(form.get("ref") ?? "");
  const status = String(form.get("status") ?? "");
  const note = String(form.get("note") ?? "");

  const app = getApplication(ref);
  if (!app || !app.accessToken || (await cookies()).get("bta_access")?.value !== app.accessToken) return NextResponse.json({ ok: false, error: { code: "not_found", message: `No application ${ref}` } }, { status: 404 });

  if (!(APPLICATION_STATUSES as readonly string[]).includes(status) || note.length > 1000) return NextResponse.json({error:"Invalid status or note"},{status:422});
  if (app.consentRevoked) return NextResponse.json({error:"Consent was revoked"},{status:409});
  if (!isApplicationStatusTransitionAllowed(app.status as ApplicationStatus, status as ApplicationStatus)) {
    return NextResponse.json({ error: `Application cannot move from ${app.status} to ${status}.` }, { status: 409 });
  }
  if (app.applyonceApplicationId) {
    const cfg = loadApplyOnceConfig();
    try {
      await pushStatus(cfg, app.applyonceApplicationId, { status, note, externalRef: ref }, generateIdempotencyKey());
    } catch (err) {
      return NextResponse.json({error:"Could not notify ApplyOnce. Status was not changed; please retry."},{status:502});
    }
  }

  appendHistory(ref, { status, note, at: new Date().toISOString(), actor: "bta" });
  return NextResponse.redirect(new URL(`/status/${ref}`, request.url), { status: 303 });
}
