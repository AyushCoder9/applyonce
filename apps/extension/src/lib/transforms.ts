/**
 * Value transforms applied to a fact value before it's written into a field.
 * Pure string -> string functions so they're trivially unit-testable (no DOM).
 * Recipe JSON encodes these as a plain string, e.g. "upper", "dd/mm/yyyy", or
 * "map:{\"M\":\"Male\",\"F\":\"Female\"}" for an inline value->option map.
 */
export type TransformName = "upper" | "lower" | "dd/mm/yyyy" | "yyyy" | "first_word" | "last_word" | "digits";

const ISO_DATE = /^(\d{4})-(\d{2})-(\d{2})/;

function applyMap(raw: string, mapJson: string): string {
  try {
    const map = JSON.parse(mapJson) as Record<string, string>;
    return Object.prototype.hasOwnProperty.call(map, raw) ? map[raw]! : raw;
  } catch {
    return raw;
  }
}

/** `value` may be any fact value (string/number/boolean); stringified first. */
export function applyTransform(value: unknown, transform?: string | null): string {
  if (value == null) return "";
  const s = typeof value === "boolean" ? (value ? "true" : "false") : String(value);
  if (!transform) return s;

  if (transform.startsWith("map:")) return applyMap(s, transform.slice(4));

  switch (transform as TransformName) {
    case "upper": return s.toUpperCase();
    case "lower": return s.toLowerCase();
    case "dd/mm/yyyy": {
      const m = ISO_DATE.exec(s);
      return m ? `${m[3]}/${m[2]}/${m[1]}` : s;
    }
    case "yyyy": {
      const m = ISO_DATE.exec(s);
      return m ? m[1]! : s;
    }
    case "first_word": return s.trim().split(/\s+/)[0] ?? s;
    case "last_word": { const parts = s.trim().split(/\s+/); return parts[parts.length - 1] ?? s; }
    case "digits": return s.replace(/\D+/g, "");
    default: return s;
  }
}

/** Pick the i-th entry from an array-valued fact (e.g. `prefs.exam_city_choices`). */
export function pickArrayIndex(value: unknown, index?: number): unknown {
  if (index == null) return value;
  if (!Array.isArray(value)) return undefined;
  return value[index];
}

/** ISO `yyyy-mm-dd` -> `dd/mm/yyyy`, else passthrough (used to decide native `<input type=date>` vs text). */
export const isIsoDate = (s: string): boolean => ISO_DATE.test(s);
