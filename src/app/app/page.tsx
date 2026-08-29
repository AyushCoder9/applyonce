import Link from "next/link";
import { currentUser } from "@clerk/nextjs/server";
import { UserButton } from "@clerk/nextjs";
import AuthenticatedWorkspace from "./AuthenticatedWorkspace";

export default async function AppPage() {
  const user = await currentUser();
  const name = [user?.firstName, user?.lastName].filter(Boolean).join(" ") || "Citizen";

  return (
    <main className="workspace-page">
      <header className="workspace-topbar">
        <Link className="brand" href="/">
          <span className="brand-mark">✦</span>
          ApplyOnce
        </Link>
        <div className="workspace-account">
          <span>{name}</span>
          <UserButton />
        </div>
      </header>
      <AuthenticatedWorkspace />
    </main>
  );
}
