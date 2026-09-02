import { cx } from "./format";
export function StatTile({ label, value, delta, tone = "default", className }: { label: string; value: React.ReactNode; delta?: string; tone?: "default" | "verified" | "pending" | "danger"; className?: string }) {
  const c = { default: "text-ink", verified: "text-verified-700", pending: "text-pending-700", danger: "text-danger-500" }[tone];
  return <div className={cx("card p-5", className)}><div className="text-sm text-ink-2">{label}</div><div className={cx("mt-1 font-display text-3xl font-bold tabular", c)}>{value}</div>{delta && <div className="mt-1 text-xs text-ink-3">{delta}</div>}</div>;
}
