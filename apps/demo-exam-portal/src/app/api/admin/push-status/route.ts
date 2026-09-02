import { NextResponse } from "next/server";
import { generateIdempotencyKey } from "@/lib/id";
import { loadPramanConfig, pushStatus } from "@/lib/praman";
import { appendHistory, getApplication } from "@/lib/store";

/** The no-auth demo admin panel on `/status/[ref]`: push a status change, notifying Praman's tracker if this application came from there. */
export async function POST(request: Request) {
  const form = await request.formData();
  const ref = String(form.get("ref") ?? "");
  const status = String(form.get("status") ?? "");
  const note = String(form.get("note") ?? "");

  const app = getApplication(ref);
  if (!app) return NextResponse.json({ ok: false, error: { code: "not_found", message: `No application ${ref}` } }, { status: 404 });

  if (app.pramanApplicationId) {
    const cfg = loadPramanConfig();
    try {
      await pushStatus(cfg, app.pramanApplicationId, { status, note, externalRef: ref }, generateIdempotencyKey());
    } catch (err) {
      appendHistory(ref, { status: app.status, note: `Could not notify Praman tracker: ${(err as Error).message}`, at: new Date().toISOString(), actor: "system" });
    }
  }

  appendHistory(ref, { status, note, at: new Date().toISOString(), actor: "bta" });
  return NextResponse.redirect(new URL(`/status/${ref}`, request.url), { status: 303 });
}
