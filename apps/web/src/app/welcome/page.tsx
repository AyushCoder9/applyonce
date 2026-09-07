import { db, t, eq, and, getDek, getFacts, count } from "@applyonce/db";
import { requireUser, requireProfileAccess } from "@/lib/session";
import { localeOf } from "@/components/vault/i18n";
import { OnboardingWizard } from "@/components/onboarding/wizard";
import { demoPortalUrl } from "@/lib/urls";
import { providerModes } from "@/components/admin/data";

export default async function WelcomePage({ searchParams }: { searchParams: Promise<{ step?: string; job?: string; error?: string }> }) {
  const sp = await searchParams;
  const s = await requireUser("/welcome");
  const locale = localeOf(s.user);
  const a = await requireProfileAccess(s, null);
  const facts = await getFacts(await getDek(a.ownerUserId), a.profile.id);
  const [{ n: passkeys } = { n: 0 }] = await db.select({ n: count() }).from(t.passkey).where(eq(t.passkey.userId, s.user.id));
  const link = await db.query.providerLinks.findFirst({ where: and(eq(t.providerLinks.userId, s.user.id), eq(t.providerLinks.provider, "digilocker")) });
  const isSandbox = providerModes().some(({ state }) => state === "demo" || state === "sandbox");
  const name = String(facts.find((f) => f.key === "identity.full_name")?.value ?? (s.user.name === "New user" ? "" : s.user.name));
  return (
    <OnboardingWizard profileId={a.profile.id} locale={locale} initialName={name} initialStep={Math.max(0, Math.min(6, Number(sp.step ?? 0) || 0))} jobId={sp.job ?? null} error={sp.error ?? null}
      hasDigilocker={!!link} hasPasskey={passkeys > 0} isSandbox={isSandbox} demoUrl={demoPortalUrl() ?? "/app/apply/bta-jee-2026"} initialFacts={facts} />
  );
}
