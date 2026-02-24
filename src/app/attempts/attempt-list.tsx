"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Pagination } from "@/components/shared/pagination";
import { LoadingSpinner } from "@/components/shared/loading-spinner";
import { EmptyState } from "@/components/shared/empty-state";
import { fetchAttempts } from "@/lib/api/admin";
import type { AdminAttemptItem, PaginatedResponse } from "@/lib/api/types";
import { AlertCircle, Eye, RotateCcw } from "lucide-react";

export function AttemptList() {
  const [data, setData] = useState<PaginatedResponse<AdminAttemptItem> | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [mode, setMode] = useState("");
  const [status, setStatus] = useState("");

  // Debounced email search
  const [emailInput, setEmailInput] = useState("");
  const [email, setEmail] = useState("");
  useEffect(() => {
    const t = setTimeout(() => {
      setEmail(emailInput);
      setPage(1);
    }, 400);
    return () => clearTimeout(t);
  }, [emailInput]);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetchAttempts({
        user_id: email || undefined,
        mode: mode || undefined,
        status: status || undefined,
        page,
      });
      setData(res);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load attempts");
    } finally {
      setLoading(false);
    }
  }, [email, mode, status, page]);

  useEffect(() => { load(); }, [load]);

  const formatDateTime = (d: string | null) => {
    if (!d) return "-";
    return new Date(d).toLocaleString("zh-CN", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const statusBadgeVariant = (s: string) => {
    switch (s) {
      case "completed": return "default" as const;
      case "in_progress": return "secondary" as const;
      case "abandoned": return "destructive" as const;
      default: return "outline" as const;
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <Input
          placeholder="Filter by user email..."
          value={emailInput}
          onChange={(e) => setEmailInput(e.target.value)}
          className="max-w-sm"
        />
        <Select value={mode || "all"} onValueChange={(v) => { setMode(v === "all" ? "" : v); setPage(1); }}>
          <SelectTrigger className="w-40">
            <SelectValue placeholder="Mode" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Modes</SelectItem>
            <SelectItem value="practice">Practice</SelectItem>
            <SelectItem value="exam">Exam</SelectItem>
            <SelectItem value="speed_drill">Speed Drill</SelectItem>
          </SelectContent>
        </Select>
        <Select value={status || "all"} onValueChange={(v) => { setStatus(v === "all" ? "" : v); setPage(1); }}>
          <SelectTrigger className="w-40">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
            <SelectItem value="in_progress">In Progress</SelectItem>
            <SelectItem value="completed">Completed</SelectItem>
            <SelectItem value="abandoned">Abandoned</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {loading ? (
        <div className="flex h-32 items-center justify-center"><LoadingSpinner /></div>
      ) : error ? (
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <AlertCircle className="h-10 w-10 text-destructive mb-3" />
          <p className="text-sm text-destructive mb-3">{error}</p>
          <Button variant="outline" size="sm" onClick={load}>
            <RotateCcw className="mr-1 h-3 w-3" /> Retry
          </Button>
        </div>
      ) : !data || data.items.length === 0 ? (
        <EmptyState title="No attempts found" description="Try adjusting your filters." />
      ) : (
        <>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>User Email</TableHead>
                <TableHead>Test Set</TableHead>
                <TableHead>Mode</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-center">Score</TableHead>
                <TableHead>Started At</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.items.map((a) => (
                <TableRow key={a.id}>
                  <TableCell className="font-medium">{a.user_email}</TableCell>
                  <TableCell className="max-w-[200px] truncate">{a.test_set_name}</TableCell>
                  <TableCell>
                    <Badge variant="secondary">{a.mode}</Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant={statusBadgeVariant(a.status)}>{a.status}</Badge>
                  </TableCell>
                  <TableCell className="text-center">
                    {a.score !== null ? `${a.score}/${a.total}` : "-"}
                  </TableCell>
                  <TableCell>{formatDateTime(a.started_at)}</TableCell>
                  <TableCell className="text-right">
                    <Button variant="ghost" size="sm" asChild>
                      <Link href={`/attempts/${a.id}`}>
                        <Eye className="mr-1 h-4 w-4" />
                        View
                      </Link>
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          <Pagination page={data.page} totalPages={data.total_pages} onPageChange={setPage} />
        </>
      )}
    </div>
  );
}
