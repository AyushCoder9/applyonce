import { PageHeader } from "@praman/ui";
import { requirePartnerMember, canManage } from "@/components/partner/session";
import { SettingsForm } from "@/components/partner/settings-form";

export const metadata = { title: "Partner settings" };

export default async function PartnerSettings() {
  const { partner, role } = await requirePartnerMember();
  return (
    <>
      <PageHeader title="Settings" subtitle={`${partner.legalName ?? partner.name} · ${partner.regType ?? "registration"} ${partner.regNo ?? ""} · status ${partner.status}`} />
      <SettingsForm canManage={canManage(role)} initial={{ name: partner.name, website: partner.website ?? "", dpoEmail: partner.dpoEmail ?? "", retentionDays: partner.retentionDays, logoUrl: partner.logoUrl ?? "" }} />
    </>
  );
}
