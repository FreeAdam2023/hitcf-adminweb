"use client";

import { useCallback, useEffect, useState } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Pagination } from "@/components/shared/pagination";
import { LoadingSpinner } from "@/components/shared/loading-spinner";
import { EmptyState } from "@/components/shared/empty-state";
import { fetchAdminSavedWords } from "@/lib/api/admin";
import type { AdminSavedWordItem, PaginatedResponse } from "@/lib/api/types";
import { AlertCircle, RotateCcw } from "lucide-react";

export function SavedWordList() {
  const [data, setData] = useState<PaginatedResponse<AdminSavedWordItem> | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetchAdminSavedWords({ page, page_size: 20 });
      setData(res);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load saved words");
    } finally {
      setLoading(false);
    }
  }, [page]);

  useEffect(() => {
    load();
  }, [load]);

  if (loading) {
    return (
      <div className="flex h-32 items-center justify-center">
        <LoadingSpinner />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <AlertCircle className="mb-3 h-10 w-10 text-destructive" />
        <p className="text-sm text-destructive mb-3">{error}</p>
        <Button variant="outline" size="sm" onClick={load}>
          <RotateCcw className="mr-1 h-3 w-3" /> Retry
        </Button>
      </div>
    );
  }

  if (!data || data.items.length === 0) {
    return <EmptyState title="No saved words" description="Users haven't saved any words yet." />;
  }

  return (
    <div className="space-y-4">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Word</TableHead>
            <TableHead>User</TableHead>
            <TableHead>Source</TableHead>
            <TableHead>Test Set</TableHead>
            <TableHead>Saved At</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {data.items.map((sw) => (
            <TableRow key={sw.id}>
              <TableCell className="font-medium">{sw.word}</TableCell>
              <TableCell className="text-sm">{sw.user_email}</TableCell>
              <TableCell>
                {sw.source_type && (
                  <Badge variant="secondary">{sw.source_type}</Badge>
                )}
              </TableCell>
              <TableCell className="max-w-[200px] truncate text-sm text-muted-foreground">
                {sw.test_set_name || "-"}
              </TableCell>
              <TableCell className="text-sm text-muted-foreground">
                {new Date(sw.created_at).toLocaleDateString("zh-CN")}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
      <Pagination page={data.page} totalPages={data.total_pages} onPageChange={setPage} />
    </div>
  );
}
