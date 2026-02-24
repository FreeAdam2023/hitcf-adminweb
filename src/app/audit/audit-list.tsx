"use client";

import { useState, useEffect, useCallback } from "react";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Table, TableHeader, TableRow, TableHead, TableBody, TableCell,
} from "@/components/ui/table";
import {
  Select, SelectTrigger, SelectValue, SelectContent, SelectItem,
} from "@/components/ui/select";
import { Pagination } from "@/components/shared/pagination";
import { LoadingSpinner } from "@/components/shared/loading-spinner";
import { EmptyState } from "@/components/shared/empty-state";
import { fetchAuditLogs } from "@/lib/api/admin";
import type { AuditLogItem, PaginatedResponse } from "@/lib/api/types";
import { ChevronDown, ChevronRight } from "lucide-react";

const TARGET_TYPES = ["all", "user", "test_set", "question", "subscription"];

function actionColor(action: string): string {
  if (action.startsWith("create")) return "text-green-600";
  if (action.startsWith("delete") || action.startsWith("cancel")) return "text-red-600";
  if (action.startsWith("update") || action.startsWith("extend") || action.startsWith("activate")) return "text-blue-600";
  if (action.startsWith("import")) return "text-purple-600";
  return "";
}

export function AuditList() {
  const [data, setData] = useState<PaginatedResponse<AuditLogItem> | null>(null);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [actionFilter, setActionFilter] = useState("");
  const [targetType, setTargetType] = useState("all");
  const [expandedId, setExpandedId] = useState<string | null>(null);

  // Debounced action filter
  const [actionInput, setActionInput] = useState("");
  useEffect(() => {
    const t = setTimeout(() => { setActionFilter(actionInput); setPage(1); }, 400);
    return () => clearTimeout(t);
  }, [actionInput]);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetchAuditLogs({
        action: actionFilter || undefined,
        target_type: targetType !== "all" ? targetType : undefined,
        page,
      });
      setData(res);
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : "Failed to load audit logs");
    } finally {
      setLoading(false);
    }
  }, [actionFilter, targetType, page]);

  useEffect(() => { load(); }, [load]);

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex gap-3">
        <Input
          placeholder="Filter by action..."
          className="max-w-xs"
          value={actionInput}
          onChange={(e) => setActionInput(e.target.value)}
        />
        <Select value={targetType} onValueChange={(v) => { setTargetType(v); setPage(1); }}>
          <SelectTrigger className="w-[160px]"><SelectValue /></SelectTrigger>
          <SelectContent>
            {TARGET_TYPES.map((t) => (
              <SelectItem key={t} value={t}>{t === "all" ? "All Types" : t}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {loading ? (
        <LoadingSpinner />
      ) : !data || data.items.length === 0 ? (
        <EmptyState title="No audit logs found" />
      ) : (
        <>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-8"></TableHead>
                <TableHead>Admin</TableHead>
                <TableHead>Action</TableHead>
                <TableHead>Target</TableHead>
                <TableHead>Time</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.items.map((log) => (
                <>
                  <TableRow
                    key={log.id}
                    className="cursor-pointer"
                    onClick={() => setExpandedId(expandedId === log.id ? null : log.id)}
                  >
                    <TableCell>
                      {Object.keys(log.details).length > 0 ? (
                        expandedId === log.id
                          ? <ChevronDown className="h-4 w-4" />
                          : <ChevronRight className="h-4 w-4" />
                      ) : null}
                    </TableCell>
                    <TableCell className="text-sm">{log.admin_email}</TableCell>
                    <TableCell>
                      <span className={`text-sm font-mono ${actionColor(log.action)}`}>
                        {log.action}
                      </span>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="mr-1">{log.target_type}</Badge>
                      <span className="text-xs text-muted-foreground font-mono">
                        {log.target_id.length > 20 ? log.target_id.slice(0, 20) + "..." : log.target_id}
                      </span>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {new Date(log.created_at).toLocaleString()}
                    </TableCell>
                  </TableRow>
                  {expandedId === log.id && Object.keys(log.details).length > 0 && (
                    <TableRow key={`${log.id}-details`}>
                      <TableCell colSpan={5}>
                        <pre className="text-xs bg-muted p-3 rounded overflow-x-auto">
                          {JSON.stringify(log.details, null, 2)}
                        </pre>
                      </TableCell>
                    </TableRow>
                  )}
                </>
              ))}
            </TableBody>
          </Table>
          <Pagination page={page} totalPages={data.total_pages} onPageChange={setPage} />
        </>
      )}
    </div>
  );
}
