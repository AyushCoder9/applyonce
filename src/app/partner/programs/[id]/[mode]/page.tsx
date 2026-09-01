import { notFound } from "next/navigation";
import PartnerWorkspace from "../../../PartnerWorkspace";

const modes = ["builder", "requirements", "eligibility", "mapping", "branding", "preview"] as const;

export default async function PartnerProgramEditorPage({ params }: { params: Promise<{ id: string; mode: string }> }) {
  const { id, mode } = await params;
  if (!modes.includes(mode as (typeof modes)[number])) notFound();
  return <PartnerWorkspace initialSection="programs" initialFormId={id} />;
}
