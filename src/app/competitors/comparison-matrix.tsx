"use client";

import { useState, useEffect } from "react";
import { toast } from "sonner";
import { fetchComparisonMatrix } from "@/lib/api/admin";
import type { ComparisonColumn, ComparisonCell } from "@/lib/api/types";

function ScoreBar({ score }: { score: number }) {
  const pct = (score / 5) * 100;
  const color =
    score >= 4 ? "bg-green-500" : score >= 3 ? "bg-yellow-500" : score >= 1 ? "bg-orange-500" : "bg-gray-200";
  return (
    <div className="flex items-center gap-1.5">
      <div className="h-1.5 w-16 rounded-full bg-muted overflow-hidden">
        <div className={`h-full rounded-full ${color}`} style={{ width: `${pct}%` }} />
      </div>
      <span className="text-xs text-muted-foreground">{score}</span>
    </div>
  );
}

export function ComparisonMatrix() {
  const [columns, setColumns] = useState<ComparisonColumn[]>([]);
  const [rows, setRows] = useState<Array<{ feature: string; [k: string]: unknown }>>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const data = await fetchComparisonMatrix();
        setColumns(data.columns);
        setRows(data.rows);
      } catch {
        toast.error("Failed to load comparison data");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  if (loading) return <p className="text-sm text-muted-foreground">Loading comparison...</p>;
  if (columns.length === 0) return (
    <div className="rounded-lg border p-8 text-center text-muted-foreground">
      No competitors added yet. Add some competitors first to see the comparison.
    </div>
  );

  return (
    <div className="rounded-lg border overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b bg-muted/50">
            <th className="px-4 py-3 text-left font-medium sticky left-0 bg-muted/50 z-10 min-w-[160px]">
              Feature
            </th>
            {columns.map((col) => (
              <th
                key={col.id}
                className={`px-4 py-3 text-left font-medium min-w-[180px] ${
                  col.is_self ? "bg-primary/5" : ""
                }`}
              >
                <div className="flex items-center gap-1">
                  {col.is_self && <span className="text-primary">*</span>}
                  {col.name}
                </div>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => (
            <tr key={row.feature as string} className={i % 2 === 0 ? "" : "bg-muted/20"}>
              <td className="px-4 py-2.5 font-medium sticky left-0 bg-inherit z-10">
                {row.feature as string}
              </td>
              {columns.map((col) => {
                const cell = row[col.id] as ComparisonCell | undefined;
                return (
                  <td
                    key={col.id}
                    className={`px-4 py-2.5 ${col.is_self ? "bg-primary/5" : ""}`}
                  >
                    {cell ? (
                      <div>
                        <div className="text-sm">{cell.value}</div>
                        <ScoreBar score={cell.score} />
                      </div>
                    ) : (
                      <span className="text-muted-foreground">-</span>
                    )}
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>

      {/* Summary row */}
      <div className="border-t bg-muted/30 px-4 py-3">
        <div className="flex items-center gap-6 text-sm">
          <span className="font-medium">Average Score:</span>
          {columns.map((col) => {
            const scores = rows
              .map((r) => (r[col.id] as ComparisonCell)?.score ?? 0)
              .filter((s) => s > 0);
            const avg = scores.length ? (scores.reduce((a, b) => a + b, 0) / scores.length).toFixed(1) : "N/A";
            return (
              <span key={col.id} className={`${col.is_self ? "font-semibold text-primary" : ""}`}>
                {col.name}: {avg}
              </span>
            );
          })}
        </div>
      </div>
    </div>
  );
}
