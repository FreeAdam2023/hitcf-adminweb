"use client";

import { useState, useEffect, useCallback } from "react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import {
  Table, TableHeader, TableRow, TableHead, TableBody, TableCell,
} from "@/components/ui/table";
import { Pagination } from "@/components/shared/pagination";
import { LoadingSpinner } from "@/components/shared/loading-spinner";
import { EmptyState } from "@/components/shared/empty-state";
import { fetchTestPopularity } from "@/lib/api/admin";
import type { TestPopularityItem, PaginatedResponse } from "@/lib/api/types";

function typeVariant(type: string) {
  if (type === "listening") return "default";
  if (type === "reading") return "secondary";
  if (type === "speaking") return "outline";
  return "outline";
}

export function TestPopularityTable() {
  const [data, setData] = useState<PaginatedResponse<TestPopularityItem> | null>(null);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetchTestPopularity({ page, page_size: 20 });
      setData(res);
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : "Failed to load test popularity");
    } finally {
      setLoading(false);
    }
  }, [page]);

  useEffect(() => { load(); }, [load]);

  if (loading) return <LoadingSpinner />;
  if (!data || data.items.length === 0) return <EmptyState title="No popularity data" />;

  return (
    <div className="space-y-4">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Test Set Name</TableHead>
            <TableHead>Type</TableHead>
            <TableHead className="text-right">Attempts</TableHead>
            <TableHead className="text-right">Completed</TableHead>
            <TableHead className="text-right">Completion Rate</TableHead>
            <TableHead className="text-right">Avg Score</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {data.items.map((item) => (
            <TableRow key={item.test_set_id}>
              <TableCell className="font-medium">{item.test_set_name}</TableCell>
              <TableCell>
                <Badge variant={typeVariant(item.test_set_type)}>{item.test_set_type}</Badge>
              </TableCell>
              <TableCell className="text-right">{item.attempt_count.toLocaleString()}</TableCell>
              <TableCell className="text-right">{item.completed_count.toLocaleString()}</TableCell>
              <TableCell className="text-right">
                {(item.completion_rate * 100).toFixed(1)}%
              </TableCell>
              <TableCell className="text-right">
                {item.avg_score !== null ? `${item.avg_score.toFixed(1)}%` : "-"}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
      <Pagination page={page} totalPages={data.total_pages} onPageChange={setPage} />
    </div>
  );
}
