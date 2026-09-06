import { db, t, eq, desc, inArray, systemDek } from "@praman/db";
import { decryptString } from "@praman/crypto";
import type { PramanPayload } from "@praman/schema";
import { PageHeader } from "@praman/ui";
import { requirePartnerMember } from "@/components/partner/session";
import { decodeJws } from "@/lib/signing";
import { ApplicantsTable, type ApplicantRow } from "@/components/partner/applicants-table";

export const metadata = { title: "Applicants" };

export default async function ApplicantsPage() {
  const { partner } = await requirePartnerMember();
  const apps = await db.select({ a: t.applications, profile: t.profiles.displayName, form: t.forms.name }).from(t.applications).innerJoin(t.profiles, eq(t.applications.profileId, t.profiles.id)).leftJoin(t.forms, eq(t.applications.formId, t.forms.id)).where(eq(t.applications.partnerId, partner.id)).orderBy(desc(t.applications.createdAt)).limit(500);
  const shares = apps.length ? await db.select().from(t.shares).where(inArray(t.shares.applicationId, apps.map((x) => x.a.id))) : [];
  const consents = shares.length ? await db.select().from(t.consents).where(inArray(t.consents.id,shares.map(s=>s.consentId))) : [];
  const rows: ApplicantRow[] = apps.map(({ a, profile, form }) => {
    const s = shares.find((x) => x.applicationId === a.id);
    let verified = 0, self = 0, total = 0, guardian = false, applicant = profile;
    const consent=consents.find(c=>c.id===s?.consentId);
    const active=!!consent && !consent.revokedAt && consent.expiresAt.getTime()>Date.now();
    if (!active && s) applicant="Access ended";
    if (s && active) { try { const p = decodeJws<PramanPayload>(decryptString(systemDek(), s.payloadEnc, `share:${s.id}`)); total = p.facts.length; verified = p.facts.filter((f) => f.source === "issuer_verified" || f.source === "provider_verified").length; self = p.facts.filter((f) => f.source === "self_declared").length; guardian = !!p.profile.guardian_acting; applicant = p.profile.display_name; } catch { /* undecodable */ } }
    return { id: a.id, applicant, form: form ?? a.title, status: a.status, externalRef: a.externalRef, submittedAt: (a.submittedAt ?? a.createdAt).toISOString(), verified, self, total, hasPayload: !!s, guardian };
  });
  return (
    <>
      <PageHeader title="Applicants" subtitle={`${rows.length} application${rows.length === 1 ? "" : "s"} · click a row for the decrypted payload, status push and re-verification`} />
      <ApplicantsTable rows={rows} />
    </>
  );
}
