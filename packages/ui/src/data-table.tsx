"use client";
import { useMemo, useState } from "react";
import { ArrowDown, ArrowUp, ArrowUpDown, Download, Rows3 } from "lucide-react";
import { Button, Table } from "@heroui/react";
import { cx } from "./format";

export interface DataColumn<T> {
  id: string;
  header: string;
  /** cell renderer */
  cell: (row: T) => React.ReactNode;
  /** plain value for sort / filter / CSV (defaults to String(cell)) */
  value?: (row: T) => string | number | null | undefined;
  filter?: boolean;
  align?: "left" | "right";
  width?: string;
}

const plainValue = <T,>(column: DataColumn<T>, row: T) => {
  const value = column.value ? column.value(row) : column.cell(row);
  return value == null ? "" : typeof value === "object" ? "" : value;
};

/** Sticky header · per-column filter · sort · density toggle · CSV export. HeroUI Table underneath; no TanStack (not resolvable from this package). */
export function DataTable<T>({ rows, columns, rowId, onRowClick, csvName, empty, className, ariaLabel = "Table" }: { rows: T[]; columns: DataColumn<T>[]; rowId: (row: T) => string; onRowClick?: (row: T) => void; csvName?: string; empty?: React.ReactNode; className?: string; ariaLabel?: string }) {
  const [sort, setSort] = useState<{ id: string; dir: "asc" | "desc" } | null>(null);
  const [filters, setFilters] = useState<Record<string, string>>({});
  const [dense, setDense] = useState(false);
  const shown = useMemo(() => {
    let out = rows.filter((r) => columns.every((c) => { const f = filters[c.id]?.trim().toLowerCase(); return !f || String(plainValue(c, r)).toLowerCase().includes(f); }));
    if (sort) { const c = columns.find((x) => x.id === sort.id); if (c) out = [...out].sort((a, b) => { const x = plainValue(c, a), y = plainValue(c, b); const n = typeof x === "number" && typeof y === "number" ? x - y : String(x).localeCompare(String(y)); return sort.dir === "asc" ? n : -n; }); }
    return out;
  }, [rows, columns, filters, sort]);

  const csv = () => {
    const esc = (s: unknown) => `"${String(s ?? "").replace(/"/g, '""')}"`;
    const text = [columns.map((c) => esc(c.header)).join(","), ...shown.map((r) => columns.map((c) => esc(plainValue(c, r))).join(","))].join("\n");
    const a = document.createElement("a"); a.href = URL.createObjectURL(new Blob([text], { type: "text/csv" })); a.download = `${csvName ?? "export"}.csv`; a.click(); URL.revokeObjectURL(a.href);
  };
  const hasFilters = columns.some((c) => c.filter);

  return (
    <div className={cx("card overflow-hidden", className)} data-testid="data-table">
      <div className="flex flex-wrap items-center gap-2 border-b border-line px-3 py-2 text-sm text-ink-2">
        <span>{shown.length} of {rows.length}</span>
        <div className="ml-auto flex gap-1">
          <Button size="sm" variant="ghost" onPress={() => setDense((d) => !d)} aria-pressed={dense}><Rows3 className="size-4" />{dense ? "Comfortable" : "Compact"}</Button>
          <Button size="sm" variant="ghost" onPress={csv} isDisabled={!shown.length}><Download className="size-4" />CSV</Button>
        </div>
      </div>
      <Table>
        <Table.ScrollContainer className="max-h-[70vh]">
          <Table.Content aria-label={ariaLabel} className="min-w-[640px]">
            <Table.Header className="sticky top-0 z-10 bg-surface">
              {columns.map((c, i) => (
                <Table.Column key={c.id} isRowHeader={i === 0} style={c.width ? { width: c.width } : undefined} className={cx(c.align === "right" && "text-right")}>
                  <button type="button" className="inline-flex items-center gap-1 font-semibold" onClick={() => setSort((s) => (s?.id === c.id ? (s.dir === "asc" ? { id: c.id, dir: "desc" } : null) : { id: c.id, dir: "asc" }))} aria-label={`Sort by ${c.header}`}>
                    {c.header}{sort?.id === c.id ? (sort.dir === "asc" ? <ArrowUp className="size-3.5" /> : <ArrowDown className="size-3.5" />) : <ArrowUpDown className="size-3.5 text-ink-3" />}
                  </button>
                  {hasFilters && <div className="mt-1">{c.filter && <input aria-label={`Filter ${c.header}`} value={filters[c.id] ?? ""} onChange={(e) => setFilters((f) => ({ ...f, [c.id]: e.target.value }))} placeholder="Filter…" className="w-full rounded-sm border border-line bg-surface px-2 py-1 text-xs font-normal" />}</div>}
                </Table.Column>
              ))}
            </Table.Header>
            <Table.Body>
              {shown.map((r) => (
                <Table.Row key={rowId(r)} id={rowId(r)} onAction={onRowClick ? () => onRowClick(r) : undefined} className={cx(onRowClick && "cursor-pointer hover:bg-surface-2", dense ? "[&_td]:py-1" : "[&_td]:py-2.5")}>
                  {columns.map((c) => <Table.Cell key={c.id} className={cx(c.align === "right" && "text-right tabular")}>{c.cell(r)}</Table.Cell>)}
                </Table.Row>
              ))}
            </Table.Body>
          </Table.Content>
        </Table.ScrollContainer>
      </Table>
      {!shown.length && <div className="px-4 py-10 text-center text-ink-2">{empty ?? "Nothing matches."}</div>}
    </div>
  );
}
