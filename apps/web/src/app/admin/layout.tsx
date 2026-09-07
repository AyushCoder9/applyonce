import { requireAdmin } from "@/lib/session";
import { SideShell } from "@/components/shell/side-shell";
import { ADMIN_NAV } from "@/components/shell/nav";
export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  await requireAdmin();
  return <SideShell nav={ADMIN_NAV} title="ApplyOnce Ops" subtitle="Internal admin · synthetic sandbox">{children}</SideShell>;
}
