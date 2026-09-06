import { listWebhookEvents } from "@/lib/store";

export const metadata = { title: "Webhook log — BTA Admin" };
export const dynamic = "force-dynamic";

export default function WebhooksAdminPage() {
  const events = listWebhookEvents();

  return (
    <div>
      <h1 style={{ fontSize: 20, marginBottom: 4 }}>ApplyOnce webhook log</h1>
      <p style={{ marginTop: 0, marginBottom: 18, color: "var(--color-gov-ink-2)", fontSize: 13 }}>
        Last {events.length} event(s) received at <code>/api/applyonce/webhook</code>, newest first. HMAC-verified requests are marked{" "}
        <span className="badge badge-verified">verified</span>; rejected ones are kept for debugging.
      </p>

      {events.length === 0 && (
        <div className="gov-card" style={{ padding: 20, textAlign: "center", color: "var(--color-gov-ink-2)" }}>
          No webhook events received yet. Trigger one from ApplyOnce (e.g. revoke a consent) or POST to <code>/api/applyonce/webhook</code> directly.
        </div>
      )}

      {events.map((e) => (
        <div key={e.id} className="gov-card" style={{ padding: "12px 16px", marginBottom: 12 }}>
          <div style={{ display: "flex", justifyContent: "space-between", flexWrap: "wrap", gap: 8, marginBottom: 6 }}>
            <strong style={{ fontSize: 13 }}>{e.type}</strong>
            <span className={`badge ${e.verified ? "badge-verified" : "badge-entered"}`}>{e.verified ? "verified" : "rejected"}</span>
            <span style={{ fontSize: 12, color: "var(--color-gov-ink-2)" }}>{new Date(e.receivedAt).toLocaleString("en-IN")}</span>
          </div>
          {e.note && <p style={{ margin: "0 0 8px", fontSize: 12, color: "var(--color-gov-error)" }}>{e.note}</p>}
          <pre style={{ margin: 0, fontSize: 11, background: "#f2f4f6", padding: 10, borderRadius: 3, overflowX: "auto" }}>{JSON.stringify({id:e.id,type:e.type,receivedAt:e.receivedAt,verified:e.verified}, null, 2)}</pre>
        </div>
      ))}
    </div>
  );
}
