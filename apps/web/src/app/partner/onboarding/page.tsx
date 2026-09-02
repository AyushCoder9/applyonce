import { redirect } from "next/navigation";
import { partnerMembership } from "@/components/partner/session";
import { OnboardingForm } from "@/components/partner/onboarding-form";

export const metadata = { title: "Register your organisation" };

export default async function PartnerOnboarding() {
  const { partner } = await partnerMembership();
  if (partner) redirect("/partner");
  return (
    <div className="mx-auto max-w-xl">
      <h1 className="font-display text-3xl font-bold">Register your organisation</h1>
      <p className="mt-2 mb-6 text-ink-2">Takes two minutes. You get sandbox keys immediately; live keys after Praman verifies your registration.</p>
      <OnboardingForm />
    </div>
  );
}
