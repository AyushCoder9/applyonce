import { notFound } from "next/navigation";
import AuthenticatedWorkspace, { type CitizenView } from "../AuthenticatedWorkspace";

const sections: Record<string, CitizenView> = {
  today: "overview",
  people: "people",
  profile: "profile",
  sources: "sources",
  documents: "documents",
  programs: "programs",
  applications: "applications",
  consents: "consents",
  activity: "activity",
  notifications: "notifications",
  help: "help",
  settings: "settings",
};

export default async function CitizenSectionPage({ params }: { params: Promise<{ section: string }> }) {
  const { section } = await params;
  const initialView = sections[section];
  if (!initialView) notFound();
  return <AuthenticatedWorkspace initialView={initialView} />;
}
