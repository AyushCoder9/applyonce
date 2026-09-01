import { auth } from "@clerk/nextjs/server";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { ApplyOnceLogo } from "@/components/brand/ApplyOnceLogo";
import { isPlatformOperator } from "@/lib/ops-auth";

export default async function OperationsLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const { userId } = await auth();
  if (!userId) redirect("/sign-in");
  if (!isPlatformOperator(userId)) notFound();

  return <main className="ao-ops-shell"><header><ApplyOnceLogo size="sm" /><div><strong>Platform operations</strong><span>Restricted and audited</span></div><nav aria-label="Operations navigation"><Link href="/ops/partners">Partner approvals</Link><Link href="/ops/health">System health</Link><Link href="/app/today">Citizen workspace</Link></nav></header>{children}</main>;
}
