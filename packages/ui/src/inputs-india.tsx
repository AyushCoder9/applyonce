"use client";
/** Indian-specific inputs: MobileInput (+91 fixed), PincodeInput (auto district/state), PanInput, IfscInput. Ponytail: native inputs inside HeroUI TextField. */
import { TextField, Label, Input, Description, FieldError } from "@heroui/react";
import type { Locale } from "./format";

export interface IndiaInputProps { label: string; value: string; onChange: (v: string) => void; error?: string | null; description?: string; autoFocus?: boolean; locale?: Locale; name?: string; isRequired?: boolean }

/** 3-digit PIN prefix → district/state. Enough for the demo; swap for the India Post dataset later. */
export const PIN_PREFIX: Record<string, { district: string; state: string }> = {
  "110": { district: "New Delhi", state: "Delhi" }, "226": { district: "Lucknow", state: "Uttar Pradesh" }, "208": { district: "Kanpur Nagar", state: "Uttar Pradesh" }, "201": { district: "Ghaziabad", state: "Uttar Pradesh" },
  "400": { district: "Mumbai", state: "Maharashtra" }, "411": { district: "Pune", state: "Maharashtra" }, "500": { district: "Hyderabad", state: "Telangana" }, "560": { district: "Bengaluru Urban", state: "Karnataka" },
  "600": { district: "Chennai", state: "Tamil Nadu" }, "700": { district: "Kolkata", state: "West Bengal" }, "380": { district: "Ahmedabad", state: "Gujarat" }, "302": { district: "Jaipur", state: "Rajasthan" },
  "800": { district: "Patna", state: "Bihar" }, "160": { district: "Chandigarh", state: "Chandigarh" }, "452": { district: "Indore", state: "Madhya Pradesh" }, "682": { district: "Ernakulam", state: "Kerala" },
  "751": { district: "Khordha", state: "Odisha" }, "781": { district: "Kamrup Metropolitan", state: "Assam" }, "141": { district: "Ludhiana", state: "Punjab" }, "248": { district: "Dehradun", state: "Uttarakhand" },
};
export const lookupPincode = (pin: string) => (pin.length >= 3 ? PIN_PREFIX[pin.slice(0, 3)] ?? null : null);

export function MobileInput({ label, value, onChange, error, description, autoFocus, locale = "en", name, isRequired }: IndiaInputProps) {
  const valid = /^[6-9]\d{9}$/.test(value);
  return (
    <TextField name={name} type="tel" inputMode="numeric" value={value} onChange={(v) => onChange(v.replace(/\D/g, "").slice(0, 10))} isInvalid={!!error || (value.length > 0 && !valid)} isRequired={isRequired} autoFocus={autoFocus}>
      <Label>{label}</Label>
      <div className="flex items-center gap-2"><span className="rounded-md border border-line bg-surface-2 px-3 py-2.5 text-ink-2">+91</span><Input placeholder="10-digit mobile" className="flex-1" /></div>
      {description && <Description>{description}</Description>}
      <FieldError>{error ?? (locale === "hi" ? "10 अंकों का भारतीय मोबाइल नंबर डालें" : "Enter a valid 10-digit Indian mobile number")}</FieldError>
    </TextField>
  );
}

export function PincodeInput({ label, value, onChange, error, description, autoFocus, locale = "en", name, isRequired, onLookup }: IndiaInputProps & { onLookup?: (r: { district: string; state: string } | null) => void }) {
  const hit = lookupPincode(value);
  const valid = /^[1-9]\d{5}$/.test(value);
  return (
    <TextField name={name} inputMode="numeric" value={value} onChange={(v) => { const p = v.replace(/\D/g, "").slice(0, 6); onChange(p); if (p.length === 6) onLookup?.(lookupPincode(p)); }} isInvalid={!!error || (value.length > 0 && !valid)} isRequired={isRequired} autoFocus={autoFocus}>
      <Label>{label}</Label>
      <Input placeholder="6-digit PIN" />
      <Description>{hit && valid ? `${hit.district}, ${hit.state}` : description ?? (locale === "hi" ? "ज़िला और राज्य अपने आप भर जाएंगे" : "District and state fill in automatically")}</Description>
      <FieldError>{error ?? (locale === "hi" ? "6 अंकों का पिन कोड" : "6-digit PIN code")}</FieldError>
    </TextField>
  );
}

export function PanInput({ label, value, onChange, error, description, autoFocus, locale = "en", name, isRequired }: IndiaInputProps) {
  const valid = /^[A-Z]{5}\d{4}[A-Z]$/.test(value);
  return (
    <TextField name={name} value={value} onChange={(v) => onChange(v.toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 10))} isInvalid={!!error || (value.length > 0 && !valid)} isRequired={isRequired} autoFocus={autoFocus}>
      <Label>{label}</Label>
      <Input placeholder="ABCDE1234F" className="font-mono uppercase tracking-[0.12em]" autoCapitalize="characters" spellCheck={false} />
      {description && <Description>{description}</Description>}
      <FieldError>{error ?? (locale === "hi" ? "प्रारूप ABCDE1234F" : "Format ABCDE1234F")}</FieldError>
    </TextField>
  );
}

export function IfscInput({ label, value, onChange, error, description, autoFocus, locale = "en", name, isRequired }: IndiaInputProps) {
  const valid = /^[A-Z]{4}0[A-Z0-9]{6}$/.test(value);
  return (
    <TextField name={name} value={value} onChange={(v) => onChange(v.toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 11))} isInvalid={!!error || (value.length > 0 && !valid)} isRequired={isRequired} autoFocus={autoFocus}>
      <Label>{label}</Label>
      <Input placeholder="SBIN0001234" className="font-mono uppercase tracking-[0.12em]" autoCapitalize="characters" spellCheck={false} />
      {description && <Description>{description}</Description>}
      <FieldError>{error ?? (locale === "hi" ? "प्रारूप SBIN0001234" : "Format SBIN0001234")}</FieldError>
    </TextField>
  );
}
