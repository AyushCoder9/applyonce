import { notFound } from "next/navigation";
import { getApplication } from "@/lib/store";
import { StatusTimeline } from "@/components/StatusTimeline";

export async function generateMetadata({ params }: { params: Promise<{ ref: string }> }) {
  const { ref } = await params;
  return { title: `Application ${ref} — BTA-JEE 2026` };
}

const STATUS_BADGE: Record<string, { bg: string; fg: string; label: string }> = {
  submitted: { bg: "var(--color-gov-self-bg)", fg: "var(--color-gov-self)", label: "Submitted" },
  under_review: { bg: "var(--color-gov-document-bg)", fg: "var(--color-gov-document)", label: "Under review" },
  shortlisted: { bg: "var(--color-gov-verified-bg)", fg: "var(--color-gov-verified)", label: "Admit card released" },
  accepted: { bg: "var(--color-gov-verified-bg)", fg: "var(--color-gov-verified)", label: "Accepted" },
  rejected: { bg: "var(--color-gov-error-bg)", fg: "var(--color-gov-error)", label: "Rejected" },
  withdrawn: { bg: "#eceef0", fg: "#4a4a4a", label: "Withdrawn" },
};

function AdminButton({ applicationRef, status, note, label, variant }: { applicationRef: string; status: string; note: string; label: string; variant: "primary" | "success" | "danger" }) {
  return (
    <form action="/api/admin/push-status" method="POST">
      <input type="hidden" name="ref" value={applicationRef} />
      <input type="hidden" name="status" value={status} />
      <input type="hidden" name="note" value={note} />
      <button type="submit" className={`btn btn-${variant}`}>
        {label}
      </button>
    </form>
  );
}

export default async function StatusPage({ params }: { params: Promise<{ ref: string }> }) {
  const { ref } = await params;
  const app = getApplication(ref);
  if (!app) notFound();

  const badge = STATUS_BADGE[app.status] ?? { bg: "#eceef0", fg: "#4a4a4a", label: app.status };

  return (
    <div>
      <div className="gov-card" style={{ padding: "16px 20px", marginBottom: 20 }}>
        <div style={{ display: "flex", justifyContent: "space-between", flexWrap: "wrap", gap: 10, alignItems: "flex-start" }}>
          <div>
            <p style={{ margin: 0, fontSize: 12, color: "var(--color-gov-ink-2)" }}>Application Number</p>
            <h1 data-testid="application-ref" style={{ margin: "2px 0 6px", fontSize: 22, fontFamily: "monospace", letterSpacing: 1 }}>{app.ref}</h1>
            <p style={{ margin: 0, fontSize: 13 }}>
              {app.applicantName} &middot; submitted {new Date(app.submittedAt).toLocaleDateString("en-IN")} &middot; source: {app.source === "praman" ? "Apply with Praman" : "Manual form"}
            </p>
          </div>
          <span className="badge" style={{ background: badge.bg, color: badge.fg, borderColor: badge.fg, fontSize: 13, padding: "5px 14px" }}>
            {badge.label}
          </span>
        </div>
        {app.consentRevoked && (
          <p style={{ marginTop: 12, marginBottom: 0, padding: "8px 12px", background: "var(--color-gov-error-bg)", color: "var(--color-gov-error)", borderRadius: 3, fontSize: 13, fontWeight: 600 }}>
            Consent revoked by the citizen on Praman. This application is on hold — no further data may be used.
          </p>
        )}
      </div>

      <div className="gov-card" style={{ padding: "16px 20px", marginBottom: 20 }}>
        <h2 style={{ fontSize: 15, margin: "0 0 12px" }}>Status timeline</h2>
        <StatusTimeline history={app.history} />
      </div>

      {app.documents.length > 0 && (
        <div className="gov-card" style={{ padding: "16px 20px", marginBottom: 20 }}>
          <h2 style={{ fontSize: 15, margin: "0 0 10px" }}>Attached documents</h2>
          <ul style={{ margin: 0, paddingLeft: 18, fontSize: 13 }}>
            {app.documents.map((d) => (
              <li key={d.sha256}>
                {d.title} <span style={{ color: "var(--color-gov-ink-2)", fontFamily: "monospace", fontSize: 11 }}>sha256:{d.sha256.slice(0, 12)}…</span>
                {d.sizeKb ? ` (${d.sizeKb} KB)` : ""}
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="gov-card" style={{ padding: "16px 20px", borderColor: "var(--color-gov-blue)" }}>
        <h2 style={{ fontSize: 15, margin: "0 0 4px" }}>Admin panel (demo only, no auth)</h2>
        <p style={{ marginTop: 0, marginBottom: 12, fontSize: 12, color: "var(--color-gov-ink-2)" }}>
          {app.pramanApplicationId
            ? "These buttons call Praman's partner status API (with an Idempotency-Key) so the citizen's tracker updates immediately."
            : "This application did not come through Praman, so status changes only affect this portal."}
        </p>
        <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
          <AdminButton applicationRef={app.ref} status="shortlisted" note="Admit card released — download from BTA portal" label="Push: Admit card released" variant="primary" />
          <AdminButton applicationRef={app.ref} status="accepted" note="Congratulations — you have been accepted." label="Push: Accepted" variant="success" />
          <AdminButton applicationRef={app.ref} status="rejected" note="We regret to inform you that your application was not successful." label="Push: Rejected" variant="danger" />
        </div>
      </div>
    </div>
  );
}
