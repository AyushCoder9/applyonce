import type { Metadata } from "next";
import { PageHeader, dateInputValue } from "@applyonce/ui";
import { requireUser } from "@/lib/session";
import { familyList } from "@/components/family/data";
import { FamilyClient } from "@/components/family/family-client";
import { AddButton } from "@/components/family/add-button";

export const metadata: Metadata = { title: "Family" };
export default async function FamilyPage({ searchParams }: { searchParams: Promise<{ add?: string }> }) {
  const s = await requireUser("/app/family");
  const { add } = await searchParams;
  const locale = ((s.user as { locale?: string }).locale === "hi" ? "hi" : "en") as "en" | "hi";
  const { members } = await familyList(s.user.id);
  const active = (s.session as { activeProfileId?: string | null }).activeProfileId ?? "";
  const renderedAt = new Date();
  const defaultAccessUntil = new Date(renderedAt.getTime() + 365 * 864e5);
  return (
    <>
      <PageHeader title={locale === "hi" ? "परिवार" : "Family"} subtitle={locale === "hi" ? "बच्चों और बुज़ुर्गों के फ़ॉर्म आप भरें — उनकी पहचान, आपकी सहमति।" : "Fill forms for your children and parents. Their identity, your consent, one place."} actions={<AddButton locale={locale} />} />
      <FamilyClient members={members} locale={locale} openAdd={add === "1"} activeProfileId={active} today={dateInputValue(renderedAt)} defaultAccessUntil={dateInputValue(defaultAccessUntil)} />
    </>
  );
}
