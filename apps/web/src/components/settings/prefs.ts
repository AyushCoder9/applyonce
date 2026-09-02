/** Notification preference matrix (tested merge). */
export const CHANNELS = ["inapp", "sms", "email", "whatsapp"] as const;
export const CATEGORIES = ["application", "verification", "expiry", "consent", "system"] as const;
export type Channel = (typeof CHANNELS)[number];
export type Category = (typeof CATEGORIES)[number];
export type PrefRow = { channel: string; category: string; enabled: boolean };
export type PrefMatrix = Record<Channel, Record<Category, boolean>>;

/** Defaults: in-app + SMS on for everything, email/whatsapp off except consent (security-relevant). */
export function defaultPrefs(): PrefMatrix {
  const m = {} as PrefMatrix;
  for (const ch of CHANNELS) { m[ch] = {} as Record<Category, boolean>; for (const c of CATEGORIES) m[ch][c] = ch === "inapp" || ch === "sms" || c === "consent"; }
  return m;
}
/** DB rows override defaults; unknown channels/categories are ignored. */
export function mergePrefs(rows: PrefRow[], base = defaultPrefs()): PrefMatrix {
  const m = structuredClone(base);
  for (const r of rows) if ((CHANNELS as readonly string[]).includes(r.channel) && (CATEGORIES as readonly string[]).includes(r.category)) m[r.channel as Channel][r.category as Category] = r.enabled;
  return m;
}
export const toRows = (m: PrefMatrix): PrefRow[] => CHANNELS.flatMap((ch) => CATEGORIES.map((c) => ({ channel: ch, category: c, enabled: m[ch][c] })));
