import { documentAllowed } from "@applyonce/schema";
import { db, t, eq } from "@applyonce/db";
import { handler, ok } from "@/lib/api";
import { extensionUser } from "../_auth";

/** GET /api/v1/extension/documents?profile= — list for the "attach from ApplyOnce" popup panel. */
export const GET = handler(async (req) => {
  const { profile } = await extensionUser(req);
  const rows = await db.select({ id: t.documents.id, title: t.documents.title, docType: t.documents.docType, mime: t.documents.mime, status:t.documents.status })
    .from(t.documents).where(eq(t.documents.profileId, profile.id));
  return ok(rows.filter(d=>d.status === "ready" && documentAllowed(profile.scope,d.docType)));
});
