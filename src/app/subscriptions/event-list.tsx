"use client";

import { useState, useEffect, useCallback } from "react";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import {
  Table, TableHeader, TableRow, TableHead, TableBody, TableCell,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Pagination } from "@/components/shared/pagination";
import { LoadingSpinner } from "@/components/shared/loading-spinner";
import { EmptyState } from "@/components/shared/empty-state";
import { fetchStripeEvents } from "@/lib/api/admin";
import type { StripeEventItem, PaginatedResponse } from "@/lib/api/types";

export function EventList() {
  const [data, setData] = useState<PaginatedResponse<StripeEventItem> | null>(null);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("");
  const [page, setPage] = useState(1);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetchStripeEvents({
        event_type: filter || undefined,
        page,
      });
      setData(res);
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : "Failed to load events");
    } finally {
      setLoading(false);
    }
  }, [filter, page]);

  useEffect(() => { load(); }, [load]);

  const [filterInput, setFilterInput] = useState("");
  useEffect(() => {
    const t = setTimeout(() => { setFilter(filterInput); setPage(1); }, 400);
    return () => clearTimeout(t);
  }, [filterInput]);

  return (
    <div className="space-y-4">
      <Input
        placeholder="Filter by event type (e.g. invoice.paid)..."
        className="max-w-sm"
        value={filterInput}
        onChange={(e) => setFilterInput(e.target.value)}
      />

      {loading ? (
        <LoadingSpinner />
      ) : !data || data.items.length === 0 ? (
        <EmptyState title="No events found" />
      ) : (
        <>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Event ID</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Processed At</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.items.map((ev) => (
                <TableRow key={ev.event_id}>
                  <TableCell className="font-mono text-xs">{ev.event_id}</TableCell>
                  <TableCell>
                    <Badge variant="outline">{ev.event_type}</Badge>
                  </TableCell>
                  <TableCell>{new Date(ev.processed_at).toLocaleString()}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          <Pagination page={page} totalPages={data.total_pages} onPageChange={setPage} />
        </>
      )}
    </div>
  );
}
