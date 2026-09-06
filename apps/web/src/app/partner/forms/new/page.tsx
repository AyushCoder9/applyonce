import { PageHeader } from "@applyonce/ui";
import { requirePartnerMember } from "@/components/partner/session";
import { FormBuilder } from "@/components/partner/form-builder";

export const metadata = { title: "New form" };

export default async function NewFormPage() {
  const { partner } = await requirePartnerMember();
  return (
    <>
      <PageHeader back={{ href: "/partner/forms", label: "Forms" }} title="New form" subtitle="Pick a purpose, tick the fields you need, add your own questions. The preview is what a citizen sees." />
      <FormBuilder partnerName={partner.name} verified={partner.status === "verified"} />
    </>
  );
}
