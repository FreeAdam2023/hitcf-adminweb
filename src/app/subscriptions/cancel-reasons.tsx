"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from "@/components/ui/table";
import { Pagination } from "@/components/shared/pagination";
import { LoadingSpinner } from "@/components/shared/loading-spinner";
import { EmptyState } from "@/components/shared/empty-state";
import { get } from "@/lib/api/client";

interface CancelReason {
  id: string;
  user_email: string;
  user_id: string;
  plan: string;
  reason: string;
  feedback: string | null;
  created_at: string;
}

const REASON_LABELS: Record<string, string> = {
  too_expensive: "太贵",
  not_using: "没在用",
  found_alternative: "找到替代品",
  exam_passed: "考完了",
  not_useful: "没帮助",
  other: "其他",
};

export function CancelReasons() {
  const [data, setData] = useState<{ items: CancelReason[]; total: number; total_pages: number } | null>(null);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await get<{ items: CancelReason[]; total: number; total_pages: number }>(
        `/api/admin/subscriptions/cancel-reasons?page=${page}&page_size=20`
      );
      setData(res);
    } catch {
      toast.error("加载失败");
    } finally {
      setLoading(false);
    }
  }, [page]);

  useEffect(() => { load(); }, [load]);

  if (loading) return <LoadingSpinner />;
  if (!data || data.items.length === 0) return <EmptyState title="暂无取消原因" />;

  return (
    <div className="space-y-4">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>用户</TableHead>
            <TableHead>套餐</TableHead>
            <TableHead>原因</TableHead>
            <TableHead>反馈</TableHead>
            <TableHead>时间</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {data.items.map((r) => (
            <TableRow key={r.id}>
              <TableCell>
                <Link href={`/users/${r.user_id}`} className="text-primary hover:underline font-mono text-sm">
                  {r.user_email}
                </Link>
              </TableCell>
              <TableCell>
                <Badge variant="secondary">{r.plan}</Badge>
              </TableCell>
              <TableCell>
                <Badge variant="outline">{REASON_LABELS[r.reason] || r.reason}</Badge>
              </TableCell>
              <TableCell className="max-w-[200px] truncate text-sm text-muted-foreground">
                {r.feedback || "-"}
              </TableCell>
              <TableCell className="text-sm text-muted-foreground whitespace-nowrap">
                {new Date(r.created_at).toLocaleString("zh-CN")}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
      <Pagination page={page} totalPages={data.total_pages} onPageChange={setPage} />
    </div>
  );
}
