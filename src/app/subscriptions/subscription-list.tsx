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
import { Pagination } from "@/components/shared/pagination";
import { LoadingSpinner } from "@/components/shared/loading-spinner";
import { EmptyState } from "@/components/shared/empty-state";
import {
  fetchSubscriptions, extendSubscription, cancelSubscription, activateSubscription,
} from "@/lib/api/admin";
import type { AdminSubscriptionItem, PaginatedResponse } from "@/lib/api/types";

const STATUS_OPTIONS = ["all", "active", "trialing", "cancelled", "past_due", "expired"];
const PLAN_OPTIONS = ["all", "monthly", "semi_annual", "yearly"];

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
        page,
      });
      setData(res);
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : "Failed to load subscriptions");
    } finally {
      setLoading(false);
    }
  }, [status, plan, search, page]);

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
      toast.error(e instanceof Error ? e.message : "Failed to extend subscription");
    }
  }

  async function handleCancel(item: AdminSubscriptionItem) {
    if (!confirm(`Cancel subscription for ${item.email}?`)) return;
    try {
      const res = await cancelSubscription(item.user_id);
      toast.success(res.message);
      load();
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : "Failed to cancel subscription");
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
      toast.error(e instanceof Error ? e.message : "Failed to activate subscription");
    }
  }

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <Input
          placeholder="Search by email..."
          className="max-w-xs"
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)}
        />
        <Select value={status} onValueChange={(v) => { setStatus(v); setPage(1); }}>
          <SelectTrigger className="w-[140px]"><SelectValue /></SelectTrigger>
          <SelectContent>
            {STATUS_OPTIONS.map((s) => (
              <SelectItem key={s} value={s}>{s === "all" ? "All Status" : s}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={plan} onValueChange={(v) => { setPlan(v); setPage(1); }}>
          <SelectTrigger className="w-[140px]"><SelectValue /></SelectTrigger>
          <SelectContent>
            {PLAN_OPTIONS.map((p) => (
              <SelectItem key={p} value={p}>{p === "all" ? "All Plans" : p}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {loading ? (
        <LoadingSpinner />
      ) : !data || data.items.length === 0 ? (
        <EmptyState title="No subscriptions found" />
      ) : (
        <>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Email</TableHead>
                <TableHead>Plan</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Period End</TableHead>
                <TableHead>Created</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.items.map((item) => (
                <TableRow key={item.user_id}>
                  <TableCell className="font-medium">{item.email}</TableCell>
                  <TableCell>
                    {item.plan ? <Badge variant="secondary">{item.plan}</Badge> : "-"}
                  </TableCell>
                  <TableCell>
                    {item.status ? (
                      <Badge variant={statusVariant(item.status)}>{item.status}</Badge>
                    ) : "-"}
                  </TableCell>
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
                        Extend
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleCancel(item)}
                        disabled={!item.status || item.status === "cancelled" || item.status === "expired"}
                      >
                        Cancel
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => { setActivateDialog(item); setActivatePlan("monthly"); setActivateDays("30"); }}
                      >
                        Activate
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
            <DialogTitle>Extend Subscription</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">{extendDialog?.email}</p>
          <div className="space-y-2">
            <Label>Days to extend</Label>
            <Input
              type="number"
              min={1}
              max={365}
              value={extendDays}
              onChange={(e) => setExtendDays(e.target.value)}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setExtendDialog(null)}>Cancel</Button>
            <Button onClick={handleExtend}>Extend</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Activate Dialog */}
      <Dialog open={!!activateDialog} onOpenChange={() => setActivateDialog(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Activate Subscription</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">{activateDialog?.email}</p>
          <div className="space-y-3">
            <div className="space-y-2">
              <Label>Plan</Label>
              <Select value={activatePlan} onValueChange={setActivatePlan}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="monthly">Monthly</SelectItem>
                  <SelectItem value="semi_annual">Semi-Annual</SelectItem>
                  <SelectItem value="yearly">Yearly</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Days</Label>
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
            <Button variant="outline" onClick={() => setActivateDialog(null)}>Cancel</Button>
            <Button onClick={handleActivate}>Activate</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
