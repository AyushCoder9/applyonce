import { getDatabase } from "@/db";
import { notifications } from "@/db/schema";

export async function queueInAppNotification(input: {
  profileId: string;
  applicationId?: string;
  type: string;
  subject: string;
  body: string;
}) {
  const db = getDatabase();
  const [notification] = await db
    .insert(notifications)
    .values({
      profileId: input.profileId,
      applicationId: input.applicationId,
      channel: "in_app",
      type: input.type,
      status: "sent",
      subject: input.subject,
      body: input.body,
      provider: "database_outbox",
      sentAt: new Date(),
    })
    .returning();

  return notification;
}

export function emailDeliveryStatus() {
  return {
    enabled: Boolean(process.env.RESEND_API_KEY && process.env.RESEND_FROM_EMAIL),
    provider: process.env.RESEND_API_KEY ? "resend" : "disabled",
    reason: process.env.RESEND_API_KEY
      ? null
      : "A verified sending domain is required before transactional email is enabled.",
  };
}
