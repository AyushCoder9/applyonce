import { ManualWizard } from "./ManualWizard";

export const metadata = { title: "Manual Application — BTA-JEE 2026" };

export default async function ManualApplyPage({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  const { error } = await searchParams;
  return (
    <div>
      <h1 style={{ fontSize: 20, marginBottom: 4 }}>BTA-JEE 2026 — Online Application Form</h1>
      <p style={{ marginTop: 0, marginBottom: 18, color: "var(--color-gov-ink-2)", fontSize: 13 }}>
        Fields marked <span className="req">*</span> are mandatory. Keep your Aadhaar, Class 10 &amp; 12 marksheets, category
        certificate, photograph and signature ready before you begin.
      </p>
      {error && (
        <div className="gov-card" style={{ padding: "10px 14px", marginBottom: 16, borderColor: "var(--color-gov-error)", background: "var(--color-gov-error-bg)", color: "var(--color-gov-error)", fontSize: 13, fontWeight: 600 }}>
          {error}
        </div>
      )}
      <ManualWizard />
    </div>
  );
}
