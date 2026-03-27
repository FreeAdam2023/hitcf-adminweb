"use client";

import { useState, useEffect, useCallback } from "react";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table, TableHeader, TableRow, TableHead, TableBody, TableCell,
} from "@/components/ui/table";
import {
  Select, SelectTrigger, SelectValue, SelectContent, SelectItem,
} from "@/components/ui/select";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import Link from "next/link";
import { Pagination } from "@/components/shared/pagination";
import { LoadingSpinner } from "@/components/shared/loading-spinner";
import { EmptyState } from "@/components/shared/empty-state";
import {
  fetchSubscriptions, extendSubscription, cancelSubscription, activateSubscription,
} from "@/lib/api/admin";
import type { AdminSubscriptionItem, PaginatedResponse } from "@/lib/api/types";

const STATUS_OPTIONS = ["all", "active", "trialing", "cancelled", "past_due", "expired"];
const PLAN_OPTIONS = ["all", "monthly", "quarterly", "yearly", "tester", "referral", "recall"];
const ACTIVITY_OPTIONS = [
  { value: "all", label: "全部活跃度" },
  { value: "active", label: "活跃 (7天内)" },
  { value: "inactive", label: "不活跃 (7-30天)" },
  { value: "dormant", label: "沉睡 (30天+)" },
];

function ActivityDot({ lastActiveAt }: { lastActiveAt: string | null }) {
  if (!lastActiveAt) return <span className="inline-block h-2 w-2 rounded-full bg-gray-300" title="从未活跃" />;
  const days = Math.floor((Date.now() - new Date(lastActiveAt).getTime()) / 86400000);
  if (days <= 7) return <span className="inline-block h-2 w-2 rounded-full bg-green-500" title={`${days}天前活跃`} />;
  if (days <= 30) return <span className="inline-block h-2 w-2 rounded-full bg-yellow-500" title={`${days}天前活跃`} />;
  return <span className="inline-block h-2 w-2 rounded-full bg-gray-400" title={`${days}天前活跃`} />;
}
const PLAN_LABELS: Record<string, string> = {
  all: "全部套餐",
  monthly: "月付",
  quarterly: "季付",
  yearly: "年付",
  tester: "体验官",
  referral: "推荐奖励",
  recall: "召回体验",
};

const STATUS_LABELS: Record<string, string> = {
  active: "活跃",
  trialing: "试用中",
  cancelled: "已取消",
  past_due: "逾期",
  expired: "已过期",
};

function statusVariant(s: string | null) {
  if (s === "active") return "default";
  if (s === "trialing") return "secondary";
  if (s === "past_due") return "destructive";
  return "outline";
}

export function SubscriptionList() {
  const [data, setData] = useState<PaginatedResponse<AdminSubscriptionItem> | null>(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("all");
  const [plan, setPlan] = useState("all");
  const [activityStatus, setActivityStatus] = useState("all");
  const [page, setPage] = useState(1);

  // Dialogs
  const [extendDialog, setExtendDialog] = useState<AdminSubscriptionItem | null>(null);
  const [extendDays, setExtendDays] = useState("30");
  const [activateDialog, setActivateDialog] = useState<AdminSubscriptionItem | null>(null);
  const [activatePlan, setActivatePlan] = useState("monthly");
  const [activateDays, setActivateDays] = useState("30");

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetchSubscriptions({
        status: status !== "all" ? status : undefined,
        plan: plan !== "all" ? plan : undefined,
        search: search || undefined,
        activity_status: activityStatus !== "all" ? activityStatus : undefined,
        page,
      });
      setData(res);
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : "加载订阅失败");
    } finally {
      setLoading(false);
    }
  }, [status, plan, search, activityStatus, page]);

  useEffect(() => { load(); }, [load]);

  // Debounced search
  const [searchInput, setSearchInput] = useState("");
  useEffect(() => {
    const t = setTimeout(() => { setSearch(searchInput); setPage(1); }, 400);
    return () => clearTimeout(t);
  }, [searchInput]);

  async function handleExtend() {
    if (!extendDialog) return;
    try {
      const res = await extendSubscription(extendDialog.user_id, Number(extendDays));
      toast.success(res.message);
      setExtendDialog(null);
      load();
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : "延长订阅失败");
    }
  }

  async function handleCancel(item: AdminSubscriptionItem) {
    if (!confirm(`确认取消 ${item.email} 的订阅？`)) return;
    try {
      const res = await cancelSubscription(item.user_id);
      toast.success(res.message);
      load();
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : "取消订阅失败");
    }
  }

  async function handleActivate() {
    if (!activateDialog) return;
    try {
      const res = await activateSubscription(activateDialog.user_id, {
        plan: activatePlan,
        days: Number(activateDays),
      });
      toast.success(res.message);
      setActivateDialog(null);
      load();
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : "激活订阅失败");
    }
  }

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <Input
          placeholder="按邮箱搜索..."
          className="max-w-xs"
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)}
        />
        <Select value={status} onValueChange={(v) => { setStatus(v); setPage(1); }}>
          <SelectTrigger className="w-[140px]"><SelectValue /></SelectTrigger>
          <SelectContent>
            {STATUS_OPTIONS.map((s) => (
              <SelectItem key={s} value={s}>{s === "all" ? "全部状态" : STATUS_LABELS[s] || s}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={plan} onValueChange={(v) => { setPlan(v); setPage(1); }}>
          <SelectTrigger className="w-[140px]"><SelectValue /></SelectTrigger>
          <SelectContent>
            {PLAN_OPTIONS.map((p) => (
              <SelectItem key={p} value={p}>{PLAN_LABELS[p] || p}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={activityStatus} onValueChange={(v) => { setActivityStatus(v); setPage(1); }}>
          <SelectTrigger className="w-[160px]"><SelectValue /></SelectTrigger>
          <SelectContent>
            {ACTIVITY_OPTIONS.map((o) => (
              <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {loading ? (
        <LoadingSpinner />
      ) : !data || data.items.length === 0 ? (
        <EmptyState title="未找到订阅" />
      ) : (
        <>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>邮箱</TableHead>
                <TableHead>套餐</TableHead>
                <TableHead>状态</TableHead>
                <TableHead className="text-center">活跃</TableHead>
                <TableHead>到期时间</TableHead>
                <TableHead>创建时间</TableHead>
                <TableHead>操作</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.items.map((item) => (
                <TableRow key={item.user_id}>
                  <TableCell className="font-medium">
                    <Link href={`/users/${item.user_id}`} className="text-primary hover:underline">
                      {item.email}
                    </Link>
                  </TableCell>
                  <TableCell>
                    {item.plan ? <Badge variant="secondary">{PLAN_LABELS[item.plan] || item.plan}</Badge> : "-"}
                  </TableCell>
                  <TableCell>
                    {item.cancel_at_period_end ? (
                      <Badge variant="outline" className="border-amber-500 text-amber-600">已取消·到期前</Badge>
                    ) : item.status ? (
                      <Badge variant={statusVariant(item.status)}>{STATUS_LABELS[item.status] || item.status}</Badge>
                    ) : "-"}
                  </TableCell>
                  <TableCell className="text-center"><ActivityDot lastActiveAt={item.last_active_at} /></TableCell>
                  <TableCell>
                    {item.current_period_end
                      ? new Date(item.current_period_end).toLocaleDateString()
                      : "-"}
                  </TableCell>
                  <TableCell>{new Date(item.created_at).toLocaleDateString()}</TableCell>
                  <TableCell>
                    <div className="flex gap-1">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => { setExtendDialog(item); setExtendDays("30"); }}
                        disabled={!item.status || item.status === "cancelled" || item.status === "expired"}
                      >
                        延期
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleCancel(item)}
                        disabled={!item.status || item.status === "cancelled" || item.status === "expired"}
                      >
                        取消
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => { setActivateDialog(item); setActivatePlan("monthly"); setActivateDays("30"); }}
                      >
                        激活
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          <Pagination page={page} totalPages={data.total_pages} onPageChange={setPage} />
        </>
      )}

      {/* Extend Dialog */}
      <Dialog open={!!extendDialog} onOpenChange={() => setExtendDialog(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>延长订阅</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">{extendDialog?.email}</p>
          <div className="space-y-2">
            <Label>延长天数</Label>
            <Input
              type="number"
              min={1}
              max={365}
              value={extendDays}
              onChange={(e) => setExtendDays(e.target.value)}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setExtendDialog(null)}>取消</Button>
            <Button onClick={handleExtend}>延期</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Activate Dialog */}
      <Dialog open={!!activateDialog} onOpenChange={() => setActivateDialog(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>激活订阅</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">{activateDialog?.email}</p>
          <div className="space-y-3">
            <div className="space-y-2">
              <Label>套餐</Label>
              <Select value={activatePlan} onValueChange={setActivatePlan}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="monthly">月付</SelectItem>
                  <SelectItem value="quarterly">季付</SelectItem>
                  <SelectItem value="yearly">年付</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>天数</Label>
              <Input
                type="number"
                min={1}
                max={365}
                value={activateDays}
                onChange={(e) => setActivateDays(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setActivateDialog(null)}>取消</Button>
            <Button onClick={handleActivate}>激活</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
