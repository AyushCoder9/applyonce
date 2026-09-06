import type { Metadata } from "next";
import { db, t, eq, desc } from "@applyonce/db";
import { PageHeader } from "@applyonce/ui";
import { requireUser } from "@/lib/session";
import { SettingsClient } from "@/components/settings/settings-client";
export const metadata: Metadata = { title: "Settings" };
export default async function SettingsPage({ searchParams }: { searchParams: Promise<{ tab?: string }> }) {
  const s = await requireUser("/app/settings");
  const { tab } = await searchParams;
  const locale = (s.user as { locale?: string }).locale === "hi" ? "hi" : "en";
  const [sessions, requests, audit] = await Promise.all([
    db.select().from(t.session).where(eq(t.session.userId, s.user.id)).orderBy(desc(t.session.updatedAt)),
    db.select().from(t.dataRequests).where(eq(t.dataRequests.userId, s.user.id)).orderBy(desc(t.dataRequests.requestedAt)).limit(10),
    db.select().from(t.auditLog).where(eq(t.auditLog.actorUserId, s.user.id)).orderBy(desc(t.auditLog.id)).limit(20),
  ]);
  return (
    <>
      <PageHeader title={locale === "hi" ? "सेटिंग्स" : "Settings"} subtitle={locale === "hi" ? "आपका खाता, सुरक्षा और डेटा अधिकार।" : "Your account, security and data rights."} />
      <SettingsClient locale={locale} tab={tab} user={{ name: s.user.name, phone: (s.user as { phoneNumber?: string | null }).phoneNumber ?? null, email: s.user.email ?? null }}
        sessions={sessions.map((x) => ({ id: x.id, userAgent: x.userAgent, ipAddress: x.ipAddress, createdAt: x.createdAt.toISOString(), expiresAt: x.expiresAt.toISOString(), current: x.id === s.session.id }))}
        requests={requests.map((r) => ({ id: r.id, kind: r.kind, status: r.status, requestedAt: r.requestedAt.toISOString(), fulfilledAt: r.fulfilledAt?.toISOString() ?? null, notes: r.notes }))}
        audit={audit.map((a) => ({ id: a.id, at: a.at.toISOString(), action: a.action, targetType: a.targetType, targetId: a.targetId, meta: a.meta }))} />
    </>
  );
}
