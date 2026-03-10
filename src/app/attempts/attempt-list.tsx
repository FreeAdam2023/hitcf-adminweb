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
      setError(err instanceof Error ? err.message : "加载答题记录失败");
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
          placeholder="按用户邮箱筛选..."
          value={emailInput}
          onChange={(e) => setEmailInput(e.target.value)}
          className="max-w-sm"
        />
        <Select value={mode || "all"} onValueChange={(v) => { setMode(v === "all" ? "" : v); setPage(1); }}>
          <SelectTrigger className="w-40">
            <SelectValue placeholder="模式" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">全部模式</SelectItem>
            <SelectItem value="practice">练习</SelectItem>
            <SelectItem value="exam">考试</SelectItem>
            <SelectItem value="speed_drill">极速刷题</SelectItem>
          </SelectContent>
        </Select>
        <Select value={status || "all"} onValueChange={(v) => { setStatus(v === "all" ? "" : v); setPage(1); }}>
          <SelectTrigger className="w-40">
            <SelectValue placeholder="状态" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">全部状态</SelectItem>
            <SelectItem value="in_progress">进行中</SelectItem>
            <SelectItem value="completed">已完成</SelectItem>
            <SelectItem value="abandoned">已放弃</SelectItem>
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
        <EmptyState title="未找到答题记录" description="请尝试调整筛选条件" />
      ) : (
        <>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>用户邮箱</TableHead>
                <TableHead>题库</TableHead>
                <TableHead>模式</TableHead>
                <TableHead>状态</TableHead>
                <TableHead className="text-center">分数</TableHead>
                <TableHead>开始时间</TableHead>
                <TableHead className="text-right">操作</TableHead>
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
