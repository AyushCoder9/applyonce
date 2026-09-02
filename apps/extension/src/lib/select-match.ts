/**
 * Match a fact value (raw registry value, e.g. "OBC-NCL") or its display label
 * (e.g. "OBC (Non-Creamy Layer)") against a `<select>`'s options, a radio group's
 * values, or a checkbox's on-value. Pure — no DOM — so `SelectOption[]` is built
 * by the caller from real `<option>`/`<input>` elements.
 *
 * Order (per docs/05 F3): exact value -> exact label -> fuzzy startsWith -> fuzzy contains.
 * Both `value` and `label` are tried at each stage since a portal's <option value>
 * sometimes IS its label, or vice-versa.
 */
export interface SelectOption { value: string; label: string }

const norm = (s: string) => s.trim().toLowerCase().replace(/\s+/g, " ");

/** Word-bounded substring test — plain `.includes()` false-positives on short codes (e.g. "ST" inside "nonexistent"). */
function containsWord(haystack: string, needle: string): boolean {
  if (!needle) return false;
  const esc = needle.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  return new RegExp(`(?:^|[^a-z0-9])${esc}(?:[^a-z0-9]|$)`).test(haystack);
}

export function matchOption(options: SelectOption[], want: { value?: string | null; label?: string | null }): string | null {
  const candidates = [want.value, want.label].filter((v): v is string => v != null).map(norm);
  if (!candidates.length || !options.length) return null;

  const passes: ((o: SelectOption, c: string) => boolean)[] = [
    (o, c) => norm(o.value) === c,
    (o, c) => norm(o.label) === c,
    (o, c) => norm(o.label).startsWith(c) || c.startsWith(norm(o.label)),
    (o, c) => norm(o.value).startsWith(c) || c.startsWith(norm(o.value)),
    (o, c) => containsWord(norm(o.label), c) || containsWord(c, norm(o.label)),
  ];
  for (const test of passes) {
    for (const c of candidates) {
      const hit = options.find((o) => test(o, c));
      if (hit) return hit.value;
    }
  }
  return null;
}

/** Boolean -> the option/radio-value/checkbox-state a "Yes"/"No" (or true/false) control expects. */
export function matchBoolOption(options: SelectOption[], value: boolean): string | null {
  return matchOption(options, value ? { value: "true", label: "yes" } : { value: "false", label: "no" });
}
