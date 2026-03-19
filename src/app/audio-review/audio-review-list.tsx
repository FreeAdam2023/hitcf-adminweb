"use client";

import { useCallback, useEffect, useState } from "react";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Pagination } from "@/components/shared/pagination";
import { LoadingSpinner } from "@/components/shared/loading-spinner";
import { EmptyState } from "@/components/shared/empty-state";
import {
  fetchAudioReviewList,
  fetchAudioReviewTestSets,
  type AudioReviewListResponse,
  type AudioReviewTestSet,
} from "@/lib/api/admin";
import { AlertCircle, RotateCcw, Flag } from "lucide-react";
import { Button } from "@/components/ui/button";

const STATUS_STYLES: Record<string, { label: string; color: string }> = {
  reviewed: { label: "已审核", color: "bg-green-100 text-green-800" },
  partial: { label: "部分标记", color: "bg-blue-100 text-blue-800" },
  unlabeled: { label: "未标记", color: "bg-gray-100 text-gray-800" },
  no_timestamps: { label: "无时间戳", color: "bg-red-100 text-red-800" },
};

export function AudioReviewList() {
  const [data, setData] = useState<AudioReviewListResponse | null>(null);
  const [testSets, setTestSets] = useState<AudioReviewTestSet[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [tsFilter, setTsFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [page, setPage] = useState(1);

  useEffect(() => {
    fetchAudioReviewTestSets().then(setTestSets).catch(() => {});
  }, []);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetchAudioReviewList({
        test_set_code: tsFilter === "all" ? undefined : tsFilter,
        status: statusFilter === "all" ? undefined : statusFilter,
        page,
        page_size: 50,
      });
      setData(res);
    } catch (err) {
      setError(err instanceof Error ? err.message : "加载失败");
    } finally {
      setLoading(false);
    }
  }, [tsFilter, statusFilter, page]);

  useEffect(() => { load(); }, [load]);

  const progress = data?.progress;

  return (
    <div className="space-y-4">
      {/* Progress bar */}
      {progress && (
        <div className="rounded-lg border p-4">
          <div className="flex items-center justify-between text-sm">
            <span>音色标记进度</span>
            <span className="font-medium">{progress.labeled_segments} / {progress.total_segments} 句 ({progress.label_pct}%)</span>
          </div>
          <div className="mt-2 h-2 rounded-full bg-muted">
            <div
              className="h-full rounded-full bg-primary transition-all"
              style={{ width: `${progress.label_pct}%` }}
            />
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="flex items-center gap-3">
        <Select value={tsFilter} onValueChange={(v) => { setTsFilter(v); setPage(1); }}>
          <SelectTrigger className="w-48">
            <SelectValue placeholder="套题" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">全部套题</SelectItem>
            {testSets.map((ts) => (
              <SelectItem key={ts.code} value={ts.code}>{ts.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={statusFilter} onValueChange={(v) => { setStatusFilter(v); setPage(1); }}>
          <SelectTrigger className="w-36">
            <SelectValue placeholder="状态" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">全部状态</SelectItem>
            <SelectItem value="unlabeled">未标记</SelectItem>
            <SelectItem value="reviewed">已审核</SelectItem>
            <SelectItem value="needs_reprocess">需处理</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Table */}
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
        <EmptyState title="暂无数据" description="没有符合条件的听力题目" />
      ) : (
        <>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>套题</TableHead>
                <TableHead>题号</TableHead>
                <TableHead>等级</TableHead>
                <TableHead>句段</TableHead>
                <TableHead>已标记</TableHead>
                <TableHead>状态</TableHead>
                <TableHead>用户报告</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.items.map((q) => {
                const st = STATUS_STYLES[q.audio_review_status || ""] || { label: q.audio_review_status || "-", color: "" };
                return (
                  <TableRow key={q.id}>
                    <TableCell className="text-sm">{q.test_set_name}</TableCell>
                    <TableCell className="font-medium">Q{q.question_number}</TableCell>
                    <TableCell className="text-xs">{q.level || "-"}</TableCell>
                    <TableCell className="tabular-nums">{q.segment_count}</TableCell>
                    <TableCell className="tabular-nums">{q.labeled_count}/{q.segment_count}</TableCell>
                    <TableCell>
                      <Badge variant="secondary" className={st.color}>{st.label}</Badge>
                    </TableCell>
                    <TableCell>
                      {q.has_user_report && (
                        <Flag className="h-4 w-4 text-orange-500" />
                      )}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
          {data.total > 50 && (
            <Pagination
              page={data.page}
              totalPages={Math.ceil(data.total / data.page_size)}
              onPageChange={setPage}
            />
          )}
        </>
      )}
    </div>
  );
}
