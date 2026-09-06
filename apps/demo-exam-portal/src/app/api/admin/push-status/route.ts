import { cookies } from "next/headers";
import { APPLICATION_STATUSES } from "@praman/schema";
import { NextResponse } from "next/server";
import { generateIdempotencyKey } from "@/lib/id";
import { loadPramanConfig, pushStatus } from "@/lib/praman";
import { appendHistory, getApplication } from "@/lib/store";

/** The no-auth demo admin panel on `/status/[ref]`: push a status change, notifying Praman's tracker if this application came from there. */
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
  if (app.pramanApplicationId) {
    const cfg = loadPramanConfig();
    try {
      await pushStatus(cfg, app.pramanApplicationId, { status, note, externalRef: ref }, generateIdempotencyKey());
    } catch (err) {
      return NextResponse.json({error:"Could not notify Praman. Status was not changed; please retry."},{status:502});
    }
  }

  appendHistory(ref, { status, note, at: new Date().toISOString(), actor: "bta" });
  return NextResponse.redirect(new URL(`/status/${ref}`, request.url), { status: 303 });
}
