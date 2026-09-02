import type { Locale } from "@praman/ui";
export type { Locale };
/** user.locale → "en" | "hi" */
export const localeOf = (u: { locale?: string | null } | null | undefined): Locale => (u?.locale === "hi" ? "hi" : "en");
export const tr = (l: Locale, en: string, hi: string) => (l === "hi" ? hi : en);
export const SECTION_ICON: Record<string, string> = { "id-card": "IdCard", phone: "Phone", "map-pin": "MapPin", users: "Users", "badge-check": "BadgeCheck", "graduation-cap": "GraduationCap", briefcase: "Briefcase", "heart-pulse": "HeartPulse", landmark: "Landmark", "sliders-horizontal": "SlidersHorizontal" };
/** Small fetch wrapper for /api/v1 — throws {code,message,fields,status} on !ok. */
export async function api<T = unknown>(path: string, init: RequestInit & { json?: unknown } = {}): Promise<T> {
  const { json, ...rest } = init;
  const r = await fetch(`/api/v1${path}`, { ...rest, headers: { ...(json !== undefined ? { "content-type": "application/json" } : {}), ...(rest.headers ?? {}) }, body: json !== undefined ? JSON.stringify(json) : rest.body });
  const j = (await r.json().catch(() => ({}))) as { ok?: boolean; data?: T; error?: { code: string; message: string; fields?: Record<string, string>; mismatch?: unknown } };
  if (!r.ok || !j.ok) throw Object.assign(new Error(j.error?.message ?? `Request failed (${r.status})`), { status: r.status, code: j.error?.code ?? "ERROR", fields: j.error?.fields, mismatch: j.error?.mismatch });
  return j.data as T;
}
export type ApiErr = Error & { status: number; code: string; fields?: Record<string, string>; mismatch?: unknown };
