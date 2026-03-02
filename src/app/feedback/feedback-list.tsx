"use client";

import { useState, useEffect, useCallback } from "react";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Table, TableHeader, TableRow, TableHead, TableBody, TableCell,
} from "@/components/ui/table";
import {
  Select, SelectTrigger, SelectValue, SelectContent, SelectItem,
} from "@/components/ui/select";
import { Pagination } from "@/components/shared/pagination";
import { LoadingSpinner } from "@/components/shared/loading-spinner";
import { EmptyState } from "@/components/shared/empty-state";
import { fetchFeedback, updateFeedback } from "@/lib/api/admin";
import type { FeedbackItem, PaginatedResponse } from "@/lib/api/types";
import { ChevronDown, ChevronRight } from "lucide-react";

const CATEGORIES = ["all", "bug", "feature", "content", "other"];
const STATUSES = ["all", "pending", "resolved", "dismissed"];

function categoryBadge(cat: string) {
  const colors: Record<string, string> = {
    bug: "bg-red-100 text-red-700",
    feature: "bg-blue-100 text-blue-700",
    content: "bg-yellow-100 text-yellow-700",
    other: "bg-gray-100 text-gray-700",
  };
  return <Badge className={colors[cat] || ""}>{cat}</Badge>;
}

function statusBadge(status: string) {
  const colors: Record<string, string> = {
    pending: "bg-orange-100 text-orange-700",
    resolved: "bg-green-100 text-green-700",
    dismissed: "bg-gray-100 text-gray-500",
  };
  return <Badge className={colors[status] || ""}>{status}</Badge>;
}

function ExpandedRow({
  item,
  onUpdated,
}: {
  item: FeedbackItem;
  onUpdated: () => void;
}) {
  const [status, setStatus] = useState(item.status);
  const [adminNote, setAdminNote] = useState(item.admin_note || "");
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    try {
      await updateFeedback(item.id, {
        status,
        admin_note: adminNote || undefined,
      });
      toast.success("Feedback updated");
      onUpdated();
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : "Update failed");
    } finally {
      setSaving(false);
    }
  };

  return (
    <TableRow>
      <TableCell colSpan={7}>
        <div className="space-y-3 p-2">
          <div>
            <p className="text-sm font-medium mb-1">Full content:</p>
            <p className="text-sm whitespace-pre-wrap bg-muted p-3 rounded">
              {item.content}
            </p>
          </div>
          {item.page_url && (
            <p className="text-sm text-muted-foreground">
              Page: <span className="font-mono">{item.page_url}</span>
            </p>
          )}
          <div className="flex items-end gap-3">
            <div className="space-y-1">
              <label className="text-sm font-medium">Status</label>
              <Select value={status} onValueChange={setStatus}>
                <SelectTrigger className="w-[140px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pending">pending</SelectItem>
                  <SelectItem value="resolved">resolved</SelectItem>
                  <SelectItem value="dismissed">dismissed</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex-1 space-y-1">
              <label className="text-sm font-medium">Admin note</label>
              <Textarea
                value={adminNote}
                onChange={(e) => setAdminNote(e.target.value)}
                placeholder="Add a note..."
                rows={2}
              />
            </div>
            <Button onClick={handleSave} disabled={saving} size="sm">
              {saving ? "Saving..." : "Save"}
            </Button>
          </div>
        </div>
      </TableCell>
    </TableRow>
  );
}

export function FeedbackList() {
  const [data, setData] = useState<PaginatedResponse<FeedbackItem> | null>(null);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [category, setCategory] = useState("all");
  const [status, setStatus] = useState("all");
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  useEffect(() => {
    const t = setTimeout(() => { setSearch(searchInput); setPage(1); }, 400);
    return () => clearTimeout(t);
  }, [searchInput]);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetchFeedback({
        category: category !== "all" ? category : undefined,
        status: status !== "all" ? status : undefined,
        search: search || undefined,
        page,
      });
      setData(res);
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : "Failed to load feedback");
    } finally {
      setLoading(false);
    }
  }, [category, status, search, page]);

  useEffect(() => { load(); }, [load]);

  return (
    <div className="space-y-4">
      <div className="flex gap-3">
        <Input
          placeholder="Search content..."
          className="max-w-xs"
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)}
        />
        <Select value={category} onValueChange={(v) => { setCategory(v); setPage(1); }}>
          <SelectTrigger className="w-[140px]"><SelectValue /></SelectTrigger>
          <SelectContent>
            {CATEGORIES.map((c) => (
              <SelectItem key={c} value={c}>{c === "all" ? "All Categories" : c}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={status} onValueChange={(v) => { setStatus(v); setPage(1); }}>
          <SelectTrigger className="w-[140px]"><SelectValue /></SelectTrigger>
          <SelectContent>
            {STATUSES.map((s) => (
              <SelectItem key={s} value={s}>{s === "all" ? "All Statuses" : s}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {loading ? (
        <LoadingSpinner />
      ) : !data || data.items.length === 0 ? (
        <EmptyState title="No feedback found" />
      ) : (
        <>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-8"></TableHead>
                <TableHead>User</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Content</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Time</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.items.map((item) => (
                <>
                  <TableRow
                    key={item.id}
                    className="cursor-pointer"
                    onClick={() => setExpandedId(expandedId === item.id ? null : item.id)}
                  >
                    <TableCell>
                      {expandedId === item.id
                        ? <ChevronDown className="h-4 w-4" />
                        : <ChevronRight className="h-4 w-4" />}
                    </TableCell>
                    <TableCell className="text-sm">{item.user_email}</TableCell>
                    <TableCell>{categoryBadge(item.category)}</TableCell>
                    <TableCell className="text-sm max-w-xs truncate">
                      {item.content.length > 80
                        ? item.content.slice(0, 80) + "..."
                        : item.content}
                    </TableCell>
                    <TableCell>{statusBadge(item.status)}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {new Date(item.created_at).toLocaleString()}
                    </TableCell>
                  </TableRow>
                  {expandedId === item.id && (
                    <ExpandedRow
                      key={`${item.id}-detail`}
                      item={item}
                      onUpdated={load}
                    />
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
