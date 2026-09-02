import { z } from "zod";
import type { FieldDef } from "./types";
import { field, REGISTRY } from "./registry";

export const RE = {
  phone: /^[6-9]\d{9}$/,
  pincode: /^[1-9]\d{5}$/,
  pan: /^[A-Z]{5}\d{4}[A-Z]$/,
  ifsc: /^[A-Z]{4}0[A-Z0-9]{6}$/,
} as const;

/** zod schema for one field's value */
export function zodFor(d: FieldDef): z.ZodType {
  switch (d.type) {
    case "string": return z.string().trim().min(1).max(d.maxLen ?? 200);
    case "text": return z.string().trim().max(d.maxLen ?? 1000);
    case "date": return z.iso.date();
    case "enum": return z.enum(d.options as [string, ...string[]]);
    case "number": return z.number().min(d.min ?? -1e12).max(d.max ?? 1e12);
    case "int": return z.number().int().min(d.min ?? -1e9).max(d.max ?? 1e9);
    case "year": return z.number().int().min(1950).max(2100);
    case "percentage": return z.number().min(0).max(100);
    case "money": return z.number().nonnegative().max(1e11);
    case "phone": return z.string().regex(RE.phone, "10-digit Indian mobile");
    case "email": return z.email();
    case "bool": return z.boolean();
    case "file_ref": return z.uuid();
    case "string[]": return z.array(z.string().trim().min(1).max(80)).max(20);
    case "pincode": return z.string().regex(RE.pincode, "6-digit PIN");
    case "pan": return z.string().toUpperCase().regex(RE.pan, "Format ABCDE1234F");
    case "ifsc": return z.string().toUpperCase().regex(RE.ifsc, "Format SBIN0001234");
    case "json": return z.union([z.array(z.record(z.string(), z.unknown())), z.record(z.string(), z.unknown())]);
  }
}

export const validateFact = (key: string, value: unknown) => zodFor(field(key)).safeParse(value);

/** zod object for a set of keys (partial: missing keys allowed) — used by share flow + partner form validation */
export const zodForKeys = (keys: readonly string[]) =>
  z.object(Object.fromEntries(keys.map((k) => [k, zodFor(field(k)).optional()])));

/** JSON Schema for the whole registry (partner docs) */
export const registryJsonSchema = () =>
  z.toJSONSchema(z.object(Object.fromEntries(REGISTRY.filter((d) => !d.system).map((d) => [d.key, zodFor(d).optional()]))));

/** Coerce a raw string (from forms / OCR) into the typed value, or null if invalid */
export function coerce(key: string, raw: string): unknown {
  const d = field(key);
  const s = raw.trim();
  if (!s) return null;
  switch (d.type) {
    case "number": case "int": case "year": case "percentage": case "money": { const n = Number(s.replace(/[,₹\s]/g, "")); return Number.isFinite(n) ? n : null; }
    case "bool": return /^(true|yes|y|1|हाँ)$/i.test(s) ? true : /^(false|no|n|0|नहीं)$/i.test(s) ? false : null;
    case "string[]": return s.split(/[,;]/).map((x) => x.trim()).filter(Boolean);
    case "json": try { return JSON.parse(s); } catch { return null; }
    case "pan": case "ifsc": return s.toUpperCase();
    default: return s;
  }
}
