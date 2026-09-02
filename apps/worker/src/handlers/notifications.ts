/** notifications queue: notify (insert + per-channel prefs + provider send) */
import { db, eq, and, user, notifications, notificationPrefs, notificationDeliveries } from "@praman/db";
import { providers } from "@praman/providers";
import type { JobMap } from "@praman/jobs";
import { logger } from "../logger";

export async function notify(data: JobMap["notify"]) {
  const { userId, category, title, body, link, channels } = data;
  const [row] = await db.insert(notifications).values({ userId, category, title, body: body ?? null, link: link ?? null }).returning();
  const wanted = channels ?? ["inapp"];
  const u = await db.query.user.findFirst({ where: eq(user.id, userId) });

  for (const channel of wanted) {
    if (channel === "inapp") {
      await db.insert(notificationDeliveries).values({ notificationId: row!.id, channel, status: "sent" });
      continue;
    }
    const pref = await db.query.notificationPrefs.findFirst({ where: and(eq(notificationPrefs.userId, userId), eq(notificationPrefs.channel, channel), eq(notificationPrefs.category, category)) });
    if (pref && !pref.enabled) {
      await db.insert(notificationDeliveries).values({ notificationId: row!.id, channel, status: "skipped" });
      continue;
    }
    try {
      if (channel === "sms" && u?.phoneNumber) {
        const r = await providers.sms.send(u.phoneNumber, body ? `${title} — ${body}` : title);
        await db.insert(notificationDeliveries).values({ notificationId: row!.id, channel, providerMsgId: r.id, status: "sent" });
      } else if (channel === "email" && u?.email) {
        const html = `<p>${body ?? title}</p>${link ? `<p><a href="${link}">Open in Praman</a></p>` : ""}`;
        const r = await providers.email.send(u.email, title, html);
        await db.insert(notificationDeliveries).values({ notificationId: row!.id, channel, providerMsgId: r.id, status: "sent" });
      } else {
        await db.insert(notificationDeliveries).values({ notificationId: row!.id, channel, status: "skipped", error: "no contact info or channel unsupported" });
      }
    } catch (err) {
      logger.warn({ err, userId, channel }, "notification delivery failed");
      await db.insert(notificationDeliveries).values({ notificationId: row!.id, channel, status: "failed", error: (err as Error).message });
    }
  }
  return { id: row!.id };
}
