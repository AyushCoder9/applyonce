import { db, t, and, eq, isNull, count } from "@applyonce/db";
import { requireUser, listProfiles } from "@/lib/session";
import { CitizenShell } from "@/components/shell/citizen-shell";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const s = await requireUser("/app");
  const [profiles, [{ n } = { n: 0 }]] = await Promise.all([
    listProfiles(s.user.id),
    db.select({ n: count() }).from(t.notifications).where(and(eq(t.notifications.userId, s.user.id), isNull(t.notifications.readAt))),
  ]);
  const { self, all } = profiles;
  const requested = (s.session as { activeProfileId?: string | null }).activeProfileId;
  const active = all.some(p=>p.id===requested) ? requested! : self?.id ?? all[0]?.id ?? "";
  return (
    <CitizenShell user={{ name: s.user.name, image: s.user.image }} activeProfileId={active} unread={n} profiles={all.map((p) => ({ id: p.id, displayName: p.displayName, kind: p.kind, role: p.role }))}>
      {children}
    </CitizenShell>
  );
}
