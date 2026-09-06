import type { Metadata } from "next";
import Link from "next/link";
import { Chip } from "@/components/client-ui";
import { Globe, Plug, ShieldCheck, Sparkles } from "lucide-react";
import { db, t, eq } from "@applyonce/db";
import { PageHeader, Callout } from "@applyonce/ui";
import { requireUser } from "@/lib/session";
import { demoPortalUrl } from "@/lib/urls";
export const metadata: Metadata = { title: "Browser extension" };

const PORTALS = [
  { id: "nta-jee", name: "NTA — JEE Main", fields: 38, status: "ready" }, { id: "nsp", name: "National Scholarship Portal", fields: 41, status: "ready" },
  { id: "bta-demo", name: "Bharat Test Agency (demo)", fields: 48, status: "ready" }, { id: "generic", name: "Any other portal (label matching)", fields: 0, status: "beta" },
];
export default async function ExtensionPage() {
  const s = await requireUser("/app/extension");
  const hi = (s.user as { locale?: string }).locale === "hi";
  const flag = await db.query.flags.findFirst({ where: eq(t.flags.key, "extension") });
  const demo = demoPortalUrl() ?? "/app/apply/bta-jee-2026";
  return (
    <>
      <PageHeader title={hi ? "ब्राउज़र एक्सटेंशन" : "Browser extension"} subtitle={hi ? "जिन पोर्टलों पर 'Apply with ApplyOnce' नहीं है, वहाँ भी फ़ॉर्म एक क्लिक में भरें।" : "Fill forms on portals that don't have an Apply-with-ApplyOnce button yet. Sequential fill, verified values, nothing typed twice."}
        actions={<Link href="/app/extension/connect" className="cta inline-flex items-center gap-2 px-4 py-2.5 text-sm"><Plug className="size-4" />{hi ? "एक्सटेंशन जोड़ें" : "Connect extension"}</Link>} />
      {flag && !flag.enabled && <Callout tone="warning" title={hi ? "एक्सटेंशन अभी बंद है" : "Extension is switched off right now"}>{hi ? "जल्द ही वापस।" : "Back soon."}</Callout>}
      <div className="grid gap-4 lg:grid-cols-[1.2fr_1fr]">
        <section className="card p-5">
          <h2 className="flex items-center gap-2 font-display text-lg font-bold"><Globe className="size-5 text-brand-600" />{hi ? "इंस्टॉल (डेवलपर बिल्ड)" : "Install (developer build)"}</h2>
          <ol className="mt-3 grid gap-2 text-sm text-ink-2 [counter-reset:s]">
            {[
              [hi ? "बिल्ड करें" : "Build it", "pnpm --filter @applyonce/extension build  →  apps/extension/dist"],
              [hi ? "Chrome खोलें" : "Open Chrome", "chrome://extensions → turn on Developer mode (top right)"],
              [hi ? "अनपैक्ड लोड करें" : "Load unpacked", "Load unpacked → pick apps/extension/dist"],
              [hi ? "कनेक्ट करें" : "Connect", hi ? "ऊपर 'एक्सटेंशन जोड़ें' दबाएँ — 30-दिन का टोकन इस खाते से जुड़ता है।" : "Press Connect above — a 30-day token is bound to this account."],
              [hi ? "भरें" : "Fill", hi ? "किसी पोर्टल पर एक्सटेंशन आइकन → 'ApplyOnce can fill N fields' → OTP → हो गया।" : "On a portal, click the icon → 'ApplyOnce can fill N fields' → OTP → done."],
            ].map(([t, d], i) => <li key={i} className="flex gap-3"><span className="grid size-6 shrink-0 place-items-center rounded-pill bg-brand-50 text-xs font-bold text-brand-700">{i + 1}</span><div><div className="font-medium text-ink">{t}</div><code className="text-xs">{d}</code></div></li>)}
          </ol>
          <p className="mt-4 text-sm"><Link href={demo} target={demo.startsWith("http") ? "_blank" : undefined} rel={demo.startsWith("http") ? "noreferrer" : undefined} className="text-brand-600 underline">{hi ? "डेमो आवेदन पर आज़माएँ" : "Try the demo application"}</Link> · <Link href="/app/extension/connect" className="text-brand-600 underline">{hi ? "कनेक्शन स्थिति" : "Connection status"}</Link></p>
        </section>
        <section className="card p-5">
          <h2 className="flex items-center gap-2 font-display text-lg font-bold"><Sparkles className="size-5 text-brand-600" />{hi ? "समर्थित पोर्टल" : "Supported portals"}</h2>
          <ul className="mt-3 divide-y divide-line">{PORTALS.map((p) => <li key={p.id} className="flex items-center justify-between py-2.5"><div><div className="font-medium">{p.name}</div><div className="text-xs text-ink-3">{p.fields ? `${p.fields} fields mapped` : "heuristics"} · recipe <code>{p.id}</code></div></div><Chip size="sm" color={p.status === "ready" ? "success" : "warning"}>{p.status === "ready" ? (hi ? "तैयार" : "Ready") : "Beta"}</Chip></li>)}</ul>
          <div className="mt-4 rounded-md bg-surface-2 p-3 text-sm text-ink-2"><ShieldCheck className="mr-1 inline size-4 text-verified-500" />{hi ? "एक्सटेंशन केवल वही फ़ील्ड पढ़ता है जो आप भरने को कहते हैं। कैप्चा और फ़ाइल फ़ील्ड छोड़ता है। हर भराई ऑडिट लॉग में, कोई डेटा पोर्टल से बाहर नहीं जाता।" : "The extension only touches fields you ask it to fill, skips captcha and file inputs, never reads the page back to us, and every fill is in your audit log."}</div>
        </section>
      </div>
    </>
  );
}
