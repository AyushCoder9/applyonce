"use client";
import { useEffect, useRef, useState } from "react";
import type { ChangeEvent, FormEvent } from "react";
import { FIELDS, FIELDS_BY_STEP, REVIEW_STEP, STEPS, TOTAL_STEPS, type FieldSpec } from "@/lib/fields";
import { validateFileMeta, validateValue } from "@/lib/validation";
import { FieldInput } from "@/components/FieldInput";
import { ProgressBar } from "@/components/ProgressBar";

function readField(form: HTMLFormElement, id: string): string | boolean {
  const el = form.elements.namedItem(id);
  if (el instanceof HTMLInputElement) {
    if (el.type === "checkbox") return el.checked;
    if (el.type === "file") return el.files?.[0]?.name ?? "";
    return el.value;
  }
  if (el instanceof HTMLSelectElement) return el.value;
  return "";
}

function readFile(form: HTMLFormElement, id: string): File | null {
  const el = form.elements.namedItem(id);
  return el instanceof HTMLInputElement && el.type === "file" ? (el.files?.[0] ?? null) : null;
}

function formatElapsed(sec: number): string {
  const m = Math.floor(sec / 60), s = sec % 60;
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

export function ManualWizard() {
  const formRef = useRef<HTMLFormElement>(null);
  const [step, setStep] = useState(1);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [elapsed, setElapsed] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [reviewData, setReviewData] = useState<Record<string, string> | null>(null);

  useEffect(() => {
    const t = setInterval(() => setElapsed((s) => s + 1), 1000);
    return () => clearInterval(t);
  }, []);

  function validateStep(n: number): boolean {
    const form = formRef.current;
    if (!form) return false;
    const fields = FIELDS_BY_STEP(n);
    const stepErrors: Record<string, string> = {};

    for (const f of fields) {
      if (f.kind === "file") {
        const file = readFile(form, f.id);
        const res = validateFileMeta(f, file ? { type: file.type, size: file.size } : null);
        stepErrors[f.id] = res.ok ? "" : (res.error ?? "Invalid file");
        continue;
      }
      const raw = readField(form, f.id);
      const res = validateValue(f, raw);
      stepErrors[f.id] = res.ok ? "" : (res.error ?? "Invalid value");
      if (res.ok && f.uppercase && typeof res.value === "string") {
        const input = form.elements.namedItem(f.id);
        if (input instanceof HTMLInputElement) input.value = res.value;
      }
    }

    setErrors((prev) => ({ ...prev, ...stepErrors }));
    return Object.values(stepErrors).every((e) => !e);
  }

  function buildReview() {
    const form = formRef.current;
    if (!form) return;
    const data: Record<string, string> = {};
    for (const f of FIELDS) {
      if (f.kind === "file") {
        data[f.id] = readFile(form, f.id)?.name ?? "(not selected)";
      } else if (f.kind === "checkbox") {
        data[f.id] = readField(form, f.id) ? "Yes" : "No";
      } else {
        data[f.id] = String(readField(form, f.id) || "—");
      }
    }
    setReviewData(data);
  }

  function goNext() {
    if (!validateStep(step)) return;
    if (step === TOTAL_STEPS) {
      buildReview();
      setStep(REVIEW_STEP);
    } else {
      setStep((s) => s + 1);
    }
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function goBack() {
    setStep((s) => Math.max(1, s - 1));
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function onFileChange(spec: FieldSpec) {
    return (e: ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0] ?? null;
      const res = validateFileMeta(spec, file ? { type: file.type, size: file.size } : null);
      setErrors((prev) => ({ ...prev, [spec.id]: res.ok ? "" : (res.error ?? "") }));
    };
  }

  function onSubmit(e: FormEvent<HTMLFormElement>) {
    if (step !== REVIEW_STEP) {
      e.preventDefault(); // Enter key on an earlier step must not submit
      goNext();
      return;
    }
    setSubmitting(true);
  }

  const stepLabel = step <= TOTAL_STEPS ? STEPS[step - 1]?.title ?? "" : "Review & Submit";

  return (
    <form ref={formRef} action="/api/manual/submit" method="POST" encType="multipart/form-data" noValidate onSubmit={onSubmit}>
      <ProgressBar current={Math.min(step, TOTAL_STEPS + 1)} total={TOTAL_STEPS + 1} label={stepLabel} />

      <div className="gov-card" style={{ padding: "8px 14px", marginBottom: 18, display: "flex", justifyContent: "space-between", flexWrap: "wrap", gap: 8, fontSize: 13, background: "#fff8e1", borderColor: "#e6c66b" }}>
        <span>
          Time elapsed: <strong className="tabular">{formatElapsed(elapsed)}</strong>
        </span>
        <span>Do not use the browser Back button — your entries on this page will be lost.</span>
      </div>

      {STEPS.map((s) => (
        <fieldset key={s.step} hidden={step !== s.step}>
          <legend style={{ fontSize: 16, fontWeight: 700, marginBottom: 2 }}>
            {s.step}. {s.title}
          </legend>
          <p style={{ marginTop: 0, marginBottom: 14, color: "var(--color-gov-ink-2)", fontSize: 13 }}>{s.blurb}</p>
          {FIELDS_BY_STEP(s.step).map((f) =>
            f.kind === "file" ? (
              <FieldInput key={f.id} spec={f} error={errors[f.id]} onFileChange={onFileChange(f)} />
            ) : (
              <FieldInput key={f.id} spec={f} error={errors[f.id]} />
            )
          )}
        </fieldset>
      ))}

      {step === REVIEW_STEP && reviewData && (
        <div>
          <h2 style={{ fontSize: 16 }}>Review your application</h2>
          <p style={{ color: "var(--color-gov-ink-2)", fontSize: 13 }}>Check every section carefully. Submission cannot be edited afterwards.</p>
          {STEPS.map((s) => (
            <div key={s.step} className="gov-card" style={{ padding: "10px 14px", marginBottom: 12 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
                <strong style={{ fontSize: 13 }}>{s.title}</strong>
                <button type="button" className="btn btn-secondary" style={{ padding: "3px 10px", fontSize: 12 }} onClick={() => setStep(s.step)}>
                  Edit
                </button>
              </div>
              <table style={{ width: "100%", fontSize: 13 }}>
                <tbody>
                  {FIELDS_BY_STEP(s.step).map((f) => (
                    <tr key={f.id}>
                      <td style={{ padding: "3px 8px 3px 0", color: "var(--color-gov-ink-2)", whiteSpace: "nowrap", verticalAlign: "top" }}>{f.label}</td>
                      <td style={{ padding: "3px 0", fontWeight: 600 }}>{reviewData[f.id]}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ))}
        </div>
      )}

      <div style={{ display: "flex", gap: 10, marginTop: 20 }}>
        {step > 1 && (
          <button type="button" className="btn btn-secondary" onClick={goBack}>
            &larr; Back
          </button>
        )}
        {step <= TOTAL_STEPS && (
          <button type="button" className="btn btn-primary" onClick={goNext}>
            {step === TOTAL_STEPS ? "Review Application" : "Save & Next"} &rarr;
          </button>
        )}
        {step === REVIEW_STEP && (
          <button type="submit" className="btn btn-success" disabled={submitting}>
            {submitting ? "Submitting…" : "Final Submit"}
          </button>
        )}
      </div>
    </form>
  );
}
