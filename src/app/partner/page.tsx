import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import PartnerWorkspace from "./PartnerWorkspace";

export default async function PartnerPage() {
  const { userId } = await auth();
  if (!userId) redirect("/sign-in");
  return <main className="ao-partner-page"><PartnerWorkspace /></main>;
}
