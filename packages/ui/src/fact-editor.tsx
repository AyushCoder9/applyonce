"use client";
/**
 * FactEditor: renders the right control for a registry FieldDef. Value in/out is the *typed* fact value
 * (string | number | boolean | string[] | object | null); `coerceInput` turns raw UI text into that.
 */
import { TextField, Label, Input, Description, FieldError, TextArea, Select, ListBox, Switch, NumberField } from "@heroui/react";
import { ENUM_LABELS, documentTypeForKey, type FieldDef, type FactValue } from "@praman/schema";
import { MobileInput, PincodeInput, PanInput, IfscInput } from "./inputs-india";
import type { Locale } from "./format";

export interface FactEditorProps { def: FieldDef; value: FactValue | undefined; onChange: (v: FactValue) => void; locale?: Locale; error?: string | null; autoFocus?: boolean; documents?: { id: string; title: string; docType?: string }[]; onPincodeLookup?: (r: { district: string; state: string } | null) => void }

const NUMERIC = new Set(["number", "int", "year", "percentage", "money"]);
/** ENUM_LABELS group for a key, else null. */
export const enumGroup = (key: string) => (key.endsWith(".gender") ? "gender" : key === "category.social" ? "social" : key.endsWith(".board") ? "board" : null);
export const optionLabel = (def: FieldDef, opt: string, locale: Locale = "en") => { const g = enumGroup(def.key); return (g && ENUM_LABELS[g]?.[opt]?.[locale]) ?? opt.replace(/_/g, " ").replace(/^\w/, (c) => c.toUpperCase()); };

/** Raw UI value → typed fact value (null = empty/invalid). Unit-tested. */
export function coerceInput(def: FieldDef, raw: unknown): FactValue {
  if (raw == null) return null;
  if (typeof raw === "boolean") return def.type === "bool" ? raw : null;
  if (typeof raw === "number") return NUMERIC.has(def.type) ? (Number.isFinite(raw) ? raw : null) : String(raw);
  if (Array.isArray(raw)) return def.type === "string[]" ? raw.map((x) => String(x).trim()).filter(Boolean) : null;
  if (typeof raw === "object") return def.type === "json" ? (raw as Record<string, unknown>) : null;
  const s = String(raw).trim();
  if (!s) return null;
  switch (def.type) {
    case "number": case "int": case "year": case "percentage": case "money": { const n = Number(s.replace(/[,₹\s%]/g, "")); return Number.isFinite(n) ? (def.type === "int" || def.type === "year" ? Math.trunc(n) : n) : null; }
    case "bool": return /^(true|yes|y|1|हाँ)$/i.test(s) ? true : /^(false|no|n|0|नहीं)$/i.test(s) ? false : null;
    case "string[]": return s.split(/[,;]/).map((x) => x.trim()).filter(Boolean);
    case "json": try { return JSON.parse(s) as FactValue; } catch { return null; }
    case "pan": case "ifsc": return s.toUpperCase().replace(/[^A-Z0-9]/g, "");
    case "phone": case "pincode": return s.replace(/\D/g, "");
    case "email": return s.toLowerCase();
    default: return s;
  }
}
/** Typed value → text for a text control. */
export const rawFor = (def: FieldDef, v: FactValue | undefined): string => (v == null ? "" : def.type === "string[]" && Array.isArray(v) ? v.join(", ") : def.type === "json" ? JSON.stringify(v, null, 2) : String(v));

export function FactEditor({ def, value, onChange, locale = "en", error, autoFocus, documents = [], onPincodeLookup }: FactEditorProps) {
  const expectedType = documentTypeForKey(def.key);
  documents = documents.filter(d => !expectedType || !d.docType || d.docType === expectedType);
  const label = def.label[locale];
  const help = def.help?.[locale];
  const text = rawFor(def, value);
  const common = { label, error, autoFocus, locale, description: help } as const;
  switch (def.type) {
    case "phone": return <MobileInput {...common} value={text} onChange={(v) => onChange(coerceInput(def, v))} />;
    case "pincode": return <PincodeInput {...common} value={text} onChange={(v) => onChange(coerceInput(def, v))} onLookup={onPincodeLookup} />;
    case "pan": return <PanInput {...common} value={text} onChange={(v) => onChange(coerceInput(def, v))} />;
    case "ifsc": return <IfscInput {...common} value={text} onChange={(v) => onChange(coerceInput(def, v))} />;
    case "bool":
      return (
        <div className="grid gap-1">
          <Switch isSelected={value === true} onChange={(b) => onChange(b)} autoFocus={autoFocus}><Switch.Content><Switch.Control><Switch.Thumb /></Switch.Control>{label}</Switch.Content></Switch>
          {help && <p className="text-sm text-ink-3">{help}</p>}{error && <p className="text-sm text-danger-500">{error}</p>}
        </div>
      );
    case "enum":
      return (
        <Select selectedKey={value == null ? null : String(value)} onSelectionChange={(k) => onChange(k == null ? null : String(k))} isInvalid={!!error} placeholder={locale === "hi" ? "चुनें" : "Choose"} fullWidth autoFocus={autoFocus}>
          <Label>{label}</Label>
          <Select.Trigger><Select.Value /><Select.Indicator /></Select.Trigger>
          {help && <Description>{help}</Description>}
          <FieldError>{error}</FieldError>
          <Select.Popover><ListBox>{(def.options ?? []).map((o) => <ListBox.Item key={o} id={o} textValue={optionLabel(def, o, locale)}>{optionLabel(def, o, locale)}<ListBox.ItemIndicator /></ListBox.Item>)}</ListBox></Select.Popover>
        </Select>
      );
    case "file_ref":
      return documents.length ? (
        <Select selectedKey={value == null ? null : String(value)} onSelectionChange={(k) => onChange(k == null ? null : String(k))} isInvalid={!!error} placeholder={locale === "hi" ? "दस्तावेज़ चुनें" : "Pick a document"} fullWidth autoFocus={autoFocus}>
          <Label>{label}</Label>
          <Select.Trigger><Select.Value /><Select.Indicator /></Select.Trigger>
          <FieldError>{error}</FieldError>
          <Select.Popover><ListBox>{documents.map((d) => <ListBox.Item key={d.id} id={d.id} textValue={d.title}>{d.title}<ListBox.ItemIndicator /></ListBox.Item>)}</ListBox></Select.Popover>
        </Select>
      ) : <div className="rounded-md border border-dashed border-line p-3 text-sm text-ink-2"><div className="font-medium text-ink">{label}</div>{locale === "hi" ? "पहले दस्तावेज़ अपलोड करें, फिर यहाँ चुनें।" : "Upload the document first, then pick it here."}<a href="/app/documents?upload=1" target="_blank" rel="noreferrer" className="mt-2 block underline">Upload in a new tab, then refresh</a></div>;
    case "number": case "int": case "year": case "percentage": case "money": {
      const fmt: Intl.NumberFormatOptions = def.type === "money" ? { style: "currency", currency: "INR", maximumFractionDigits: 0 } : def.type === "year" ? { useGrouping: false } : def.type === "percentage" ? { maximumFractionDigits: 2 } : { maximumFractionDigits: 3 };
      return (
        <NumberField value={typeof value === "number" ? value : NaN} onChange={(n) => onChange(Number.isNaN(n) ? null : n)} minValue={def.min ?? (def.type === "year" ? 1950 : undefined)} maxValue={def.max ?? (def.type === "year" ? 2100 : def.type === "percentage" ? 100 : undefined)} step={def.type === "int" || def.type === "year" ? 1 : undefined} formatOptions={fmt} isInvalid={!!error} fullWidth autoFocus={autoFocus}>
          <Label>{label}</Label>
          <NumberField.Group><NumberField.DecrementButton /><NumberField.Input inputMode="decimal" /><NumberField.IncrementButton /></NumberField.Group>
          {help && <Description>{help}</Description>}
          <FieldError>{error}</FieldError>
        </NumberField>
      );
    }
    case "text": case "json": case "string[]":
      return (
        <TextField value={text} onChange={(v) => onChange(def.type === "text" ? (v.trim() ? v : null) : coerceInput(def, v))} isInvalid={!!error} fullWidth autoFocus={autoFocus}>
          <Label>{label}</Label>
          <TextArea rows={def.type === "string[]" ? 2 : 4} className={def.type === "json" ? "font-mono text-sm" : undefined} />
          <Description>{def.type === "string[]" ? (locale === "hi" ? "अल्पविराम से अलग करें" : "Separate with commas") : def.type === "json" ? (help ?? "JSON") : help}</Description>
          <FieldError>{error}</FieldError>
        </TextField>
      );
    case "date":
      return (
        <TextField type="date" value={text} onChange={(v) => onChange(v || null)} isInvalid={!!error} fullWidth autoFocus={autoFocus}>
          <Label>{label}</Label>
          <Input max="2100-12-31" min="1900-01-01" />
          {help && <Description>{help}</Description>}
          <FieldError>{error}</FieldError>
        </TextField>
      );
    default:
      return (
        <TextField type={def.type === "email" ? "email" : "text"} value={text} onChange={(v) => onChange(coerceInput(def, v))} isInvalid={!!error} fullWidth autoFocus={autoFocus} maxLength={def.maxLen}>
          <Label>{label}</Label>
          <Input />
          {help && <Description>{help}</Description>}
          <FieldError>{error}</FieldError>
        </TextField>
      );
  }
}
