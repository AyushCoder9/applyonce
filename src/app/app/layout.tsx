import Link from "next/link";
import { UserButton } from "@clerk/nextjs";
import { auth, currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { ApplyOnceLogo } from "@/components/brand/ApplyOnceLogo";

export default async function CitizenLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const { userId } = await auth();
  if (!userId) redirect("/sign-in");

  const user = await currentUser();
  const name = [user?.firstName, user?.lastName].filter(Boolean).join(" ") || "Citizen";

  return <main className="ao-app-page"><div className="ao-app-account-bar"><Link href="/" className="ao-app-brand"><ApplyOnceLogo href="" size="sm" /></Link><div className="ao-app-account"><span>{name}</span><UserButton /></div></div>{children}</main>;
}
