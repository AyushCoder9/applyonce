import { db, t, and, eq, isNull, count } from "@praman/db";
import { requireUser, listProfiles } from "@/lib/session";
import { CitizenShell } from "@/components/shell/citizen-shell";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const s = await requireUser("/app");
  const { self, all } = await listProfiles(s.user.id);
  const active = (s.session as { activeProfileId?: string | null }).activeProfileId ?? self?.id ?? all[0]?.id ?? "";
  const [{ n } = { n: 0 }] = await db.select({ n: count() }).from(t.notifications).where(and(eq(t.notifications.userId, s.user.id), isNull(t.notifications.readAt)));
  return (
    <CitizenShell user={{ name: s.user.name, image: s.user.image }} activeProfileId={active} unread={n} profiles={all.map((p) => ({ id: p.id, displayName: p.displayName, kind: p.kind, role: p.role }))}>
      {children}
    </CitizenShell>
  );
}
