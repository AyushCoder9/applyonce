import { db, t, eq, and, isNull, desc } from "@praman/db";
import { PageHeader, daysUntil } from "@praman/ui";
import { requireUser, requireProfileAccess } from "@/lib/session";
import { loadFacts } from "@/app/api/v1/profiles/_lib";
import { localeOf, tr } from "@/components/vault/i18n";
import { VerifyHub } from "@/components/vault/verify-hub";

export const metadata = { title: "Verify" };
export default async function VerifyPage({ searchParams }: { searchParams: Promise<{ job?: string; error?: string }> }) {
  const { job, error } = await searchParams;
  const s = await requireUser("/app/verify");
  const locale = localeOf(s.user);
  const a = await requireProfileAccess(s);
  const links = await db.select().from(t.providerLinks).where(eq(t.providerLinks.userId, a.ownerUserId));
  const jobs = await db.select().from(t.verificationJobs).where(eq(t.verificationJobs.profileId, a.profile.id)).orderBy(desc(t.verificationJobs.createdAt)).limit(10);
  const mismatches = await db.select().from(t.mismatches).where(and(eq(t.mismatches.profileId, a.profile.id), isNull(t.mismatches.resolvedAt))).orderBy(desc(t.mismatches.createdAt));
  const facts = await loadFacts(a);
  const expiring = facts.filter((f) => f.expiresAt).sort((x, y) => (daysUntil(x.expiresAt) ?? 0) - (daysUntil(y.expiresAt) ?? 0));
  const verified = facts.filter((f) => f.source === "issuer_verified" || f.source === "provider_verified").length;
  return (
    <div>
      <PageHeader title={tr(locale, "Verify", "सत्यापन")} subtitle={tr(locale, `${verified} of ${facts.length} facts are verified by their issuer. Connect more sources to turn amber into green.`, `${facts.length} में से ${verified} तथ्य जारीकर्ता-सत्यापित हैं। और स्रोत जोड़कर पीले को हरा करें।`)} />
      <VerifyHub profileId={a.profile.id} locale={locale} focusJobId={job ?? null} error={error ?? null}
        links={links.map((l) => ({ provider: l.provider, status: l.status, lastSyncAt: l.lastSyncAt?.toISOString() ?? null, linkedAt: l.linkedAt.toISOString(), meta: l.meta }))}
        jobs={jobs.map((j) => ({ id: j.id, profileId: j.profileId, provider: j.provider, kind: j.kind, status: j.status, progress: j.progress, error: j.error, resultJson: j.resultJson, finishedAt: j.finishedAt?.toISOString() ?? null, createdAt: j.createdAt.toISOString() }))}
        mismatches={mismatches.map((m) => ({ id: m.id, factKey: m.factKey, sourceA: m.sourceA, valueA: m.valueA, sourceB: m.sourceB, valueB: m.valueB, severity: m.severity, createdAt: m.createdAt.toISOString() }))}
        expiring={expiring} />
    </div>
  );
}
