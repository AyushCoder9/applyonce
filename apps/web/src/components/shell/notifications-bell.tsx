"use client";
import Link from "next/link";
import { Bell } from "lucide-react";
export function NotificationsBell({ unread }: { unread: number }) {
  return (
    <Link href="/app/notifications" aria-label={`Notifications${unread ? `, ${unread} unread` : ""}`} className="relative grid size-10 place-items-center rounded-pill hover:bg-surface-2">
      <Bell className="size-5" strokeWidth={1.75} />
      {unread > 0 && <span className="absolute right-1.5 top-1.5 min-w-4 rounded-pill bg-accent-500 px-1 text-center text-[10px] font-bold leading-4 text-white">{unread > 9 ? "9+" : unread}</span>}
    </Link>
  );
}
