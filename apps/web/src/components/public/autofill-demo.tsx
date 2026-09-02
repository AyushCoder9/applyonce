"use client";
/** The signature moment: an exam form filling itself from verified sources. Loops; static when reduced-motion. */
import { useEffect, useState } from "react";
import { motion, AnimatePresence, useReducedMotion } from "motion/react";
import { ShieldCheck, Sparkles } from "lucide-react";

const FIELDS = [
  { label: "Candidate name", value: "Aarav Sharma", from: "UIDAI", verified: true },
  { label: "Date of birth", value: "14 Mar 2007", from: "UIDAI", verified: true },
  { label: "Class 12 board", value: "CBSE", from: "CBSE", verified: true },
  { label: "Class 12 roll no.", value: "2523114", from: "CBSE", verified: true },
  { label: "Class 12 percentage", value: "91.4%", from: "CBSE", verified: true },
  { label: "Category", value: "OBC-NCL", from: "e-District", verified: true },
  { label: "Mobile", value: "+91 98765 43210", from: "OTP", verified: true },
  { label: "Exam city preference", value: "Lucknow", from: "you", verified: false },
];
const STAGGER = 260, START = 1100, HOLD = 3200;

export function AutofillDemo() {
  const reduce = useReducedMotion();
  const [n, setN] = useState(reduce ? FIELDS.length : 0);
  useEffect(() => {
    if (reduce) { setN(FIELDS.length); return; }
    let i = 0; let t: ReturnType<typeof setTimeout>;
    const step = () => { i++; setN(i); t = setTimeout(i < FIELDS.length ? step : () => { i = 0; setN(0); t = setTimeout(step, START); }, i < FIELDS.length ? STAGGER : HOLD); };
    t = setTimeout(step, START);
    return () => clearTimeout(t);
  }, [reduce]);
  const verified = FIELDS.slice(0, n).filter((f) => f.verified).length;
  return (
    <div className="relative" aria-label="Demo: an exam form filling itself from verified sources" role="img">
      <div className="absolute -inset-6 -z-10 rounded-[32px] bg-[radial-gradient(60%_60%_at_70%_20%,var(--color-brand-100),transparent_70%)]" />
      <div className="card overflow-hidden">
        <div className="flex items-center justify-between border-b border-line bg-surface-2 px-4 py-2.5 text-xs">
          <div className="flex items-center gap-2"><span className="size-2.5 rounded-pill bg-danger-500/70" /><span className="size-2.5 rounded-pill bg-pending-500/70" /><span className="size-2.5 rounded-pill bg-verified-500/70" /><span className="ml-2 font-mono text-ink-3">bta.demo/apply · BTA-JEE 2026</span></div>
          <span className="tabular text-ink-2">{n} of {FIELDS.length} filled · <span className="text-verified-700">{verified} verified</span></span>
        </div>
        <div className="h-1 bg-surface-2"><motion.div className="h-full bg-accent-500" initial={false} animate={{ width: `${(n / FIELDS.length) * 100}%` }} transition={reduce ? { duration: 0 } : { duration: 0.25, ease: "easeOut" }} /></div>
        <ul className="grid gap-2.5 p-4 sm:grid-cols-2">
          {FIELDS.map((f, i) => { const on = i < n; return (
            <motion.li key={f.label} className="rounded-md border border-line px-3 py-2" initial={false}
              animate={on && !reduce ? { backgroundColor: ["var(--color-accent-100)", "var(--color-surface)"], boxShadow: ["0 0 0 3px var(--color-accent-100)", "0 0 0 0px rgba(0,0,0,0)"] } : { backgroundColor: "var(--color-surface)", boxShadow: "0 0 0 0px rgba(0,0,0,0)" }}
              transition={{ duration: 0.9, ease: "easeOut" }}>
              <div className="text-[11px] font-medium uppercase tracking-[0.04em] text-ink-3">{f.label}</div>
              <div className="flex min-h-6 items-center justify-between gap-2">
                <span className={`truncate text-[15px] font-medium ${on ? "text-ink" : "text-ink-3"}`}>{on ? f.value : <span className="inline-block h-3 w-24 rounded bg-surface-2" />}</span>
                <AnimatePresence>{on && <motion.span key="chip" initial={reduce ? false : { opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className={`inline-flex shrink-0 items-center gap-1 rounded-pill px-1.5 py-0.5 text-[10px] font-semibold ${f.verified ? "bg-verified-50 text-verified-700" : "bg-pending-50 text-pending-700"}`}>{f.verified ? <ShieldCheck className="size-3" /> : <Sparkles className="size-3" />}from {f.from}</motion.span>}</AnimatePresence>
              </div>
            </motion.li>); })}
        </ul>
        <div className="flex items-center justify-between border-t border-line px-4 py-3"><span className="text-xs text-ink-3">Consent #c_8f2a… · valid 24 h · revoke any time</span><span className={`cta px-4 py-1.5 text-sm transition-opacity ${n === FIELDS.length ? "opacity-100" : "opacity-40"}`}>Submit</span></div>
      </div>
    </div>
  );
}
