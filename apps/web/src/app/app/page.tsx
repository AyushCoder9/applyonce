import Link from "next/link";
import { LinkButton } from "@/components/vault/link-button";
import { redirect } from "next/navigation";
import { Send, Upload, BadgeCheck, AlertTriangle, CalendarClock, ScanLine, ArrowRight, Sparkles } from "lucide-react";
import { db, t, eq, and, isNull, desc, inArray, getDek, getFacts, completion } from "@applyonce/db";
import { fieldsInSection, field, scopeContains, documentAllowed } from "@applyonce/schema";
import { ProgressRing, SourceChip, fmtDate, daysUntil, label, EmptyState } from "@applyonce/ui";
import { requireUser, requireProfileAccess, scopeAllows } from "@/lib/session";
import { localeOf, tr } from "@/components/vault/i18n";

export const metadata = { title: "Home" };
const DONE = ["accepted", "rejected", "withdrawn", "enrolled"];
const CORE = ["identity", "contact", "address", "family", "category", "education"] as const;

export default async function Home() {
  const s = await requireUser("/app");
  const locale = localeOf(s.user);
  const a = await requireProfileAccess(s);
  const dek = await getDek(a.ownerUserId);
  const facts = (await getFacts(dek, a.profile.id)).filter(f=>scopeContains(a.scope,f.key) && !field(f.key).system);
  // brand-new user (only the OTP-verified mobile) → onboarding
  if (a.profile.kind === "self" && a.profile.ownerUserId === s.user.id && !facts.some((f) => f.key !== "contact.mobile_primary")) redirect("/welcome");

  const coreKeys = CORE.filter((sec) => scopeAllows(a.scope, sec)).flatMap((sec) => fieldsInSection(sec).map((d) => d.key));
  const comp = completion(facts, coreKeys);
  const expiring = facts.filter((f) => f.expiresAt && (daysUntil(f.expiresAt) ?? 999) <= 60).sort((x, y) => (daysUntil(x.expiresAt) ?? 0) - (daysUntil(y.expiresAt) ?? 0));
  const [mismatches, apps, docs, running] = await Promise.all([
    db.select().from(t.mismatches).where(and(eq(t.mismatches.profileId, a.profile.id), isNull(t.mismatches.resolvedAt))),
    db.select().from(t.applications).where(eq(t.applications.profileId, a.profile.id)).orderBy(desc(t.applications.updatedAt)).limit(8),
    db.select({ id: t.documents.id, title: t.documents.title, docType:t.documents.docType }).from(t.documents).where(eq(t.documents.profileId, a.profile.id)),
    db.select({ id: t.verificationJobs.id }).from(t.verificationJobs).where(and(eq(t.verificationJobs.profileId, a.profile.id), inArray(t.verificationJobs.status, ["queued", "running"]))),
  ]);
  const open = apps.filter((x) => !DONE.includes(x.status));
  const soon = open.filter((x) => x.deadlineAt && (daysUntil(x.deadlineAt) ?? 99) <= 7);
  const upcoming = open.filter((x) => x.deadlineAt && (daysUntil(x.deadlineAt) ?? -1) >= 0).sort((x, y) => +new Date(x.deadlineAt!) - +new Date(y.deadlineAt!)).slice(0, 5);
  const toReview = docs.length ? await db.select({ documentId: t.documentExtractions.documentId }).from(t.documentExtractions).where(and(inArray(t.documentExtractions.documentId, docs.filter(d=>documentAllowed(a.scope,d.docType)).map((d) => d.id)), isNull(t.documentExtractions.reviewedAt))) : [];

  const name = String(facts.find((f) => f.key === "identity.first_name")?.value ?? a.profile.displayName.split(" ")[0]);
  const h = new Date().getHours();
  const greet = locale === "hi" ? "नमस्ते" : h < 12 ? "Good morning" : h < 17 ? "Good afternoon" : "Good evening";
  const attention: { icon: React.ReactNode; title: string; body?: React.ReactNode; href: string; tone: "danger" | "pending" | "info" }[] = [
    ...mismatches.filter(m=>scopeContains(a.scope,m.factKey)).map((m) => ({ icon: <AlertTriangle className="size-5" />, tone: "danger" as const, href: "/app/verify#mismatches", title: tr(locale, `${label(m.factKey, locale)} doesn’t match the issuer`, `${label(m.factKey, locale)} जारीकर्ता से मेल नहीं खाता`), body: tr(locale,"Review the conflicting sources before sharing.","साझा करने से पहले स्रोतों की जाँच करें।") })),
    ...soon.map((x) => ({ icon: <CalendarClock className="size-5" />, tone: "danger" as const, href: `/app/applications/${x.id}`, title: tr(locale, `${x.title} closes in ${daysUntil(x.deadlineAt)} days`, `${x.title} ${daysUntil(x.deadlineAt)} दिन में बंद`), body: x.orgName })),
    ...expiring.map((f) => ({ icon: <CalendarClock className="size-5" />, tone: "pending" as const, href: "/app/verify#expiry", title: tr(locale, `${label(f.key, locale).replace(/ valid until$| expiry$/i, "")} ${(daysUntil(f.expiresAt) ?? 0) < 0 ? "has expired" : `expires in ${daysUntil(f.expiresAt)} days`}`, `${label(f.key, locale).replace(/ वैधता$| समाप्ति$/, "")} ${(daysUntil(f.expiresAt) ?? 0) < 0 ? "समाप्त हो गया" : `${daysUntil(f.expiresAt)} दिन में समाप्त`}`), body: <SourceChip source={f.source} verifiedBy={f.verifiedBy} expiresAt={f.expiresAt} locale={locale} /> })),
    ...(toReview.length ? [{ icon: <ScanLine className="size-5" />, tone: "info" as const, href: `/app/documents/${toReview[0]!.documentId}`, title: tr(locale, `${toReview.length} document${toReview.length > 1 ? "s" : ""} with facts to review`, `${toReview.length} दस्तावेज़ में तथ्य समीक्षा हेतु`), body: tr(locale, "We read them — confirm what to add to your profile.", "हमने पढ़ लिया — पुष्टि करें प्रोफ़ाइल में क्या जोड़ना है।") }] : []),
    ...(running.length ? [{ icon: <Sparkles className="size-5" />, tone: "info" as const, href: `/app/verify?job=${running[0]!.id}`, title: tr(locale, "Verification in progress", "सत्यापन चल रहा है"), body: tr(locale, "Watch it live on Verify.", "सत्यापन पर लाइव देखें।") }] : []),
  ];
  const TONE = { danger: "bg-danger-50 text-danger-500", pending: "bg-pending-50 text-pending-700", info: "bg-info-50 text-info-500" };

  return (
    <div className="grid gap-8">
      <div>
        <div className="text-sm text-ink-3">{fmtDate(new Date(), locale)}{a.profile.kind === "dependent" ? ` · ${tr(locale, "Viewing as guardian", "अभिभावक के रूप में")}` : ""}</div>
        <h1 className="mt-1 font-display text-3xl font-bold sm:text-4xl">{greet}, {name}.</h1>
        <p className="mt-1 text-ink-2">{comp.pct >= 100 ? tr(locale, "Your reusable profile is complete. Review and share it with supported forms.", "आपकी पुन: उपयोग योग्य प्रोफ़ाइल पूरी है। समर्थित फ़ॉर्म के साथ समीक्षा करके साझा करें।") : tr(locale, `${comp.total - comp.filled} core fields to go — connected sources can fill many automatically.`, `${comp.total - comp.filled} मुख्य फ़ील्ड बाकी — जुड़े स्रोत कई अपने आप भर सकते हैं।`)}</p>
      </div>

      <div className="grid gap-4 lg:grid-cols-[minmax(0,1.2fr)_minmax(0,2fr)]">
        <section className="card flex flex-col gap-4 p-6" data-testid="completion">
          <ProgressRing value={comp.filled} max={comp.total} size="lg" label={tr(locale, `core fields · ${comp.verified} verified`, `मुख्य फ़ील्ड · ${comp.verified} सत्यापित`)} />
          <div className="flex flex-wrap gap-2">
            <LinkButton variant="outline" size="sm" href="/app/vault">{tr(locale, "Open profile", "प्रोफ़ाइल खोलें")}<ArrowRight className="size-4" /></LinkButton>
            {comp.verified < comp.filled && <LinkButton variant="ghost" size="sm" href="/app/verify"><BadgeCheck className="size-4" />{tr(locale, "Verify more", "और सत्यापित करें")}</LinkButton>}
          </div>
        </section>
        <section className="grid gap-3 sm:grid-cols-3">
          <Link href="/app/apply" className="card group flex flex-col justify-between gap-4 p-5 transition-shadow hover:shadow-pop" data-testid="qa-apply">
            <span className="grid size-11 place-items-center rounded-md bg-accent-500 text-white"><Send className="size-5" /></span>
            <span><span className="block font-display text-lg font-bold">{tr(locale, "Apply", "आवेदन")}</span><span className="text-sm text-ink-2">{tr(locale, "Supported forms, one reviewed share.", "समर्थित फ़ॉर्म, एक समीक्षा किया हुआ साझा।")}</span></span>
          </Link>
          <Link href="/app/documents?upload=1" className="card group flex flex-col justify-between gap-4 p-5 transition-shadow hover:shadow-pop">
            <span className="grid size-11 place-items-center rounded-md bg-brand-50 text-brand-600"><Upload className="size-5" /></span>
            <span><span className="block font-display text-lg font-bold">{tr(locale, "Add document", "दस्तावेज़ जोड़ें")}</span><span className="text-sm text-ink-2">{tr(locale, "Review extracted facts before saving.", "सहेजने से पहले निकाले गए तथ्य जाँचें।")}</span></span>
          </Link>
          <Link href="/app/verify" className="card group flex flex-col justify-between gap-4 p-5 transition-shadow hover:shadow-pop">
            <span className="grid size-11 place-items-center rounded-md bg-verified-50 text-verified-700"><BadgeCheck className="size-5" /></span>
            <span><span className="block font-display text-lg font-bold">{tr(locale, "Verify", "सत्यापन")}</span><span className="text-sm text-ink-2">{tr(locale, "Mock sources in this demo.", "इस डेमो में नकली स्रोत।")}</span></span>
          </Link>
        </section>
      </div>

      <section>
        <h2 className="mb-3 font-display text-xl font-bold">{tr(locale, "Needs attention", "ध्यान दें")}</h2>
        {attention.length === 0 ? <EmptyState title={tr(locale, "All clear", "सब ठीक है")} blurb={tr(locale, "Nothing expiring, no mismatches, no deadlines this week.", "कुछ समाप्त नहीं हो रहा, कोई बेमेल नहीं, इस हफ़्ते कोई अंतिम तिथि नहीं।")} action={<LinkButton variant="outline" href="/app/apply">{tr(locale, "Find something to apply to", "आवेदन के लिए खोजें")}</LinkButton>} /> : (
          <ul className="card divide-y divide-line" data-testid="attention">
            {attention.slice(0, 8).map((it, i) => (
              <li key={i}><Link href={it.href} className="flex items-center gap-4 px-5 py-4 hover:bg-surface-2">
                <span className={`grid size-10 shrink-0 place-items-center rounded-md ${TONE[it.tone]}`}>{it.icon}</span>
                <span className="min-w-0 flex-1"><span className="block font-medium">{it.title}</span>{it.body && <span className="mt-0.5 block text-sm text-ink-2">{it.body}</span>}</span>
                <ArrowRight className="size-5 shrink-0 text-ink-3" />
              </Link></li>
            ))}
          </ul>
        )}
      </section>

      <div className="grid gap-6 lg:grid-cols-2">
        <section>
          <h2 className="mb-3 font-display text-xl font-bold">{tr(locale, "Upcoming deadlines", "आगामी अंतिम तिथियाँ")}</h2>
          {upcoming.length === 0 ? <p className="text-ink-2">{tr(locale, "No deadlines yet.", "अभी कोई अंतिम तिथि नहीं।")}</p> : (
            <ul className="card divide-y divide-line">{upcoming.map((x) => <li key={x.id}><Link href={`/app/applications/${x.id}`} className="flex items-center gap-3 px-5 py-3 hover:bg-surface-2"><span className={`grid min-w-14 place-items-center rounded-md px-2 py-1 text-center text-xs font-bold ${(daysUntil(x.deadlineAt) ?? 99) <= 7 ? "bg-danger-50 text-danger-500" : "bg-surface-2 text-ink-2"}`}>{daysUntil(x.deadlineAt)}d</span><span className="min-w-0 flex-1"><span className="block truncate font-medium">{x.title}</span><span className="text-sm text-ink-2">{x.orgName} · {fmtDate(x.deadlineAt, locale)}</span></span></Link></li>)}</ul>
          )}
        </section>
        <section>
          <h2 className="mb-3 font-display text-xl font-bold">{tr(locale, "Recent applications", "हाल के आवेदन")}</h2>
          {apps.length === 0 ? <p className="text-ink-2">{tr(locale, "Nothing yet — your first application will appear here.", "अभी कुछ नहीं — पहला आवेदन यहाँ दिखेगा।")}</p> : (
            <ul className="card divide-y divide-line">{apps.slice(0, 5).map((x) => <li key={x.id}><Link href={`/app/applications/${x.id}`} className="flex items-center gap-3 px-5 py-3 hover:bg-surface-2"><span className="min-w-0 flex-1"><span className="block truncate font-medium">{x.title}</span><span className="text-sm text-ink-2">{x.orgName}{x.externalRef ? ` · ${x.externalRef}` : ""}</span></span><span className="rounded-pill bg-brand-50 px-2.5 py-0.5 text-xs font-semibold capitalize text-brand-700">{x.status.replace("_", " ")}</span></Link></li>)}</ul>
          )}
        </section>
      </div>
    </div>
  );
}
