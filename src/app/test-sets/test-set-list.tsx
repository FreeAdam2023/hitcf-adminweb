"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { TypeBadge } from "@/components/shared/type-badge";
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
  { value: "all", label: "全部类型" },
  { value: "listening", label: "听力" },
  { value: "reading", label: "阅读" },
  { value: "speaking", label: "口语" },
  { value: "writing", label: "写作" },
];

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const EXAM_TYPE_OPTIONS = [
  { value: "all", label: "全部考试" },
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
      setError(err instanceof Error ? err.message : "加载题库失败");
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
      toast.success("题库已删除");
      load();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "删除题库失败");
    }
  };

  const typeBadge = (type: string) => <TypeBadge type={type} />;

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
          placeholder="按名称搜索..."
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
            <RotateCcw className="mr-1 h-3 w-3" /> 重试
          </Button>
        </div>
      ) : !data || data.items.length === 0 ? (
        <EmptyState title="未找到题库" description="请调整筛选条件或搜索词" />
      ) : (
        <>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>编号</TableHead>
                <TableHead>名称</TableHead>
                <TableHead>类型</TableHead>
                <TableHead>考试</TableHead>
                <TableHead className="text-center">题目数</TableHead>
                <TableHead className="text-center">完整度</TableHead>
                <TableHead className="text-center">免费</TableHead>
                <TableHead className="text-center">已删除</TableHead>
                <TableHead className="text-center">排序</TableHead>
                <TableHead className="text-right">操作</TableHead>
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
                  <TableCell className="text-center">{ts.is_free ? "是" : "-"}</TableCell>
                  <TableCell className="text-center">{ts.is_deleted ? "是" : "-"}</TableCell>
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
                              <AlertDialogTitle>删除题库？</AlertDialogTitle>
                              <AlertDialogDescription>
                                将软删除 &quot;{ts.name}&quot;。之后可以恢复。
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>取消</AlertDialogCancel>
                              <AlertDialogAction onClick={() => handleDelete(ts.id)}>删除</AlertDialogAction>
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
