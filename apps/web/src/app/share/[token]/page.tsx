import { documentAllowed } from "@praman/schema";
import Link from "next/link";
import { redirect } from "next/navigation";
import { AlertTriangle } from "lucide-react";
import { db, t, and, eq, getDek, getFacts } from "@praman/db";
import { getSession, listProfiles, requireProfileAccess } from "@/lib/session";
import { loadShareSession, buildDiff, diffSummary } from "@/lib/share";
import { ShareFlow } from "@/components/share/share-flow";

const PROBLEM = {
  notfound: { title: "This link doesn’t exist", blurb: "Check the link, or go back to the portal and click “Apply with Praman” again." },
  expired: { title: "This link has expired", blurb: "Share links are valid for 15 minutes. Go back to the portal and click “Apply with Praman” again." },
  used: { title: "Already shared", blurb: "You’ve already completed this request. Check Connections to see exactly what was shared." },
  cancelled: { title: "Request cancelled", blurb: "The partner cancelled this request. Start again from their portal." },
};

export default async function SharePage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const s = await getSession();
  if (!s) redirect(`/auth/login?next=${encodeURIComponent(`/share/${token}`)}`);
  const loaded = await loadShareSession(token);
  const problem = !loaded ? "notfound" : loaded.problem;
  if (!loaded || problem) {
    const p = PROBLEM[problem ?? "notfound"];
    return (
      <div className="card p-8 text-center" data-testid="share-problem">
        <div className="mx-auto grid size-14 place-items-center rounded-pill bg-pending-50 text-pending-700"><AlertTriangle className="size-7" /></div>
        <h1 className="mt-4 font-display text-2xl font-bold">{p.title}</h1>
        <p className="mt-2 text-ink-2">{p.blurb}</p>
        <div className="mt-6 flex justify-center gap-3"><Link href="/app/connections" className="rounded-pill border border-line px-5 py-2.5 font-medium">Connections</Link><Link href="/app" className="cta px-5 py-2.5">Go to Praman</Link></div>
      </div>
    );
  }
  const { self, all } = await listProfiles(s.user.id);
  const activeId = (s.session as { activeProfileId?: string | null }).activeProfileId;
  let access;
  try { access = await requireProfileAccess(s, activeId ?? self?.id); } catch { access = await requireProfileAccess(s, all[0]?.id); }
  const keys = loaded.form.requestedFields.map((r) => r.key);
  const facts = await getFacts(await getDek(access.ownerUserId), access.profile.id, { keys });
  const rows = buildDiff(facts, loaded.form, { maskSensitive: true, scope: access.scope });
  const documents = await db.select({ id: t.documents.id, title: t.documents.title, docType: t.documents.docType }).from(t.documents).where(and(eq(t.documents.profileId, access.profile.id), eq(t.documents.status, "ready")));
  const locale = ((s.user as { locale?: string }).locale === "hi" ? "hi" : "en") as "en" | "hi";
  return (
    <ShareFlow
      token={token} locale={locale} phone={(s.user as { phoneNumber?: string | null }).phoneNumber ?? null}
      partner={{ id: loaded.partner.id, name: loaded.partner.name, kind: loaded.partner.kind, logoUrl: loaded.partner.logoUrl, website: loaded.partner.website, verified: loaded.partner.status === "verified" }}
      form={{ id: loaded.form.id, name: loaded.form.name, purpose: loaded.form.purpose, retentionDays: loaded.form.retentionDays, customFields: loaded.form.customFields, deadlineAt: loaded.form.deadlineAt?.toISOString() ?? null }}
      session={{ id: loaded.session.id, returnUrl: loaded.session.returnUrl, state: loaded.session.state, expiresAt: loaded.session.expiresAt.toISOString(), env: loaded.session.env }}
      profiles={all.map((p) => ({ id: p.id, displayName: p.displayName, kind: p.kind, role: p.role }))}
      initial={{ profileId: access.profile.id, rows, summary: diffSummary(rows), documents:documents.filter(d=>documentAllowed(access.scope,d.docType)) }}
    />
  );
}
