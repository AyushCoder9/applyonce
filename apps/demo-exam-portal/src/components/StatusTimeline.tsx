import type { StatusEvent } from "@/lib/store";

const STATUS_LABELS: Record<string, string> = {
  submitted: "Submitted",
  under_review: "Under review",
  shortlisted: "Admit card released",
  accepted: "Accepted",
  rejected: "Rejected",
  withdrawn: "Withdrawn",
};

const ACTOR_LABELS: Record<StatusEvent["actor"], string> = {
  citizen: "You",
  bta: "Bharat Test Agency",
  applyonce: "ApplyOnce",
  system: "System",
};

export function StatusTimeline({ history }: { history: StatusEvent[] }) {
  return (
    <ol style={{ listStyle: "none", margin: 0, padding: 0 }}>
      {history.map((h, i) => (
        <li key={i} style={{ display: "flex", gap: 12, paddingBottom: 16, position: "relative" }}>
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
            <span style={{ width: 12, height: 12, borderRadius: "50%", background: "var(--color-gov-blue)", flexShrink: 0 }} />
            {i < history.length - 1 && <span style={{ width: 2, flex: 1, background: "var(--color-gov-border)" }} />}
          </div>
          <div>
            <strong style={{ fontSize: 13 }}>{STATUS_LABELS[h.status] ?? h.status}</strong>
            <span style={{ fontSize: 12, color: "var(--color-gov-ink-2)", marginLeft: 8 }}>
              {new Date(h.at).toLocaleString("en-IN")} &middot; {ACTOR_LABELS[h.actor]}
            </span>
            {h.note && <p style={{ margin: "3px 0 0", fontSize: 13 }}>{h.note}</p>}
          </div>
        </li>
      ))}
    </ol>
  );
}
