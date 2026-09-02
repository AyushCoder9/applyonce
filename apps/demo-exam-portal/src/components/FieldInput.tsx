"use client";
import type { ChangeEvent, FocusEvent } from "react";
import type { FieldSpec } from "@/lib/fields";

/** One editable native input, switched on `spec.kind`. Used by the manual wizard and by the return page's "Edit" mode. */
export function FieldInput({ spec, error, defaultValue, onFileChange }: { spec: FieldSpec; error?: string; defaultValue?: string; onFileChange?: (e: ChangeEvent<HTMLInputElement>) => void }) {
  const invalid = Boolean(error);
  const describedBy = [spec.help ? `${spec.id}-help` : null, error ? `${spec.id}-error` : null].filter(Boolean).join(" ") || undefined;
  const commonProps = {
    id: spec.id,
    name: spec.id,
    "aria-invalid": invalid,
    "aria-describedby": describedBy,
    required: spec.required,
  } as const;

  function forceUppercase(e: FocusEvent<HTMLInputElement>) {
    if (spec.uppercase) e.target.value = e.target.value.toUpperCase();
  }

  return (
    <div className="field">
      <label htmlFor={spec.id}>
        {spec.label}
        {spec.required && <span className="req">*</span>}
      </label>

      {spec.kind === "select" && (
        <select className="gov-select" defaultValue={defaultValue ?? ""} {...commonProps}>
          <option value="">-- Select --</option>
          {spec.options?.map((o) => (
            <option key={o.value} value={o.value}>{o.label}</option>
          ))}
        </select>
      )}

      {spec.kind === "checkbox" && (
        <div className="gov-checkbox-row">
          <input type="checkbox" defaultChecked={defaultValue === "true" || defaultValue === "Yes"} {...commonProps} />
        </div>
      )}

      {spec.kind === "file" && <input type="file" className="gov-file-input" accept={spec.accept} onChange={onFileChange} {...commonProps} />}

      {spec.kind === "text" && spec.isDate && (
        <input type="text" className="gov-input" placeholder="DD/MM/YYYY" inputMode="numeric" maxLength={10} defaultValue={defaultValue} {...commonProps} />
      )}

      {spec.kind === "text" && !spec.isDate && (
        <input
          type="text"
          className="gov-input"
          maxLength={spec.maxLength}
          defaultValue={defaultValue}
          onBlur={forceUppercase}
          style={spec.uppercase ? { textTransform: "uppercase" } : undefined}
          {...commonProps}
        />
      )}

      {spec.kind === "email" && <input type="email" className="gov-input" defaultValue={defaultValue} {...commonProps} />}
      {spec.kind === "tel" && <input type="tel" className="gov-input" placeholder="9876543210" maxLength={10} defaultValue={defaultValue} {...commonProps} />}
      {spec.kind === "number" && (
        <input type="text" inputMode="decimal" className="gov-input" placeholder={spec.isPercentage ? "e.g. 91.2" : undefined} defaultValue={defaultValue} {...commonProps} />
      )}

      {spec.help && (
        <span className="help" id={`${spec.id}-help`}>
          {spec.help}
        </span>
      )}
      {error && (
        <span className="error" id={`${spec.id}-error`}>
          {error}
        </span>
      )}
    </div>
  );
}
