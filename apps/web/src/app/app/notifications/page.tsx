import type { Metadata } from "next";
import { db, t, eq, desc } from "@praman/db";
import { PageHeader } from "@praman/ui";
import { requireUser } from "@/lib/session";
import { NotificationsList } from "@/components/settings/notifications-list";
export const metadata: Metadata = { title: "Notifications" };
export default async function NotificationsPage() {
  const s = await requireUser("/app/notifications");
  const locale = (s.user as { locale?: string }).locale === "hi" ? "hi" : "en";
  const rows = await db.select().from(t.notifications).where(eq(t.notifications.userId, s.user.id)).orderBy(desc(t.notifications.createdAt)).limit(200);
  return (
    <>
      <PageHeader title={locale === "hi" ? "सूचनाएँ" : "Notifications"} />
      <NotificationsList locale={locale} items={rows.map((n) => ({ ...n, readAt: n.readAt?.toISOString() ?? null, createdAt: n.createdAt.toISOString() }))} />
    </>
  );
}
