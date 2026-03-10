"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Pagination } from "@/components/shared/pagination";
import { LoadingSpinner } from "@/components/shared/loading-spinner";
import { EmptyState } from "@/components/shared/empty-state";
import { fetchWritingSubmissions } from "@/lib/api/admin";
import type { AdminWritingItem, PaginatedResponse } from "@/lib/api/types";
import { AlertCircle, RotateCcw, Eye } from "lucide-react";

function levelBadge(level: string | null) {
  if (!level) return <span className="text-muted-foreground">-</span>;
  const upper = level.toUpperCase();
  let variant: "default" | "secondary" | "outline" = "outline";
  if (upper.startsWith("C")) variant = "default";
  else if (upper.startsWith("B")) variant = "secondary";
  return <Badge variant={variant}>{level}</Badge>;
}

function formatDateTime(d: string | null) {
  if (!d) return "-";
  return new Date(d).toLocaleString("zh-CN", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function SubmissionList() {
  const [data, setData] = useState<PaginatedResponse<AdminWritingItem> | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetchWritingSubmissions({ page });
      setData(res);
    } catch (err) {
      setError(err instanceof Error ? err.message : "加载写作提交失败");
    } finally {
      setLoading(false);
    }
  }, [page]);

  useEffect(() => { load(); }, [load]);

  return (
    <div className="space-y-4">
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
        <EmptyState title="暂无写作提交" description="还没有写作提交记录" />
      ) : (
        <>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>用户邮箱</TableHead>
                <TableHead className="text-center">任务</TableHead>
                <TableHead className="text-center">字数</TableHead>
                <TableHead className="text-center">评分 (/20)</TableHead>
                <TableHead className="text-center">等级</TableHead>
                <TableHead>提交时间</TableHead>
                <TableHead className="text-right">操作</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.items.map((item) => (
                <TableRow key={item.id}>
                  <TableCell className="font-medium">{item.user_email}</TableCell>
                  <TableCell className="text-center">{item.task_number}</TableCell>
                  <TableCell className="text-center">{item.word_count}</TableCell>
                  <TableCell className="text-center">
                    {item.total_score !== null ? item.total_score : "-"}
                  </TableCell>
                  <TableCell className="text-center">{levelBadge(item.estimated_level)}</TableCell>
                  <TableCell>{formatDateTime(item.created_at)}</TableCell>
                  <TableCell className="text-right">
                    <Button variant="ghost" size="sm" asChild>
                      <Link href={`/writing/${item.id}`}>
                        <Eye className="mr-1 h-4 w-4" />
                        查看
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
