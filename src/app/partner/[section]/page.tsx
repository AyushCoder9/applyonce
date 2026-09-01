import { notFound } from "next/navigation";
import PartnerWorkspace from "../PartnerWorkspace";

const sections = ["overview", "programs", "submissions", "team", "api-keys", "webhooks", "integrations", "audit", "settings"] as const;
export type PartnerSection = (typeof sections)[number];

export function isPartnerSection(value: string): value is PartnerSection {
  return sections.includes(value as PartnerSection);
}

export default async function PartnerSectionPage({ params }: { params: Promise<{ section: string }> }) {
  const { section } = await params;
  if (!isPartnerSection(section)) notFound();
  return <PartnerWorkspace initialSection={section} />;
}
