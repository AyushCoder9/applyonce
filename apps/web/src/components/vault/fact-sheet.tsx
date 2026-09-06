"use client";
/** Add/edit one fact in a bottom sheet (mobile) / side drawer (desktop). Generated from the registry via FactEditor. */
import { useEffect, useState } from "react";
import { Button, Drawer, Alert, toast, useMediaQuery } from "@heroui/react";
import { Trash2 } from "lucide-react";
import { zodFor, field, isFactKey, type FieldDef, type FactValue, type Fact } from "@applyonce/schema";
import { FactEditor, SourceChip } from "@applyonce/ui";
import { api, tr, type ApiErr, type Locale } from "./i18n";

export interface FactSheetProps {
  open: boolean; onClose: () => void; def: FieldDef | null; initial?: FactValue | null; repeatIndex?: number; profileId: string; locale?: Locale;
  documents?: { id: string; title: string }[]; existing?: Fact | null; onSaved: (fact: Fact | undefined, status: string) => void; onDeleted?: () => void;
}
type Mismatch = { id: string; factKey: string; sourceA: string; valueA: string; sourceB: string; valueB: string };

export function FactSheet({ open, onClose, def, initial, repeatIndex = 0, profileId, locale = "en", documents, existing, onSaved, onDeleted }: FactSheetProps) {
  const desktop = useMediaQuery("(min-width: 640px)");
  const [value, setValue] = useState<FactValue | undefined>(initial ?? undefined);
  const [err, setErr] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [mismatch, setMismatch] = useState<Mismatch | null>(null);
  const [pin, setPin] = useState<{ district: string; state: string } | null>(null);
  useEffect(() => { if (open) { setValue(initial ?? undefined); setErr(null); setMismatch(null); setPin(null); } }, [open, initial, def?.key]);
  if (!def) return null;
  const put = (key: string, v: unknown, ri = repeatIndex) => api<{ status: string; fact?: Fact }>(`/profiles/${profileId}/facts/${encodeURIComponent(key)}`, { method: "PUT", json: { value: v, repeatIndex: ri } });

  const save = async () => {
    const parsed = zodFor(def).safeParse(value);
    if (!parsed.success) return setErr(parsed.error.issues[0]?.message ?? tr(locale, "Check this value", "यह मान जाँचें"));
    setBusy(true); setErr(null);
    try {
      const r = await put(def.key, parsed.data);
      if (def.type === "pincode" && pin) {
        const role = def.key.split(".")[1];
        for (const [k, v] of [[`address.${role}.district`, pin.district], [`address.${role}.state`, pin.state]] as const) if (isFactKey(k) && field(k).sources.includes("self_declared")) await put(k, v, 0).catch(() => null);
      }
      toast.success(tr(locale, "Saved", "सहेजा गया"), { description: `${def.label[locale]} · ${tr(locale, "self-declared until verified", "सत्यापन तक स्व-घोषित")}` });
      onSaved(r.fact, r.status); onClose();
    } catch (e) {
      const ae = e as ApiErr;
      if (ae.status === 409 && ae.mismatch) setMismatch(ae.mismatch as Mismatch);
      else setErr(ae.fields?.[def.key] ?? ae.message);
    } finally { setBusy(false); }
  };
  const del = async () => {
    setBusy(true);
    try { await api(`/profiles/${profileId}/facts/${encodeURIComponent(def.key)}?repeatIndex=${repeatIndex}`, { method: "DELETE" }); toast.info(tr(locale, "Removed", "हटाया गया")); onDeleted?.(); onClose(); }
    catch (e) { setErr((e as Error).message); }
    finally { setBusy(false); }
  };
  const editable = !existing || existing.source === "self_declared" || existing.source === "document_extracted";

  return (
    <Drawer isOpen={open} onOpenChange={(o) => { if (!o) onClose(); }}>
      <Drawer.Backdrop variant="blur">
        <Drawer.Content placement={desktop ? "right" : "bottom"} className={desktop ? "w-full max-w-md" : "max-h-[92dvh] rounded-t-xl"}>
          <Drawer.Dialog data-testid="fact-sheet">
            {!desktop && <Drawer.Handle />}
            <Drawer.Header>
              <div className="text-xs font-semibold uppercase tracking-[0.04em] text-ink-3">{existing ? tr(locale, "Edit", "संपादित करें") : tr(locale, "Add", "जोड़ें")}{def.repeat && repeatIndex > 0 ? ` · #${repeatIndex + 1}` : ""}</div>
              <Drawer.Heading className="font-display text-xl font-bold">{def.label[locale]}</Drawer.Heading>
              {existing && <div className="mt-1"><SourceChip source={existing.source} verifiedBy={existing.verifiedBy} expiresAt={existing.expiresAt} locale={locale} /></div>}
            </Drawer.Header>
            <Drawer.Body className="grid gap-4 py-2">
              {!editable && <Alert status="success"><Alert.Indicator /><Alert.Content><Alert.Title>{tr(locale, "Verified by the issuer", "जारीकर्ता द्वारा सत्यापित")}</Alert.Title><Alert.Description>{tr(locale, "Verified values can’t be edited by hand. Re-sync DigiLocker or upload a newer certificate to update it.", "सत्यापित मान हाथ से नहीं बदले जा सकते। DigiLocker फिर से सिंक करें या नया प्रमाण पत्र अपलोड करें।")}</Alert.Description></Alert.Content></Alert>}
              {mismatch && (
                <Alert status="warning"><Alert.Indicator /><Alert.Content>
                  <Alert.Title>{tr(locale, "Doesn’t match the verified value", "सत्यापित मान से मेल नहीं")}</Alert.Title>
                  <Alert.Description>{tr(locale, "Issuer", "जारीकर्ता")} ({mismatch.sourceA}): <b>{mismatch.valueA}</b> · {tr(locale, "You", "आप")}: <b>{mismatch.valueB}</b>. {tr(locale, "The verified value stays. Resolve this under Verify → Mismatches.", "सत्यापित मान बना रहेगा। सत्यापन → बेमेल में हल करें।")}</Alert.Description>
                  <div className="mt-2"><Button size="sm" variant="outline" onPress={() => { window.location.href = "/app/verify#mismatches"; }}>{tr(locale, "Open mismatches", "बेमेल देखें")}</Button></div>
                </Alert.Content></Alert>
              )}
              <FactEditor def={def} value={value} onChange={(v) => { setValue(v); setErr(null); }} locale={locale} error={err} autoFocus documents={documents} onPincodeLookup={setPin} />
              {def.sensitive && <p className="text-xs text-ink-3">{tr(locale, "Encrypted at rest. Shown masked; reveal needs your passkey or OTP.", "एन्क्रिप्टेड। छिपाकर दिखाया जाता है; देखने के लिए पासकी/OTP चाहिए।")}</p>}
            </Drawer.Body>
            <Drawer.Footer className="flex items-center gap-2">
              {existing && editable && <Button variant="danger-soft" onPress={del} isDisabled={busy} aria-label={tr(locale, "Remove", "हटाएँ")}><Trash2 className="size-4" /></Button>}
              <Button variant="ghost" onPress={onClose} className="ml-auto" isDisabled={busy}>{tr(locale, "Cancel", "रद्द करें")}</Button>
              {editable && <Button className="cta" onPress={save} isDisabled={busy || value == null || value === ""} isPending={busy} data-testid="fact-save">{tr(locale, "Save", "सहेजें")}</Button>}
            </Drawer.Footer>
          </Drawer.Dialog>
        </Drawer.Content>
      </Drawer.Backdrop>
    </Drawer>
  );
}
