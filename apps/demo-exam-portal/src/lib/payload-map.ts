import type { ApplyOncePayload, SharedFact, Source } from "@applyonce/schema";
import { CUSTOM_FIELDS, FIELD_BY_REGISTRY_KEY, FIELDS, type FieldSpec } from "./fields";
import { formatDMY } from "./validation";

export interface FieldRow {
  spec: FieldSpec;
  /** display-ready string ("" if genuinely missing) */
  display: string;
  /** raw value, for pre-filling an editable input */
  raw: string;
  badgeSource: Source | "custom";
  verifiedBy?: string | null;
  documentTitle?: string;
}

function displayValue(spec: FieldSpec, fact: SharedFact): { display: string; raw: string; documentTitle?: string } {
  const v = fact.value;
  if (spec.kind === "file") {
    const title = fact.evidence?.title ?? String(v);
    return { display: title, raw: title, documentTitle: title };
  }
  if (spec.kind === "checkbox") {
    const b = v === true || v === "true";
    return { display: b ? "Yes" : "No", raw: String(b) };
  }
  if (spec.isDate && typeof v === "string") {
    return { display: formatDMY(v), raw: v };
  }
  if (spec.registryKey === "family.annual_income_total" && typeof v === "number") {
    return { display: `₹ ${v.toLocaleString("en-IN")}`, raw: String(v) };
  }
  return { display: v === null || v === undefined ? "" : String(v), raw: v === null || v === undefined ? "" : String(v) };
}

export interface MappedPayload {
  rows: FieldRow[];
  missingRequired: FieldSpec[];
  documents: { title: string; sha256: string }[];
  verifiedCount: number;
  totalCount: number;
}

/** Turns a verified ApplyOncePayload into rows keyed by our local FieldSpec, in form order. */
export function mapPayloadToRows(payload: ApplyOncePayload): MappedPayload {
  const factByKey = new Map(payload.facts.map((f) => [f.key, f]));
  const rows: FieldRow[] = [];
  const missingRequired: FieldSpec[] = [];
  const documents: { title: string; sha256: string }[] = [];
  let verifiedCount = 0;

  for (const spec of FIELDS) {
    if (spec.registryKey === null) {
      const raw = payload.custom[spec.id];
      const display = spec.kind === "checkbox" ? (raw ? "Yes" : "No") : raw === undefined || raw === null ? "" : String(raw);
      if (!display && spec.required) missingRequired.push(spec);
      rows.push({ spec, display, raw: display, badgeSource: "custom" });
      continue;
    }
    const fact = factByKey.get(spec.registryKey);
    if (!fact) {
      if (spec.required) missingRequired.push(spec);
      rows.push({ spec, display: "", raw: "", badgeSource: "self_declared" });
      continue;
    }
    const { display, raw, documentTitle } = displayValue(spec, fact);
    if (fact.source === "issuer_verified" || fact.source === "provider_verified") verifiedCount++;
    if (documentTitle && fact.evidence && !documents.some((d) => d.sha256 === fact.evidence!.sha256)) documents.push({ title: documentTitle, sha256: fact.evidence.sha256 });
    rows.push({ spec, display, raw, badgeSource: fact.source, verifiedBy: fact.verifiedBy });
  }

  return { rows, missingRequired, documents, verifiedCount, totalCount: FIELDS.filter((f) => f.registryKey).length };
}

export { CUSTOM_FIELDS, FIELD_BY_REGISTRY_KEY };
