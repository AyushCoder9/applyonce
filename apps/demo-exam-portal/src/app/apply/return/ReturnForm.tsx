"use client";
import { useState } from "react";
import type { ApplyOncePayload } from "@applyonce/schema";
import { STEPS, FIELDS_BY_STEP } from "@/lib/fields";
import type { MappedPayload } from "@/lib/payload-map";
import { FieldInput } from "@/components/FieldInput";
import { SourceBadge } from "@/components/SourceBadge";
import { formatDMY } from "@/lib/validation";

export function ReturnForm({ payload, mapped, verified, offline, draftToken }: { draftToken: string; payload: ApplyOncePayload; mapped: MappedPayload; verified: boolean; offline: boolean }) {
  const [editing, setEditing] = useState(mapped.missingRequired.length > 0);
  const [edits, setEdits] = useState<Record<string,string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const rowById = new Map(mapped.rows.map((r) => [r.spec.id, r]));

  return (
    <form action="/api/return/submit" method="POST" onChange={(event) => { const input = event.target as unknown as HTMLInputElement; if(input.name && !input.name.startsWith("applyonce_")) setEdits(prev=>({...prev,[input.name]:input.type==="checkbox"?String(input.checked):input.value})); }} onSubmit={async (event) => {
      event.preventDefault(); setSubmitting(true); setError(null);
      try {
        const response = await fetch("/api/return/submit", {method: "POST", body: new FormData(event.currentTarget)});
        if (response.redirected) { window.location.assign(response.url); return; }
        const result = await response.json();
        setError(result.error?.fields ? Object.values(result.error.fields).join(" ") : result.error?.message ?? "Could not submit. Please retry.");
      } catch { setError("Connection interrupted. Your review is still here; please retry."); }
      setSubmitting(false);
    }}>
      <input type="hidden" name="draft_token" value={draftToken} />
      <input type="hidden" name="applyonce_application_id" value={payload.application_id} />
      <input type="hidden" name="applyonce_consent_id" value={payload.consent_id} />
      <input type="hidden" name="applyonce_form_id" value={payload.form_id} />
      <input type="hidden" name="applyonce_offline" value={offline ? "1" : "0"} />
      <input type="hidden" name="applyonce_documents" value={JSON.stringify(mapped.documents)} />

      <div className="gov-card" style={{ padding: "14px 18px", marginBottom: 18 }}>
        <div style={{ display: "flex", justifyContent: "space-between", flexWrap: "wrap", gap: 10, alignItems: "center" }}>
          <div>
            <strong style={{ fontSize: 14 }}>Application pre-filled by ApplyOnce</strong>
            <p style={{ margin: "4px 0 0", fontSize: 13, color: "var(--color-gov-ink-2)" }}>
              {payload.profile.display_name} &middot; {mapped.verifiedCount} of {mapped.totalCount} fields verified by an issuer &middot;{" "}
              {mapped.documents.length} document(s) attached
            </p>
          </div>
          <button type="button" className="btn btn-secondary" onClick={() => setEditing((v) => !v)}>
            {editing ? "Done editing" : "Edit before submitting"}
          </button>
        </div>
        {!verified && (
          <p style={{ margin: "10px 0 0", fontSize: 12, color: "var(--color-gov-self)", background: "var(--color-gov-self-bg)", padding: "6px 10px", borderRadius: 3 }}>
            DEMO_OFFLINE mode: this payload is a local fixture and was not cryptographically verified against ApplyOnce&apos;s JWKS. This explicitly enabled sandbox contains sample data.
          </p>
        )}
      </div>

      {mapped.documents.length > 0 && (
        <div className="gov-card" style={{ padding: "12px 18px", marginBottom: 18 }}>
          <strong style={{ fontSize: 13 }}>Attached documents</strong>
          <ul style={{ margin: "8px 0 0", paddingLeft: 18, fontSize: 13 }}>
            {mapped.documents.map((d) => (
              <li key={d.sha256}>
                {d.title} <span style={{ color: "var(--color-gov-ink-2)", fontFamily: "monospace", fontSize: 11 }}>sha256:{d.sha256.slice(0, 12)}…</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {STEPS.map((s) => (
        <div key={s.step} className="gov-card" style={{ padding: "12px 18px", marginBottom: 14 }}>
          <strong style={{ fontSize: 14, display: "block", marginBottom: 8 }}>
            {s.step}. {s.title}
          </strong>
          {FIELDS_BY_STEP(s.step).map((spec) => {
            const row = rowById.get(spec.id);
            if (!row) return null;
            if (editing && spec.kind !== "file") {
              const raw = edits[spec.id] ?? row.raw;
              const defaultValue = spec.isDate && raw ? (raw.includes("/") ? raw : formatDMY(raw)) : raw;
              return <FieldInput key={spec.id} spec={spec} defaultValue={defaultValue} />;
            }
            return (
              <div className="field" key={spec.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 12 }}>
                <div>
                  <label style={{ display: "block", fontWeight: 700, fontSize: 13 }}>{spec.label}</label>
                  <span style={{ fontSize: 14 }}>{(edits[spec.id] ?? row.display) || <em style={{ color: "var(--color-gov-error)" }}>Not provided</em>}</span>
                  {/* keep the value posting even in read-only mode */}
                  <input type="hidden" name={spec.id} value={edits[spec.id] ?? row.raw} />
                </div>
                <SourceBadge source={edits[spec.id] != null ? "self_declared" : row.badgeSource} verifiedBy={edits[spec.id] != null ? undefined : row.verifiedBy} />
              </div>
            );
          })}
        </div>
      ))}

      {mapped.missingRequired.length > 0 && (
        <div className="gov-card" style={{ padding: "10px 14px", marginBottom: 16, borderColor: "var(--color-gov-error)", background: "var(--color-gov-error-bg)", color: "var(--color-gov-error)", fontSize: 13 }}>
          {mapped.missingRequired.length} required field(s) are missing — click &quot;Edit before submitting&quot; to fill them in.
        </div>
      )}

      {error && <p role="alert" className="gov-card" style={{padding:12, color:"var(--color-gov-error)"}}>{error}</p>}
      <button type="submit" className="btn btn-success" disabled={submitting}>
        {submitting ? "Submitting…" : "Submit to BTA"}
      </button>
    </form>
  );
}
