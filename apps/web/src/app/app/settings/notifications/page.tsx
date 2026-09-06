import type { Metadata } from "next";
import { db, t, eq } from "@applyonce/db";
import { PageHeader } from "@applyonce/ui";
import { requireUser } from "@/lib/session";
import { mergePrefs } from "@/components/settings/prefs";
import { PrefsGrid } from "@/components/settings/prefs-grid";
export const metadata: Metadata = { title: "Notification preferences" };
export default async function PrefsPage() {
  const s = await requireUser("/app/settings/notifications");
  const locale = (s.user as { locale?: string }).locale === "hi" ? "hi" : "en";
  const m = mergePrefs(await db.select().from(t.notificationPrefs).where(eq(t.notificationPrefs.userId, s.user.id)));
  return (<><PageHeader back={{ href: "/app/settings", label: locale === "hi" ? "सेटिंग्स" : "Settings" }} title={locale === "hi" ? "सूचना प्राथमिकताएँ" : "Notification preferences"} subtitle={locale === "hi" ? "किस चैनल पर क्या चाहिए, आप तय करें।" : "Pick what reaches you, and where."} /><PrefsGrid initial={m} locale={locale} /></>);
}
