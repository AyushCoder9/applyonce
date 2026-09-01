import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";

export default async function PartnerLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const { userId } = await auth();
  if (!userId) redirect("/sign-in");
  return <main className="ao-partner-page">{children}</main>;
}
