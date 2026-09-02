import { ProgressCircle } from "@heroui/react";
import { cx } from "./format";
/** Completion ring with plain-language count (never a bare %). */
export function ProgressRing({ value, max, label, size = "md", className }: { value: number; max: number; label?: string; size?: "sm" | "md" | "lg"; className?: string }) {
  const pct = max ? Math.round((value / max) * 100) : 0;
  const color = pct >= 100 ? "success" : pct >= 50 ? "accent" : "default";
  return (
    <div className={cx("flex items-center gap-3", className)}>
      <ProgressCircle value={pct} color={color} size={size} aria-label={label ?? `${value} of ${max}`} className={pct >= 100 ? "stamp" : undefined} />
      <div className="leading-tight"><div className="font-semibold tabular">{value} of {max}</div>{label && <div className="text-xs text-ink-3">{label}</div>}</div>
    </div>
  );
}
