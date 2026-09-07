import { IdCard, Phone, MapPin, Users, BadgeCheck, GraduationCap, Briefcase, HeartPulse, Landmark, SlidersHorizontal, Folder, type LucideIcon } from "lucide-react";
const icons: Record<string, LucideIcon> = { IdCard, Phone, MapPin, Users, BadgeCheck, GraduationCap, Briefcase, HeartPulse, Landmark, SlidersHorizontal, Folder };
import { getDek, getFacts, completion } from "@applyonce/db";
import { SECTION_META, fieldsInSection } from "@applyonce/schema";
import { SectionCard, PageHeader, ProgressRing } from "@applyonce/ui";
import { requireUser, requireProfileAccess, scopeAllows } from "@/lib/session";
import { localeOf, tr, SECTION_ICON } from "@/components/vault/i18n";

export const metadata = { title: "My profile" };
export default async function VaultPage() {
  const s = await requireUser("/app/vault");
  const locale = localeOf(s.user);
  const a = await requireProfileAccess(s);
  const facts = await getFacts(await getDek(a.ownerUserId), a.profile.id);
  const sections = SECTION_META.filter((m) => scopeAllows(a.scope, m.id)).map((m) => ({ m, c: completion(facts, fieldsInSection(m.id).map((d) => d.key)), n: facts.filter((f) => f.key.startsWith(m.id + ".")).length }));
  const tot = sections.reduce((n, x) => n + x.c.total, 0), filled = sections.reduce((n, x) => n + x.c.filled, 0), ver = sections.reduce((n, x) => n + x.c.verified, 0);
  return (
    <div>
      <PageHeader title={tr(locale, "My profile", "मेरी प्रोफ़ाइल")} subtitle={tr(locale, `${a.profile.displayName} · every value shows its source, verification strength and sharing history. Provider records are simulated in this public sandbox.`, `${a.profile.displayName} · हर मान अपना स्रोत, सत्यापन स्तर और साझा इतिहास दिखाता है। इस सार्वजनिक सैंडबॉक्स में प्रदाता रिकॉर्ड नकली हैं।`)}
        actions={<ProgressRing value={filled} max={tot} label={tr(locale, `${ver} verified`, `${ver} सत्यापित`)} />} />
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3" data-testid="section-grid">
        {sections.map(({ m, c, n }) => {
          const I = icons[SECTION_ICON[m.icon] ?? "Folder"];
          const optOut = m.optIn && n === 0;
          return (
            <SectionCard key={m.id} href={`/app/vault/${m.id}`} title={m.label[locale]} blurb={optOut ? tr(locale, "Opt-in. Only add if you want to share health data.", "वैकल्पिक। केवल तभी जोड़ें जब स्वास्थ्य डेटा साझा करना हो।") : m.blurb[locale]} icon={I ? <I className="size-6" strokeWidth={1.75} /> : null}
              filled={optOut ? undefined : c.filled} total={optOut ? undefined : c.total} verified={optOut ? undefined : c.verified}
              cta={optOut ? <span className="rounded-pill bg-surface-2 px-2.5 py-1 text-xs font-medium text-ink-2">{tr(locale, "Off", "बंद")}</span> : c.filled < c.total ? <span className="text-sm font-medium text-brand-600">{tr(locale, `Add ${c.total - c.filled}`, `${c.total - c.filled} जोड़ें`)}</span> : <span className="text-sm font-medium text-verified-700">{tr(locale, "Complete", "पूर्ण")}</span>} />
          );
        })}
      </div>
    </div>
  );
}
