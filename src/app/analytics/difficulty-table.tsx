"use client";

import { useState, useEffect, useCallback } from "react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { TypeBadge } from "@/components/shared/type-badge";
import {
  Table, TableHeader, TableRow, TableHead, TableBody, TableCell,
} from "@/components/ui/table";
import { Pagination } from "@/components/shared/pagination";
import { LoadingSpinner } from "@/components/shared/loading-spinner";
import { EmptyState } from "@/components/shared/empty-state";
import { fetchDifficultyRanking } from "@/lib/api/admin";
import type { DifficultyItem, PaginatedResponse } from "@/lib/api/types";


function truncateText(text: string, maxLen = 60) {
  if (!text) return "-";
  return text.length > maxLen ? text.slice(0, maxLen) + "..." : text;
}

export function DifficultyTable() {
  const [data, setData] = useState<PaginatedResponse<DifficultyItem> | null>(null);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetchDifficultyRanking({ page, page_size: 20 });
      setData(res);
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : "Failed to load difficulty ranking");
    } finally {
      setLoading(false);
    }
  }, [page]);

  useEffect(() => { load(); }, [load]);

  if (loading) return <LoadingSpinner />;
  if (!data || data.items.length === 0) return <EmptyState title="No difficulty data" />;

  return (
    <div className="space-y-4">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="min-w-[200px]">Question</TableHead>
            <TableHead>Type</TableHead>
            <TableHead>Level</TableHead>
            <TableHead className="text-right">Total Answers</TableHead>
            <TableHead className="text-right">Wrong Count</TableHead>
            <TableHead className="text-right">Wrong Rate</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {data.items.map((item) => {
            const wrongPct = (item.wrong_rate * 100).toFixed(1);
            return (
              <TableRow key={item.question_id}>
                <TableCell className="font-medium" title={item.question_text}>
                  {item.question_number !== null && (
                    <span className="text-muted-foreground mr-1">Q{item.question_number}.</span>
                  )}
                  {truncateText(item.question_text)}
                </TableCell>
                <TableCell>
                  <TypeBadge type={item.type} />
                </TableCell>
                <TableCell>
                  {item.level ? <Badge variant="outline">{item.level}</Badge> : "-"}
                </TableCell>
                <TableCell className="text-right">{item.total_answers.toLocaleString()}</TableCell>
                <TableCell className="text-right">{item.wrong_count.toLocaleString()}</TableCell>
                <TableCell className="text-right">
                  <span className="font-medium text-red-600">{wrongPct}%</span>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
      <Pagination page={page} totalPages={data.total_pages} onPageChange={setPage} />
    </div>
  );
}
