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
import { ChevronDown, ChevronRight, ImageIcon } from "lucide-react";

const CATEGORIES = ["all", "bug", "feature", "content", "other"];
const STATUSES = ["all", "pending", "resolved", "dismissed"];

function categoryBadge(cat: string) {
  const colors: Record<string, string> = {
    bug: "bg-red-100 text-red-700",
    feature: "bg-blue-100 text-blue-700",
    content: "bg-yellow-100 text-yellow-700",
    other: "bg-gray-100 text-gray-700",
  };
  const labels: Record<string, string> = {
    bug: "Bug",
    feature: "功能建议",
    content: "内容问题",
    other: "其他",
  };
  return <Badge className={colors[cat] || ""}>{labels[cat] || cat}</Badge>;
}

function statusBadge(status: string) {
  const colors: Record<string, string> = {
    pending: "bg-orange-100 text-orange-700",
    resolved: "bg-green-100 text-green-700",
    dismissed: "bg-gray-100 text-gray-500",
  };
  const labels: Record<string, string> = {
    pending: "待处理",
    resolved: "已解决",
    dismissed: "已驳回",
  };
  return <Badge className={colors[status] || ""}>{labels[status] || status}</Badge>;
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
      toast.success("反馈已更新");
      onUpdated();
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : "更新失败");
    } finally {
      setSaving(false);
    }
  };

  return (
    <TableRow>
      <TableCell colSpan={7}>
        <div className="space-y-3 p-2">
          <div>
            <p className="text-sm font-medium mb-1">完整内容:</p>
            <p className="text-sm whitespace-pre-wrap bg-muted p-3 rounded">
              {item.content}
            </p>
          </div>
          {item.page_url && (
            <p className="text-sm text-muted-foreground">
              页面: <span className="font-mono">{item.page_url}</span>
            </p>
          )}
          {item.screenshot && (
            <div>
              <p className="text-sm font-medium mb-1 flex items-center gap-1.5">
                <ImageIcon className="h-3.5 w-3.5" />
                截图:
              </p>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={item.screenshot}
                alt="用户截图"
                className="max-w-md max-h-80 rounded border border-border object-contain cursor-pointer"
                onClick={(e) => {
                  window.open(item.screenshot!, "_blank");
                  e.stopPropagation();
                }}
              />
            </div>
          )}
          <div className="flex items-end gap-3">
            <div className="space-y-1">
              <label className="text-sm font-medium">状态</label>
              <Select value={status} onValueChange={setStatus}>
                <SelectTrigger className="w-[140px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pending">待处理</SelectItem>
                  <SelectItem value="resolved">已解决</SelectItem>
                  <SelectItem value="dismissed">已驳回</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex-1 space-y-1">
              <label className="text-sm font-medium">管理员备注</label>
              <Textarea
                value={adminNote}
                onChange={(e) => setAdminNote(e.target.value)}
                placeholder="添加备注..."
                rows={2}
              />
            </div>
            <Button onClick={handleSave} disabled={saving} size="sm">
              {saving ? "保存中..." : "保存"}
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
      toast.error(e instanceof Error ? e.message : "加载反馈失败");
    } finally {
      setLoading(false);
    }
  }, [category, status, search, page]);

  useEffect(() => { load(); }, [load]);

  return (
    <div className="space-y-4">
      <div className="flex gap-3">
        <Input
          placeholder="搜索内容..."
          className="max-w-xs"
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)}
        />
        <Select value={category} onValueChange={(v) => { setCategory(v); setPage(1); }}>
          <SelectTrigger className="w-[140px]"><SelectValue /></SelectTrigger>
          <SelectContent>
            {CATEGORIES.map((c) => {
              const catLabels: Record<string, string> = { all: "全部分类", bug: "Bug", feature: "功能建议", content: "内容问题", other: "其他" };
              return <SelectItem key={c} value={c}>{catLabels[c] || c}</SelectItem>;
            })}
          </SelectContent>
        </Select>
        <Select value={status} onValueChange={(v) => { setStatus(v); setPage(1); }}>
          <SelectTrigger className="w-[140px]"><SelectValue /></SelectTrigger>
          <SelectContent>
            {STATUSES.map((s) => {
              const statusLabels: Record<string, string> = { all: "全部状态", pending: "待处理", resolved: "已解决", dismissed: "已驳回" };
              return <SelectItem key={s} value={s}>{statusLabels[s] || s}</SelectItem>;
            })}
          </SelectContent>
        </Select>
      </div>

      {loading ? (
        <LoadingSpinner />
      ) : !data || data.items.length === 0 ? (
        <EmptyState title="暂无反馈" />
      ) : (
        <>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-8"></TableHead>
                <TableHead>用户</TableHead>
                <TableHead>分类</TableHead>
                <TableHead>内容</TableHead>
                <TableHead>状态</TableHead>
                <TableHead>时间</TableHead>
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
                      <span className="flex items-center gap-1.5">
                        {item.screenshot && <ImageIcon className="h-3.5 w-3.5 text-blue-500 flex-shrink-0" />}
                        {item.content.length > 80
                          ? item.content.slice(0, 80) + "..."
                          : item.content}
                      </span>
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
