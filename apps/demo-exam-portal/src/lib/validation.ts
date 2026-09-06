/**
 * Deliberately old-school government-portal validation: DD/MM/YYYY dates, strict
 * pincode/phone patterns (reused from @applyonce/schema so a value that passes here
 * would also pass ApplyOnce's own registry validation), uppercase names, and
 * size/format checks on file uploads. Same functions run client- and server-side.
 */
import { RE } from "@applyonce/schema";
import type { FieldSpec } from "./fields";

export interface ValidationResult {
  ok: boolean;
  error?: string;
  /** normalized value (e.g. DD/MM/YYYY -> ISO date) to store */
  value?: string | number | boolean;
}

const DMY_RE = /^(\d{2})\/(\d{2})\/(\d{4})$/;

/** "14/03/2007" -> "2007-03-14", rejecting impossible calendar dates (e.g. 31/02/2007) */
export function parseDMY(raw: string): string | null {
  const m = DMY_RE.exec(raw.trim());
  if (!m) return null;
  const [, dd, mm, yyyy] = m as unknown as [string, string, string, string];
  const day = Number(dd), month = Number(mm), year = Number(yyyy);
  if (month < 1 || month > 12) return null;
  const d = new Date(Date.UTC(year, month - 1, day));
  if (d.getUTCFullYear() !== year || d.getUTCMonth() !== month - 1 || d.getUTCDate() !== day) return null;
  if (year < 1900 || year > 2100) return null;
  return `${yyyy}-${mm}-${dd}`;
}

/** "2007-03-14" -> "14/03/2007", for read-only display of values that arrive as ISO */
export function formatDMY(iso: string): string {
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(iso);
  if (!m) return iso;
  const [, y, mo, d] = m as unknown as [string, string, string, string];
  return `${d}/${mo}/${y}`;
}

/** Accepts either an ISO date (already-verified ApplyOnce facts) or a DD/MM/YYYY string (freshly edited on /apply/return) -> ISO, or null if invalid. */
export function normalizeDateInput(raw: string): string | null {
  if (/^\d{4}-\d{2}-\d{2}$/.test(raw)) return parseDMY(formatDMY(raw));
  return parseDMY(raw);
}

export function validateValue(spec: FieldSpec, raw: string | boolean | undefined | null): ValidationResult {
  if (spec.kind === "checkbox") {
    // A checkbox always has a determinate value (checked or not) — "required" here means "must be
    // checked to proceed" (e.g. the declaration), NOT "false is an invalid answer" (e.g. PwD status,
    // where "No" is a perfectly complete answer for a required field).
    const checked = raw === true || raw === "on" || raw === "true" || raw === "Yes";
    if (spec.mustBeChecked && !checked) return { ok: false, error: "This must be checked to continue." };
    return { ok: true, value: checked };
  }

  const s = typeof raw === "string" ? raw.trim() : "";
  if (!s) {
    if (spec.required) return { ok: false, error: `${spec.label.replace(/\s*\(.*?\)/g, "")} is required.` };
    return { ok: true, value: "" };
  }

  if (spec.isDate) {
    const iso = normalizeDateInput(s);
    if (!iso) return { ok: false, error: "Enter a valid date as DD/MM/YYYY." };
    return { ok: true, value: iso };
  }

  if (spec.isPincode) {
    if (!RE.pincode.test(s)) return { ok: false, error: "Enter a valid 6-digit PIN code." };
    return { ok: true, value: s };
  }

  if (spec.isPhone) {
    if (!RE.phone.test(s)) return { ok: false, error: "Enter a valid 10-digit Indian mobile number (starts 6-9)." };
    return { ok: true, value: s };
  }

  if (spec.kind === "email") {
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s)) return { ok: false, error: "Enter a valid email address." };
    return { ok: true, value: s.toLowerCase() };
  }

  if (spec.kind === "number") {
    const n = Number(s.replace(/[,₹\s]/g, ""));
    if (!Number.isFinite(n)) return { ok: false, error: "Enter a valid number." };
    if (spec.isPercentage && (n < 0 || n > 100)) return { ok: false, error: "Percentage must be between 0 and 100." };
    if (spec.min !== undefined && n < spec.min) return { ok: false, error: `Must be at least ${spec.min}.` };
    if (spec.max !== undefined && n > spec.max) return { ok: false, error: `Must be at most ${spec.max}.` };
    return { ok: true, value: n };
  }

  if (spec.kind === "select") {
    if (spec.options && !spec.options.some((o) => o.value === s)) return { ok: false, error: "Select a value from the list." };
    return { ok: true, value: s };
  }

  // plain text
  const value = spec.uppercase ? s.toUpperCase() : s;
  if (spec.maxLength && value.length > spec.maxLength) return { ok: false, error: `Must be ${spec.maxLength} characters or fewer.` };
  if (spec.uppercase && /[a-z]/.test(s)) {
    // we auto-uppercase on blur client-side; server-side we just normalize rather than reject
  }
  return { ok: true, value };
}

export interface FileCheckResult {
  ok: boolean;
  error?: string;
}

/** Client- and server-side file size/format gate — the classic "gov portal rejects your photo" moment. */
export function validateFileMeta(spec: FieldSpec, file: { type: string; size: number } | null | undefined): FileCheckResult {
  if (!file || file.size === 0) {
    return spec.required ? { ok: false, error: "Please choose a file to upload." } : { ok: true };
  }
  if (spec.accept) {
    const accepted = spec.accept.split(",").map((s) => s.trim());
    if (!accepted.includes(file.type)) return { ok: false, error: `File must be one of: ${accepted.map((a) => a.split("/")[1]?.toUpperCase()).join(", ")}.` };
  }
  const sizeKB = file.size / 1024;
  if (spec.minFileKB && sizeKB < spec.minFileKB) return { ok: false, error: `File is too small — must be at least ${spec.minFileKB} KB.` };
  if (spec.maxFileKB && sizeKB > spec.maxFileKB) return { ok: false, error: `File is too large — must be under ${spec.maxFileKB} KB.` };
  return { ok: true };
}
