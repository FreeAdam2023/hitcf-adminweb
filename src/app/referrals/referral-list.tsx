"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { fetchReferrals, markReferralFraud } from "@/lib/api/admin";
import type { AdminReferralItem } from "@/lib/api/types";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Pagination } from "@/components/shared/pagination";
import { LoadingSpinner } from "@/components/shared/loading-spinner";
import { EmptyState } from "@/components/shared/empty-state";
import { toast } from "sonner";

export function ReferralList() {
  const [data, setData] = useState<AdminReferralItem[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("all");
  const [loading, setLoading] = useState(true);
  const searchTimeout = useRef<ReturnType<typeof setTimeout>>();

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetchReferrals({
        status: status === "all" ? undefined : status,
        search: search || undefined,
        page,
        page_size: 20,
      });
      setData(res.items);
      setTotal(res.total);
    } catch {
      toast.error("加载推荐数据失败");
    } finally {
      setLoading(false);
    }
  }, [status, search, page]);

  useEffect(() => { load(); }, [load]);

  const handleSearch = (value: string) => {
    clearTimeout(searchTimeout.current);
    searchTimeout.current = setTimeout(() => {
      setSearch(value);
      setPage(1);
    }, 400);
  };

  const handleMarkFraud = async (id: string) => {
    try {
      await markReferralFraud(id);
      toast.success("已标记为欺诈");
      load();
    } catch {
      toast.error("标记欺诈失败");
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex gap-3">
        <Input
          placeholder="按邮箱搜索..."
          className="max-w-xs"
          onChange={(e) => handleSearch(e.target.value)}
        />
        <Select value={status} onValueChange={(v) => { setStatus(v); setPage(1); }}>
          <SelectTrigger className="w-[150px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">全部状态</SelectItem>
            <SelectItem value="pending">待完成</SelectItem>
            <SelectItem value="completed">已完成</SelectItem>
            <SelectItem value="fraud">欺诈</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {loading ? (
        <LoadingSpinner />
      ) : data.length === 0 ? (
        <EmptyState title="未找到推荐记录" />
      ) : (
        <>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>推荐人</TableHead>
                <TableHead>被推荐人</TableHead>
                <TableHead>推荐码</TableHead>
                <TableHead>状态</TableHead>
                <TableHead>奖励</TableHead>
                <TableHead>标记</TableHead>
                <TableHead>日期</TableHead>
                <TableHead></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.map((r) => (
                <TableRow key={r.id}>
                  <TableCell>
                    <div className="text-sm">{r.referrer_email}</div>
                    {r.referrer_name && (
                      <div className="text-xs text-muted-foreground">{r.referrer_name}</div>
                    )}
                  </TableCell>
                  <TableCell>
                    <div className="text-sm">{r.referee_email}</div>
                    {r.referee_name && (
                      <div className="text-xs text-muted-foreground">{r.referee_name}</div>
                    )}
                  </TableCell>
                  <TableCell>
                    <code className="text-xs">{r.referral_code}</code>
                  </TableCell>
                  <TableCell>
                    <Badge variant={r.status === "completed" ? "default" : r.status === "pending" ? "secondary" : "destructive"}>
                      {r.status === "completed" ? "已完成" : r.status === "pending" ? "待完成" : "欺诈"}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-sm">
                    +{r.referrer_reward_days}天 / +{r.referee_reward_days}天
                  </TableCell>
                  <TableCell>
                    {r.fraud_flags.length > 0 ? (
                      <span className="text-xs text-red-600">{r.fraud_flags.join(", ")}</span>
                    ) : (
                      <span className="text-xs text-muted-foreground">—</span>
                    )}
                  </TableCell>
                  <TableCell className="text-xs text-muted-foreground">
                    {new Date(r.created_at).toLocaleDateString()}
                  </TableCell>
                  <TableCell>
                    {r.status === "completed" && (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-red-600 hover:text-red-700"
                        onClick={() => handleMarkFraud(r.id)}
                      >
                        标记欺诈
                      </Button>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          <Pagination
            page={page}
            totalPages={Math.ceil(total / 20)}
            onPageChange={setPage}
          />
        </>
      )}
    </div>
  );
}
