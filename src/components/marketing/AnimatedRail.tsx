"use client";

import { motion, useReducedMotion } from "motion/react";
import { BadgeCheck, FileCheck2, GraduationCap, LockKeyhole, Sparkles } from "lucide-react";

const destinations = [
  { label: "College admission", detail: "12 fields ready", icon: GraduationCap, tone: "indigo" },
  { label: "Entrance exam", detail: "35 fields ready", icon: FileCheck2, tone: "mint" },
  { label: "Scholarship", detail: "9 fields ready", icon: BadgeCheck, tone: "sun" },
];

export default function AnimatedRail() {
  const reducedMotion = useReducedMotion();

  return (
    <div className="ao-rail-visual" aria-label="A verified profile connected to three applications">
      <div className="ao-rail-orbit ao-rail-orbit--one" />
      <div className="ao-rail-orbit ao-rail-orbit--two" />
      <motion.div
        className="ao-rail-profile"
        initial={reducedMotion ? false : { opacity: 0, y: 16, scale: 0.96 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
      >
        <div className="ao-rail-profile-mark"><Sparkles /></div>
        <div>
          <span className="ao-rail-label">Your profile</span>
          <strong>Verified once</strong>
          <small>Ready to reuse with consent</small>
        </div>
        <span className="ao-rail-lock"><LockKeyhole /></span>
      </motion.div>

      <svg className="ao-rail-lines" viewBox="0 0 620 390" fill="none" aria-hidden="true">
        <path className="ao-rail-line ao-rail-line--base" d="M264 188C345 188 340 65 435 65" />
        <path className="ao-rail-line ao-rail-line--base" d="M264 198C350 198 354 194 455 194" />
        <path className="ao-rail-line ao-rail-line--base" d="M264 208C345 208 340 325 435 325" />
        <motion.path className="ao-rail-line ao-rail-line--draw" d="M264 188C345 188 340 65 435 65" initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ duration: 0.9, delay: 0.25, ease: "easeOut" }} />
        <motion.path className="ao-rail-line ao-rail-line--draw ao-rail-line--delay" d="M264 198C350 198 354 194 455 194" initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ duration: 0.7, delay: 0.45, ease: "easeOut" }} />
        <motion.path className="ao-rail-line ao-rail-line--draw ao-rail-line--delay-two" d="M264 208C345 208 340 325 435 325" initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ duration: 0.9, delay: 0.62, ease: "easeOut" }} />
        <circle cx="264" cy="198" r="8" fill="#CFF7E9" stroke="#17212B" strokeWidth="4" />
        <circle cx="435" cy="65" r="7" fill="#4F46E5" />
        <circle cx="455" cy="194" r="7" fill="#087653" />
        <circle cx="435" cy="325" r="7" fill="#C68D12" />
      </svg>

      <div className="ao-rail-destinations">
        {destinations.map(({ label, detail, icon: Icon, tone }, index) => (
          <motion.div
            className={`ao-rail-destination ao-rail-destination--${tone}`}
            key={label}
            initial={reducedMotion ? false : { opacity: 0, x: 18 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.42, delay: 0.8 + index * 0.12, ease: [0.22, 1, 0.36, 1] }}
          >
            <span className="ao-rail-destination-icon"><Icon /></span>
            <span><strong>{label}</strong><small>{detail}</small></span>
            <BadgeCheck className="ao-rail-destination-check" />
          </motion.div>
        ))}
      </div>

      <div className="ao-rail-caption"><span className="ao-status-dot" /> Every field stays traceable to its source.</div>
    </div>
  );
}
