import btaDemo from "./bta-demo.json";
import ntaJee from "./nta-jee.json";
import nsp from "./nsp.json";
import generic from "./generic.json";
import type { Recipe, RecipeField, DocLike, LabelRule } from "./types";

export type { Recipe, RecipeField, RecipeCapture, DocLike, LabelRule } from "./types";

/** Order matters: specific recipes first, `generic` last as the always-matching fallback. */
export const RECIPES: Recipe[] = [btaDemo, ntaJee, nsp, generic] as unknown as Recipe[];

/** `*` -> `.*`, everything else escaped, then anchored — good enough for host-permission-style globs. */
function globToRegExp(glob: string): RegExp {
  const escaped = glob.replace(/[.+^${}()|[\]\\]/g, "\\$&").replace(/\*/g, ".*");
  return new RegExp(`^${escaped}$`);
}

/** Recipe matcher: URL glob first, then an optional DOM fingerprint. `generic` (no fingerprint, `match: ["*"]`) always matches last. */
export function matchRecipe(url: string, doc: Pick<DocLike, "has">, recipes: readonly Recipe[] = RECIPES): Recipe | null {
  for (const recipe of recipes) {
    const urlOk = recipe.match.some((pattern) => globToRegExp(pattern).test(url));
    if (!urlOk) continue;
    if (recipe.fingerprint && !doc.has(recipe.fingerprint)) continue;
    return recipe;
  }
  return null;
}

/** Filters a recipe's static field map down to the fields that actually exist on this page. */
export function resolveFields(recipe: Recipe, doc: Pick<DocLike, "has">): RecipeField[] {
  return recipe.fields.filter((f) => doc.has(f.selector));
}

/** Generic recipe: match a field's visible label/placeholder text against the keyword table, in order; first hit wins. */
export function matchGenericLabel(text: string, table: readonly LabelRule[] = generic.labelMap as unknown as LabelRule[]): string | null {
  const s = text.trim();
  if (!s) return null;
  for (const rule of table) {
    if (new RegExp(rule.pattern, "i").test(s)) return rule.key;
  }
  return null;
}
