/** Pure date/scope logic for F5 (tested). No DB, no React. */
export const MAJORITY_AGE = 18;
export const CLAIM_GRACE_DAYS = 90;
export const HANDOVER_SCOPE = ["identity", "education"] as const;
export const PENDING = new Date(0); // relations.validUntil = epoch marks "invited, not yet accepted" (hidden by listProfiles)

/** Age in whole years at `now` for an ISO date (YYYY-MM-DD). */
export function ageAt(dob: string, now = new Date()) {
  const d = new Date(dob);
  let a = now.getFullYear() - d.getFullYear();
  const m = now.getMonth() - d.getMonth();
  if (m < 0 || (m === 0 && now.getDate() < d.getDate())) a--;
  return a;
}
export const isMinor = (dob: string, now = new Date()) => ageAt(dob, now) < MAJORITY_AGE;
export const validDob = (dob: string, now = new Date()) => /^\d{4}-\d{2}-\d{2}$/.test(dob) && !Number.isNaN(new Date(dob).getTime()) && new Date(dob) <= now;

/** Handover banner: we only store dobYear, so "turned 18" = calendar year of 18th birthday reached. */
export const isHandoverDue = (dobYear: number | null | undefined, basis: string, now = new Date()) =>
  basis === "minor" && dobYear != null && now.getFullYear() - dobYear >= MAJORITY_AGE;

/** After the ward claims: guardian keeps read access to identity+education for 90 days, then it ends. */
export const claimTransition = (now = new Date()) => ({
  basis: "elder_consent" as const,
  scope: [...HANDOVER_SCOPE] as string[],
  validUntil: new Date(now.getTime() + CLAIM_GRACE_DAYS * 864e5),
});
export const isPending = (validUntil: Date | string | null | undefined) => validUntil != null && new Date(validUntil).getTime() === 0;
export const normPhone = (p: string) => { const d = p.replace(/\D/g, ""); return d.length === 12 && d.startsWith("91") ? d.slice(2) : d; };
export const validPhone = (p: string) => /^[6-9]\d{9}$/.test(normPhone(p));
