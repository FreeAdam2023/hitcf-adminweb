"use client";

import { useCallback, useEffect, useState } from "react";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Pagination } from "@/components/shared/pagination";
import { LoadingSpinner } from "@/components/shared/loading-spinner";
import { EmptyState } from "@/components/shared/empty-state";
import { fetchQuestionReports, resolveQuestionReport } from "@/lib/api/admin";
import type { QuestionReportItem, PaginatedResponse } from "@/lib/api/types";
import { AlertCircle, RotateCcw, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";

const ISSUE_LABELS: Record<string, { label: string; color: string }> = {
  wrong_answer: { label: "答案错误", color: "bg-red-100 text-red-800" },
  bad_audio: { label: "音频问题", color: "bg-orange-100 text-orange-800" },
  wrong_option: { label: "选项错误", color: "bg-amber-100 text-amber-800" },
  other: { label: "其他", color: "bg-gray-100 text-gray-800" },
};

const STATUS_LABELS: Record<string, { label: string; color: string }> = {
  pending: { label: "待处理", color: "bg-yellow-100 text-yellow-800" },
  resolved: { label: "已解决", color: "bg-green-100 text-green-800" },
};

export function ReportList() {
  const [data, setData] = useState<PaginatedResponse<QuestionReportItem> | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [page, setPage] = useState(1);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetchQuestionReports({
        status: statusFilter === "all" ? undefined : statusFilter,
        page,
      });
      setData(res);
    } catch (err) {
      setError(err instanceof Error ? err.message : "加载失败");
    } finally {
      setLoading(false);
    }
  }, [statusFilter, page]);

  useEffect(() => { load(); }, [load]);

  const handleResolve = async (id: string) => {
    try {
      await resolveQuestionReport(id);
      toast.success("已标记为已解决");
      load();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "操作失败");
    }
  };

  const formatDate = (d: string) => {
    return new Date(d).toLocaleString("zh-CN", {
      month: "short", day: "numeric", hour: "2-digit", minute: "2-digit",
    });
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <Select value={statusFilter} onValueChange={(v) => { setStatusFilter(v); setPage(1); }}>
          <SelectTrigger className="w-32">
            <SelectValue placeholder="状态" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">全部</SelectItem>
            <SelectItem value="pending">待处理</SelectItem>
            <SelectItem value="resolved">已解决</SelectItem>
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
            <RotateCcw className="mr-1 h-3 w-3" /> 重试
          </Button>
        </div>
      ) : !data || data.items.length === 0 ? (
        <EmptyState title="暂无举报" description="目前没有用户举报的题目问题" />
      ) : (
        <>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>问题类型</TableHead>
                <TableHead>题目</TableHead>
                <TableHead>用户</TableHead>
                <TableHead>描述</TableHead>
                <TableHead>状态</TableHead>
                <TableHead>时间</TableHead>
                <TableHead className="w-20">操作</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.items.map((r) => {
                const issue = ISSUE_LABELS[r.issue_type] || { label: r.issue_type, color: "" };
                const status = STATUS_LABELS[r.status] || { label: r.status, color: "" };
                return (
                  <TableRow key={r.id}>
                    <TableCell>
                      <Badge variant="secondary" className={issue.color}>{issue.label}</Badge>
                    </TableCell>
                    <TableCell>
                      <div className="max-w-[250px]">
                        <span className="text-xs font-medium">
                          {r.test_set_name || r.question_type}
                        </span>
                        <span className="text-xs text-muted-foreground"> · Q{r.question_number}</span>
                        {r.question_text && <p className="text-xs text-muted-foreground truncate mt-0.5">{r.question_text}</p>}
                      </div>
                    </TableCell>
                    <TableCell className="text-sm">{r.user_email}</TableCell>
                    <TableCell className="max-w-[200px]">
                      <p className="text-sm truncate">{r.description || "-"}</p>
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary" className={status.color}>{status.label}</Badge>
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground">{formatDate(r.created_at)}</TableCell>
                    <TableCell>
                      {r.status === "pending" && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleResolve(r.id)}
                          title="标记已解决"
                        >
                          <CheckCircle2 className="h-4 w-4 text-green-600" />
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
          <Pagination page={data.page} totalPages={data.total_pages} onPageChange={setPage} />
        </>
      )}
    </div>
  );
}
