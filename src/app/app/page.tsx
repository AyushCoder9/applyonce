import Link from "next/link";
import { auth, currentUser } from "@clerk/nextjs/server";
import { UserButton } from "@clerk/nextjs";
import { redirect } from "next/navigation";
import { ApplyOnceLogo } from "@/components/brand/ApplyOnceLogo";
import AuthenticatedWorkspace from "./AuthenticatedWorkspace";

export default async function AppPage() {
  const { userId } = await auth();
  if (!userId) redirect("/sign-in");

  const user = await currentUser();
  const name = [user?.firstName, user?.lastName].filter(Boolean).join(" ") || "Citizen";

  return <main className="ao-app-page">
    <div className="ao-app-account-bar"><Link href="/" className="ao-app-brand"><ApplyOnceLogo href="" size="sm" /></Link><div className="ao-app-account"><span>{name}</span><UserButton /></div></div>
    <AuthenticatedWorkspace />
  </main>;
}
