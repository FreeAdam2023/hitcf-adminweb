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
      toast.error("Failed to load referrals");
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
      toast.success("Referral marked as fraud");
      load();
    } catch {
      toast.error("Failed to mark as fraud");
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex gap-3">
        <Input
          placeholder="Search by email..."
          className="max-w-xs"
          onChange={(e) => handleSearch(e.target.value)}
        />
        <Select value={status} onValueChange={(v) => { setStatus(v); setPage(1); }}>
          <SelectTrigger className="w-[150px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="pending">Pending</SelectItem>
            <SelectItem value="completed">Completed</SelectItem>
            <SelectItem value="fraud">Fraud</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {loading ? (
        <LoadingSpinner />
      ) : data.length === 0 ? (
        <EmptyState title="No referrals found" />
      ) : (
        <>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Referrer</TableHead>
                <TableHead>Referee</TableHead>
                <TableHead>Code</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Reward</TableHead>
                <TableHead>Flags</TableHead>
                <TableHead>Date</TableHead>
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
                      {r.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-sm">
                    +{r.referrer_reward_days}d / +{r.referee_reward_days}d
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
                        Mark Fraud
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
