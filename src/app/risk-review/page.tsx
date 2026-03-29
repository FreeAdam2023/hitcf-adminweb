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
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Pagination } from "@/components/shared/pagination";
import { LoadingSpinner } from "@/components/shared/loading-spinner";
import { EmptyState } from "@/components/shared/empty-state";
import {
  fetchRiskAccounts,
  fetchRiskSummary,
  runRiskScan,
  reviewRiskAccount,
  type RiskAccount,
  type RiskSummary,
} from "@/lib/api/admin";
import {
  ShieldAlert, ShieldCheck, ShieldX, Search, Loader2,
  AlertTriangle, CheckCircle2, XCircle, ScanSearch,
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

function RiskBadge({ score }: { score: number }) {
  if (score >= 60) return <Badge variant="destructive">{score}</Badge>;
  if (score >= 30) return <Badge className="bg-amber-500 text-white">{score}</Badge>;
  if (score > 0) return <Badge variant="secondary">{score}</Badge>;
  return <span className="text-muted-foreground">0</span>;
}

function StatusBadge({ status }: { status: string | null }) {
  if (status === "flagged") return <Badge variant="destructive" className="gap-1"><AlertTriangle className="h-3 w-3" />待审核</Badge>;
  if (status === "approved") return <Badge className="gap-1 bg-green-600 text-white"><CheckCircle2 className="h-3 w-3" />已通过</Badge>;
  if (status === "rejected") return <Badge variant="destructive" className="gap-1"><XCircle className="h-3 w-3" />已拒绝</Badge>;
  return <span className="text-xs text-muted-foreground">-</span>;
}

function FlagChips({ flags }: { flags: string[] }) {
  if (!flags.length) return <span className="text-xs text-muted-foreground">-</span>;
  return (
    <div className="flex flex-wrap gap-1">
      {flags.map((f) => (
        <span key={f} className="inline-block rounded bg-muted px-1.5 py-0.5 text-[10px] font-mono">
          {f}
        </span>
      ))}
    </div>
  );
}

const STATUS_OPTIONS = [
  { value: "all", label: "全部" },
  { value: "flagged", label: "待审核" },
  { value: "approved", label: "已通过" },
  { value: "rejected", label: "已拒绝" },
];

export default function RiskReviewPage() {
  const [accounts, setAccounts] = useState<RiskAccount[]>([]);
  const [summary, setSummary] = useState<RiskSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [scanning, setScanning] = useState(false);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [statusFilter, setStatusFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [searchInput, setSearchInput] = useState("");

  // Review dialog
  const [reviewTarget, setReviewTarget] = useState<RiskAccount | null>(null);
  const [reviewAction, setReviewAction] = useState<"approve" | "reject" | "reset">("approve");
  const [reviewNote, setReviewNote] = useState("");
  const [reviewing, setReviewing] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [res, sum] = await Promise.all([
        fetchRiskAccounts({
          status: statusFilter === "all" ? undefined : statusFilter,
          search: search || undefined,
          page,
          page_size: 20,
        }),
        fetchRiskSummary(),
      ]);
      setAccounts(res.items);
      setTotal(res.total);
      setTotalPages(res.total_pages);
      setSummary(sum);
    } catch {
      toast.error("Failed to load risk data");
    } finally {
      setLoading(false);
    }
  }, [statusFilter, search, page]);

  useEffect(() => { load(); }, [load]);

  const handleScan = async () => {
    setScanning(true);
    try {
      const res = await runRiskScan();
      toast.success(`Scanned ${res.scanned} users, flagged ${res.flagged}`);
      load();
    } catch {
      toast.error("Scan failed");
    } finally {
      setScanning(false);
    }
  };

  const handleReview = async () => {
    if (!reviewTarget) return;
    setReviewing(true);
    try {
      await reviewRiskAccount(reviewTarget.id, reviewAction, reviewNote || undefined);
      toast.success(
        reviewAction === "approve" ? "Account approved" :
        reviewAction === "reject" ? "Account rejected & locked" :
        "Risk data reset"
      );
      setReviewTarget(null);
      setReviewNote("");
      load();
    } catch {
      toast.error("Review failed");
    } finally {
      setReviewing(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <ShieldAlert className="h-6 w-6" />
            Risk Review
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Review flagged accounts and manage risk status
          </p>
        </div>
        <Button onClick={handleScan} disabled={scanning} variant="outline" className="gap-2">
          {scanning ? <Loader2 className="h-4 w-4 animate-spin" /> : <ScanSearch className="h-4 w-4" />}
          {scanning ? "Scanning..." : "Run Scan"}
        </Button>
      </div>

      {/* Summary cards */}
      {summary && (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
          <SummaryCard label="Flagged" value={summary.flagged} icon={AlertTriangle} color="text-red-500" />
          <SummaryCard label="High Risk (60+)" value={summary.high_risk} icon={ShieldX} color="text-red-500" />
          <SummaryCard label="Medium (30-59)" value={summary.medium_risk} icon={ShieldAlert} color="text-amber-500" />
          <SummaryCard label="Approved" value={summary.approved} icon={ShieldCheck} color="text-green-500" />
          <SummaryCard label="Rejected" value={summary.rejected} icon={XCircle} color="text-gray-500" />
        </div>
      )}

      {/* Filters */}
      <div className="flex items-center gap-3">
        <Select value={statusFilter} onValueChange={(v) => { setStatusFilter(v); setPage(1); }}>
          <SelectTrigger className="w-32">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {STATUS_OPTIONS.map((o) => (
              <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <form
          onSubmit={(e) => { e.preventDefault(); setSearch(searchInput); setPage(1); }}
          className="flex items-center gap-2"
        >
          <Input
            placeholder="Search email/name..."
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            className="w-56"
          />
          <Button type="submit" variant="outline" size="icon">
            <Search className="h-4 w-4" />
          </Button>
        </form>
        <span className="ml-auto text-sm text-muted-foreground">{total} accounts</span>
      </div>

      {/* Table */}
      {loading ? (
        <LoadingSpinner />
      ) : accounts.length === 0 ? (
        <EmptyState title="No risk accounts" description="Run a scan to detect suspicious accounts." />
      ) : (
        <div className="rounded-lg border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>User</TableHead>
                <TableHead className="w-20 text-center">Score</TableHead>
                <TableHead className="w-24">Status</TableHead>
                <TableHead>Flags</TableHead>
                <TableHead>Plan</TableHead>
                <TableHead>IP / Country</TableHead>
                <TableHead className="w-28">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {accounts.map((a) => (
                <TableRow key={a.id} className={cn(a.risk_score >= 60 && "bg-red-50/50 dark:bg-red-950/20")}>
                  <TableCell>
                    <Link href={`/users/${a.id}`} className="text-sm font-medium hover:underline">
                      {a.email}
                    </Link>
                    {a.name && <p className="text-xs text-muted-foreground">{a.name}</p>}
                  </TableCell>
                  <TableCell className="text-center">
                    <RiskBadge score={a.risk_score} />
                  </TableCell>
                  <TableCell>
                    <StatusBadge status={a.risk_status} />
                  </TableCell>
                  <TableCell>
                    <FlagChips flags={a.risk_flags} />
                  </TableCell>
                  <TableCell>
                    <span className="text-xs">{a.plan || "-"}</span>
                  </TableCell>
                  <TableCell>
                    <span className="text-xs font-mono">{a.signup_ip || "-"}</span>
                    {a.signup_country && <span className="ml-1 text-xs text-muted-foreground">{a.signup_country}</span>}
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-1">
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-7 px-2 text-xs text-green-600"
                        onClick={() => { setReviewTarget(a); setReviewAction("approve"); }}
                      >
                        <CheckCircle2 className="mr-1 h-3 w-3" />Pass
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-7 px-2 text-xs text-red-600"
                        onClick={() => { setReviewTarget(a); setReviewAction("reject"); }}
                      >
                        <XCircle className="mr-1 h-3 w-3" />Block
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      {totalPages > 1 && (
        <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />
      )}

      {/* Review Dialog */}
      <Dialog open={!!reviewTarget} onOpenChange={(o) => { if (!o) setReviewTarget(null); }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {reviewAction === "approve" ? "Approve Account" :
               reviewAction === "reject" ? "Reject & Lock Account" :
               "Reset Risk Data"}
            </DialogTitle>
          </DialogHeader>
          {reviewTarget && (
            <div className="space-y-3">
              <div className="text-sm">
                <span className="font-medium">{reviewTarget.email}</span>
                <span className="ml-2 text-muted-foreground">Score: {reviewTarget.risk_score}</span>
              </div>
              <div>
                <FlagChips flags={reviewTarget.risk_flags} />
              </div>
              {reviewAction === "reject" && (
                <Textarea
                  placeholder="Reason for rejection (optional)..."
                  value={reviewNote}
                  onChange={(e) => setReviewNote(e.target.value)}
                  rows={2}
                />
              )}
              <div className="flex gap-2">
                {(["approve", "reject", "reset"] as const).map((a) => (
                  <Button
                    key={a}
                    size="sm"
                    variant={reviewAction === a ? "default" : "outline"}
                    onClick={() => setReviewAction(a)}
                  >
                    {a === "approve" ? "Approve" : a === "reject" ? "Reject" : "Reset"}
                  </Button>
                ))}
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setReviewTarget(null)}>Cancel</Button>
            <Button
              onClick={handleReview}
              disabled={reviewing}
              variant={reviewAction === "reject" ? "destructive" : "default"}
            >
              {reviewing ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              Confirm
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function SummaryCard({ label, value, icon: Icon, color }: { label: string; value: number; icon: React.ElementType; color: string }) {
  return (
    <div className="rounded-lg border bg-card p-3">
      <div className="flex items-center gap-2">
        <Icon className={cn("h-4 w-4", color)} />
        <span className="text-sm text-muted-foreground">{label}</span>
      </div>
      <p className="mt-1 text-2xl font-bold">{value}</p>
    </div>
  );
}
