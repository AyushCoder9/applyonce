/** A recipe field maps one DOM element to one Praman fact key. */
export interface RecipeField {
  /** CSS selector for the target input/select/textarea/radio-group/checkbox. */
  selector: string;
  /** `@praman/schema` fact key, e.g. "identity.full_name". */
  key: string;
  /** Optional value transform — see `lib/transforms.ts`. */
  transform?: string;
  /** For array-valued facts (e.g. `prefs.exam_city_choices`), which entry to use. */
  arrayIndex?: number;
}

export interface RecipeCapture {
  /** CSS selector for the element holding the confirmation/application number after submit. */
  selector: string;
  /** Regex (as a string) to extract the reference from that element's text. */
  regex: string;
}

/** One entry of the "generic" recipe's label-text heuristics table. */
export interface LabelRule {
  /** Regex source, matched case-insensitively against a field's visible label/placeholder text. */
  pattern: string;
  key: string;
}

export interface Recipe {
  id: string;
  name: string;
  /** "verified" recipes were tested against a real portal; "community" ones are best-effort. */
  status: "verified" | "community";
  /** URL glob patterns (`*` wildcard), e.g. "http://localhost:3301/apply/manual*". */
  match: string[];
  /** A selector that must exist on the page for this recipe to apply (DOM fingerprint). Omit for the generic fallback. */
  fingerprint?: string;
  fields: RecipeField[];
  capture?: RecipeCapture;
  /** Only present on the `generic` recipe — dynamic label-text -> fact-key heuristics, applied at fill time instead of `fields`. */
  labelMap?: LabelRule[];
}

/** Minimal DOM abstraction so matching logic is pure and testable without jsdom. */
export interface DocLike {
  url: string;
  has(selector: string): boolean;
}
