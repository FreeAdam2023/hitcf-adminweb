"use client";

import { useState, useEffect, useCallback } from "react";
import { toast } from "sonner";
import Link from "next/link";
import {
  AlertTriangle,
  ShieldAlert,
  CheckCircle2,
  Eye,
  Headphones,
  FileText,
  Zap,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import {
  fetchAnomalies,
  fetchAnomalySummary,
  updateAnomaly,
} from "@/lib/api/admin";
import type { AnomalyAlertItem, AnomalySummary } from "@/lib/api/admin";

const TYPE_LABELS: Record<string, string> = {
  audio: "音频批量下载",
  question: "题目批量浏览",
  answer: "答题频率异常",
};

const TYPE_ICONS: Record<string, React.ElementType> = {
  audio: Headphones,
  question: FileText,
  answer: Zap,
};

const SEVERITY_COLORS: Record<string, string> = {
  warning: "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-400",
  critical: "bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-400",
};

const STATUS_COLORS: Record<
  string,
  "default" | "secondary" | "destructive" | "outline"
> = {
  open: "destructive",
  reviewed: "secondary",
  false_positive: "outline",
};

function formatTime(iso: string) {
  return new Date(iso).toLocaleString("zh-CN", {
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function AnomaliesPage() {
  const [items, setItems] = useState<AnomalyAlertItem[]>([]);
  const [summary, setSummary] = useState<AnomalySummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("open");
  const [typeFilter, setTypeFilter] = useState("all");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  // Review dialog
  const [reviewItem, setReviewItem] = useState<AnomalyAlertItem | null>(null);
  const [reviewStatus, setReviewStatus] = useState("reviewed");
  const [reviewNote, setReviewNote] = useState("");
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [res, sum] = await Promise.all([
        fetchAnomalies({
          status: statusFilter === "all" ? undefined : statusFilter,
          alert_type: typeFilter === "all" ? undefined : typeFilter,
          page,
          page_size: 20,
        }),
        fetchAnomalySummary(),
      ]);
      setItems(res.items);
      setTotalPages(res.total_pages);
      setSummary(sum);
    } catch {
      toast.error("加载异常告警失败");
    } finally {
      setLoading(false);
    }
  }, [statusFilter, typeFilter, page]);

  useEffect(() => {
    load();
  }, [load]);

  const handleReview = async () => {
    if (!reviewItem) return;
    setSaving(true);
    try {
      await updateAnomaly(reviewItem.id, {
        status: reviewStatus,
        admin_note: reviewNote || undefined,
      });
      toast.success("已更新");
      setReviewItem(null);
      setReviewNote("");
      load();
    } catch {
      toast.error("更新失败");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">异常流量检测</h1>
        <p className="text-muted-foreground">
          监控批量下载音频、快速浏览题目、异常答题频率等可疑行为
        </p>
      </div>

      {/* Summary cards */}
      {summary && (
        <div className="grid grid-cols-4 gap-4">
          <div className="rounded-lg border p-4 text-center">
            <div className="text-2xl font-bold text-red-600">
              {summary.total_open}
            </div>
            <div className="text-sm text-muted-foreground">待处理告警</div>
          </div>
          {["audio", "question", "answer"].map((type) => {
            const count =
              summary.by_type_severity
                .filter((r) => r.alert_type === type)
                .reduce((s, r) => s + r.count, 0) || 0;
            const Icon = TYPE_ICONS[type] || AlertTriangle;
            return (
              <div key={type} className="rounded-lg border p-4 text-center">
                <div className="flex items-center justify-center gap-2 mb-1">
                  <Icon className="h-4 w-4 text-muted-foreground" />
                  <span className="text-2xl font-bold">{count}</span>
                </div>
                <div className="text-sm text-muted-foreground">
                  {TYPE_LABELS[type] || type}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Filters */}
      <div className="flex items-center gap-3">
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-32">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">全部状态</SelectItem>
            <SelectItem value="open">待处理</SelectItem>
            <SelectItem value="reviewed">已审核</SelectItem>
            <SelectItem value="false_positive">误报</SelectItem>
          </SelectContent>
        </Select>
        <Select value={typeFilter} onValueChange={setTypeFilter}>
          <SelectTrigger className="w-40">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">全部类型</SelectItem>
            <SelectItem value="audio">音频批量下载</SelectItem>
            <SelectItem value="question">题目批量浏览</SelectItem>
            <SelectItem value="answer">答题频率异常</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Alert list */}
      {loading ? (
        <p className="text-sm text-muted-foreground">加载中...</p>
      ) : items.length === 0 ? (
        <div className="rounded-lg border p-8 text-center text-muted-foreground">
          <ShieldAlert className="h-8 w-8 mx-auto mb-2 text-green-500" />
          暂无异常告警
        </div>
      ) : (
        <div className="space-y-2">
          {items.map((item) => {
            const Icon = TYPE_ICONS[item.alert_type] || AlertTriangle;
            return (
              <div
                key={item.id}
                className="flex items-center justify-between rounded-lg border p-4"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div
                    className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${
                      item.severity === "critical"
                        ? "bg-red-100 text-red-600 dark:bg-red-950 dark:text-red-400"
                        : "bg-amber-100 text-amber-600 dark:bg-amber-950 dark:text-amber-400"
                    }`}
                  >
                    <Icon className="h-4 w-4" />
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <Link
                        href={`/users/${item.user_id}`}
                        className="text-sm font-medium hover:underline"
                      >
                        {item.user_email}
                      </Link>
                      <span
                        className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${SEVERITY_COLORS[item.severity] || ""}`}
                      >
                        {item.severity === "critical" ? "严重" : "警告"}
                      </span>
                      <Badge variant={STATUS_COLORS[item.status] || "default"}>
                        {item.status === "open"
                          ? "待处理"
                          : item.status === "reviewed"
                            ? "已审核"
                            : "误报"}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground mt-0.5">
                      {TYPE_LABELS[item.alert_type] || item.alert_type} —{" "}
                      {item.window_seconds}秒内 {item.count} 次请求
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {formatTime(item.created_at)}
                      {item.admin_note && (
                        <span className="ml-2">备注: {item.admin_note}</span>
                      )}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  {item.status === "open" && (
                    <>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setReviewItem(item);
                          setReviewStatus("reviewed");
                          setReviewNote("");
                        }}
                        title="审核"
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setReviewItem(item);
                          setReviewStatus("false_positive");
                          setReviewNote("");
                        }}
                        title="标记误报"
                      >
                        <CheckCircle2 className="h-4 w-4 text-green-600" />
                      </Button>
                    </>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2">
          <Button
            variant="outline"
            size="sm"
            disabled={page <= 1}
            onClick={() => setPage(page - 1)}
          >
            上一页
          </Button>
          <span className="text-sm text-muted-foreground">
            {page} / {totalPages}
          </span>
          <Button
            variant="outline"
            size="sm"
            disabled={page >= totalPages}
            onClick={() => setPage(page + 1)}
          >
            下一页
          </Button>
        </div>
      )}

      {/* Review Dialog */}
      <Dialog
        open={!!reviewItem}
        onOpenChange={() => setReviewItem(null)}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>
              {reviewStatus === "false_positive" ? "标记为误报" : "审核告警"}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div className="text-sm">
              <span className="text-muted-foreground">用户: </span>
              {reviewItem?.user_email}
            </div>
            <div className="text-sm">
              <span className="text-muted-foreground">类型: </span>
              {TYPE_LABELS[reviewItem?.alert_type ?? ""] ??
                reviewItem?.alert_type}
            </div>
            <div className="text-sm">
              <span className="text-muted-foreground">详情: </span>
              {reviewItem?.window_seconds}秒内 {reviewItem?.count} 次请求
            </div>
            <Textarea
              placeholder="备注 (可选)"
              value={reviewNote}
              onChange={(e) => setReviewNote(e.target.value)}
              rows={2}
            />
            <div className="flex justify-end gap-2">
              <Button
                variant="outline"
                onClick={() => setReviewItem(null)}
              >
                取消
              </Button>
              <Button onClick={handleReview} disabled={saving}>
                {saving ? "保存中..." : "确认"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
