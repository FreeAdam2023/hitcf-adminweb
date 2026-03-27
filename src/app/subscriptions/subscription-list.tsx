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

const STATUS_OPTIONS = ["paying", "all", "active", "trialing", "cancelled", "past_due", "expired"];
const PLAN_OPTIONS = ["all", "monthly", "quarterly", "yearly", "tester", "referral", "recall"];
const ACTIVITY_OPTIONS = [
  { value: "all", label: "全部活跃度" },
  { value: "active", label: "活跃 (7天内)" },
  { value: "inactive", label: "不活跃 (7-30天)" },
  { value: "dormant", label: "沉睡 (30天+)" },
];

const LANG_LABELS: Record<string, string> = {
  zh: "中",
  en: "EN",
  fr: "FR",
  ar: "AR",
};

function ActivityLabel({ lastActiveAt }: { lastActiveAt: string | null }) {
  if (!lastActiveAt) return <span className="text-xs text-muted-foreground">从未</span>;
  const days = Math.floor((Date.now() - new Date(lastActiveAt).getTime()) / 86400000);
  if (days === 0) return <span className="text-xs font-medium text-green-600">今天</span>;
  if (days <= 7) return <span className="text-xs font-medium text-green-600">{days}天前</span>;
  if (days <= 30) return <span className="text-xs text-yellow-600">{days}天前</span>;
  return <span className="text-xs text-muted-foreground">{days}天前</span>;
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
  paying: "付费中",
  active: "已付费",
  trialing: "试用中",
  cancelled: "已取消",
  past_due: "逾期",
  expired: "已过期",
};

function statusVariant(s: string | null): "default" | "secondary" | "destructive" | "outline" {
  if (s === "active") return "default";
  if (s === "trialing") return "secondary";
  if (s === "past_due") return "destructive";
  return "outline";
}

export function SubscriptionList() {
  const [data, setData] = useState<PaginatedResponse<AdminSubscriptionItem> | null>(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("paying");
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
                <TableHead>语言</TableHead>
                <TableHead>活跃</TableHead>
                <TableHead>到期</TableHead>
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
                    {item.user_cancelled && item.status !== "cancelled" ? (
                      <div>
                        <Badge variant="outline" className="border-amber-500 text-amber-600">取消中</Badge>
                        {item.cancel_reason && (
                          <span className="ml-1 text-xs text-muted-foreground">{item.cancel_reason}</span>
                        )}
                      </div>
                    ) : ["tester", "referral", "recall"].includes(item.plan || "") ? (
                      <Badge variant="secondary">{PLAN_LABELS[item.plan!] || item.plan}</Badge>
                    ) : item.status === "active" && item.plan === "monthly" ? (
                      <Badge variant="default">续费中</Badge>
                    ) : item.status ? (
                      <Badge variant={statusVariant(item.status)}>{STATUS_LABELS[item.status] || item.status}</Badge>
                    ) : "-"}
                  </TableCell>
                  <TableCell>
                    <span className="text-xs text-muted-foreground">{LANG_LABELS[item.ui_language || ""] || item.ui_language || "-"}</span>
                  </TableCell>
                  <TableCell><ActivityLabel lastActiveAt={item.last_active_at} /></TableCell>
                  <TableCell>
                    {item.current_period_end ? (() => {
                      const days = Math.ceil((new Date(item.current_period_end).getTime() - Date.now()) / 86400000);
                      if (days < 0) return <span className="text-xs text-red-500">已过期{Math.abs(days)}天</span>;
                      if (days === 0) return <span className="text-xs font-medium text-red-500">今天到期</span>;
                      if (days <= 3) return <span className="text-xs font-medium text-red-500">{days}天后</span>;
                      if (days <= 7) return <span className="text-xs text-amber-600">{days}天后</span>;
                      return <span className="text-xs text-muted-foreground">{days}天后</span>;
                    })() : "-"}
                  </TableCell>
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
