import { db, t, eq, desc, inArray } from "@applyonce/db";
import { PageHeader } from "@applyonce/ui";
import { requirePartnerMember, canManage } from "@/components/partner/session";
import { DevelopersPanel } from "@/components/partner/developers-panel";
import { deploymentAppUrl } from "@/lib/urls";

export const metadata = { title: "Developers" };

export default async function DevelopersPage() {
  const { partner, role } = await requirePartnerMember();
  const keys = await db.select().from(t.partnerApiKeys).where(eq(t.partnerApiKeys.partnerId, partner.id)).orderBy(desc(t.partnerApiKeys.createdAt));
  const hooks = await db.select().from(t.partnerWebhooks).where(eq(t.partnerWebhooks.partnerId, partner.id)).orderBy(desc(t.partnerWebhooks.createdAt));
  const deliveries = hooks.length ? await db.select().from(t.webhookDeliveries).where(inArray(t.webhookDeliveries.webhookId, hooks.map((h) => h.id))).orderBy(desc(t.webhookDeliveries.createdAt)).limit(100) : [];
  return (
    <>
      <PageHeader title="Developers" subtitle="Keys are shown once and stored hashed. Webhooks are signed with a per-endpoint secret." />
      <DevelopersPanel canManage={canManage(role)} verified={partner.status === "verified"} appUrl={deploymentAppUrl()}
        keys={keys.map((k) => ({ id: k.id, env: k.env, prefix: k.prefix, label: k.label, createdAt: k.createdAt.toISOString(), lastUsedAt: k.lastUsedAt?.toISOString() ?? null, revokedAt: k.revokedAt?.toISOString() ?? null }))}
        hooks={hooks.map((h) => ({ id: h.id, url: h.url, events: h.events, active: h.active, createdAt: h.createdAt.toISOString() }))}
        deliveries={deliveries.map((d) => ({ id: d.id, event: d.event, status: d.status, attempts: d.attempts, responseStatus: d.responseStatus, lastError: d.lastError, createdAt: d.createdAt.toISOString(), url: hooks.find((h) => h.id === d.webhookId)?.url ?? "" }))} />
    </>
  );
}
