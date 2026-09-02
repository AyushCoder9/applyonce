import { z } from "zod";
import { db, t } from "@praman/db";
import { handler, ok, body } from "@/lib/api";
import { extensionUser } from "../_auth";

const Body = z.object({
  recipe: z.string().min(1),
  externalRef: z.string().max(80).optional(),
  portalUrl: z.string().url().optional(),
  title: z.string().min(1).max(160),
  orgName: z.string().min(1).max(160),
  kind: z.enum(t.appKind.enumValues).optional().default("other"),
});

/** POST /api/v1/extension/applications — recipe's ref-capture posts here after a portal submit. */
export const POST = handler(async (req) => {
  const { profile } = await extensionUser(req);
  const b = await body(req, Body);
  const [app] = await db.insert(t.applications).values({
    profileId: profile.id, title: b.title, orgName: b.orgName, kind: b.kind,
    externalRef: b.externalRef ?? null, portalUrl: b.portalUrl ?? null,
    status: "submitted", submittedAt: new Date(), source: "extension",
  }).returning({ id: t.applications.id });
  await db.insert(t.applicationEvents).values({
    applicationId: app!.id, type: "created", actor: "citizen",
    title: `Submitted via ${b.recipe === "generic" ? "browser autofill" : b.recipe}`,
    body: b.externalRef ? `Reference ${b.externalRef}` : null,
  });
  return ok({ id: app!.id });
});
