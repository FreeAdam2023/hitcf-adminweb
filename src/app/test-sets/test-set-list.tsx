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
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Pagination } from "@/components/shared/pagination";
import { LoadingSpinner } from "@/components/shared/loading-spinner";
import { EmptyState } from "@/components/shared/empty-state";
import { fetchTestSets, deleteTestSet } from "@/lib/api/admin";
import type { AdminTestSetItem, PaginatedResponse } from "@/lib/api/types";
import { Pencil, Trash2, AlertCircle, RotateCcw } from "lucide-react";
import { toast } from "sonner";

const TYPE_OPTIONS = [
  { value: "all", label: "All Types" },
  { value: "listening", label: "Listening" },
  { value: "reading", label: "Reading" },
  { value: "speaking", label: "Speaking" },
  { value: "writing", label: "Writing" },
];

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const EXAM_TYPE_OPTIONS = [
  { value: "all", label: "All Exams" },
  { value: "tcf_canada", label: "TCF Canada" },
  { value: "tcf_tp", label: "TCF TP" },
  { value: "tcf_irn", label: "TCF IRN" },
  { value: "tcf_quebec", label: "TCF Québec" },
];

export function TestSetList() {
  const [data, setData] = useState<PaginatedResponse<AdminTestSetItem> | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [typeFilter, setTypeFilter] = useState("all");
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [examTypeFilter, setExamTypeFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetchTestSets({
        type: typeFilter === "all" ? undefined : typeFilter,
        exam_type: examTypeFilter === "all" ? undefined : examTypeFilter,
        search: search || undefined,
        page,
      });
      setData(res);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load test sets");
    } finally {
      setLoading(false);
    }
  }, [typeFilter, examTypeFilter, search, page]);

  useEffect(() => { load(); }, [load]);

  const [searchInput, setSearchInput] = useState("");
  useEffect(() => {
    const t = setTimeout(() => {
      setSearch(searchInput);
      setPage(1);
    }, 400);
    return () => clearTimeout(t);
  }, [searchInput]);

  const handleDelete = async (id: string) => {
    try {
      await deleteTestSet(id);
      toast.success("Test set deleted");
      load();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to delete test set");
    }
  };

  const typeBadge = (type: string) => {
    const colors: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
      listening: "default",
      reading: "secondary",
      speaking: "outline",
      writing: "outline",
    };
    return <Badge variant={colors[type] || "secondary"}>{type}</Badge>;
  };

  const renderQuality = (ts: AdminTestSetItem) => {
    const q = ts.quality;
    if (!q || q.total === 0) return <span className="text-muted-foreground">-</span>;
    return (
      <span className="text-xs font-mono whitespace-nowrap">
        A:{q.with_answer}/{q.total}{" "}
        O:{q.with_options}/{q.total}
      </span>
    );
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <Select value={typeFilter} onValueChange={(v) => { setTypeFilter(v); setPage(1); }}>
          <SelectTrigger className="w-36">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {TYPE_OPTIONS.map((o) => (
              <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        {/* Exam type filter hidden — only TCF Canada data for now */}
        <Input
          placeholder="Search by name..."
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)}
          className="max-w-sm"
        />
      </div>

      {loading ? (
        <div className="flex h-32 items-center justify-center"><LoadingSpinner /></div>
      ) : error ? (
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <AlertCircle className="h-10 w-10 text-destructive mb-3" />
          <p className="text-sm text-destructive mb-3">{error}</p>
          <Button variant="outline" size="sm" onClick={load}>
            <RotateCcw className="mr-1 h-3 w-3" /> Retry
          </Button>
        </div>
      ) : !data || data.items.length === 0 ? (
        <EmptyState title="No test sets found" description="Try adjusting your filters or search terms." />
      ) : (
        <>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Code</TableHead>
                <TableHead>Name</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Exam</TableHead>
                <TableHead className="text-center">Questions</TableHead>
                <TableHead className="text-center">Completeness</TableHead>
                <TableHead className="text-center">Free</TableHead>
                <TableHead className="text-center">Deleted</TableHead>
                <TableHead className="text-center">Order</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.items.map((ts) => (
                <TableRow key={ts.id} className={ts.is_deleted ? "opacity-50" : ""}>
                  <TableCell className="font-mono text-sm">{ts.code}</TableCell>
                  <TableCell>{ts.name}</TableCell>
                  <TableCell>{typeBadge(ts.type)}</TableCell>
                  <TableCell className="text-xs text-muted-foreground">{ts.exam_type?.replace("tcf_", "TCF ").replace("canada", "Canada").replace("quebec", "Québec") || "TCF Canada"}</TableCell>
                  <TableCell className="text-center">{ts.question_count}</TableCell>
                  <TableCell className="text-center">{renderQuality(ts)}</TableCell>
                  <TableCell className="text-center">{ts.is_free ? "Yes" : "-"}</TableCell>
                  <TableCell className="text-center">{ts.is_deleted ? "Yes" : "-"}</TableCell>
                  <TableCell className="text-center">{ts.order}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-1">
                      <Button variant="ghost" size="sm" asChild>
                        <Link href={`/test-sets/${ts.id}`}>
                          <Pencil className="h-4 w-4" />
                        </Link>
                      </Button>
                      {!ts.is_deleted && (
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button variant="ghost" size="sm">
                              <Trash2 className="h-4 w-4 text-destructive" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Delete test set?</AlertDialogTitle>
                              <AlertDialogDescription>
                                This will soft-delete &quot;{ts.name}&quot;. It can be restored later.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction onClick={() => handleDelete(ts.id)}>Delete</AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      )}
                    </div>
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
