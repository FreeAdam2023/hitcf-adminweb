"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
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
import { fetchQuestions, deleteQuestion, fetchTestSets, bulkDeleteQuestions } from "@/lib/api/admin";
import type { AdminQuestionItem, AdminTestSetItem, PaginatedResponse } from "@/lib/api/types";
import {
  Tooltip, TooltipContent, TooltipProvider, TooltipTrigger,
} from "@/components/ui/tooltip";
import { Pencil, Trash2, Check, X, AlertCircle, RotateCcw } from "lucide-react";
import { toast } from "sonner";

export function QuestionList() {
  const searchParams = useSearchParams();
  const initialTsId = searchParams.get("test_set_id") || "";

  const [data, setData] = useState<PaginatedResponse<AdminQuestionItem> | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [testSetId, setTestSetId] = useState(initialTsId);
  const [page, setPage] = useState(1);
  const [testSets, setTestSets] = useState<AdminTestSetItem[]>([]);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [bulkDeleting, setBulkDeleting] = useState(false);

  // Load test sets for the dropdown
  useEffect(() => {
    fetchTestSets({ page_size: 200 }).then((res) => setTestSets(res.items));
  }, []);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    setSelectedIds(new Set());
    try {
      const res = await fetchQuestions({
        test_set_id: testSetId || undefined,
        page,
      });
      setData(res);
    } catch (err) {
      setError(err instanceof Error ? err.message : "加载题目失败");
    } finally {
      setLoading(false);
    }
  }, [testSetId, page]);

  useEffect(() => { load(); }, [load]);

  const handleDelete = async (id: string) => {
    try {
      await deleteQuestion(id);
      toast.success("题目已删除");
      load();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "删除题目失败");
    }
  };

  const handleBulkDelete = async () => {
    if (selectedIds.size === 0) return;
    setBulkDeleting(true);
    try {
      await bulkDeleteQuestions(Array.from(selectedIds));
      toast.success(`${selectedIds.size} 道题已删除`);
      load();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "批量删除失败");
    } finally {
      setBulkDeleting(false);
    }
  };

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  const toggleSelectAll = () => {
    if (!data) return;
    const activeItems = data.items.filter((q) => !q.is_deleted);
    if (selectedIds.size === activeItems.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(activeItems.map((q) => q.id)));
    }
  };

  const renderText = (text: string | null, max: number) => {
    if (!text) return <span className="text-muted-foreground">-</span>;
    if (text.length <= max) return text;
    return (
      <TooltipProvider delayDuration={300}>
        <Tooltip>
          <TooltipTrigger asChild>
            <span className="cursor-help">{text.slice(0, max)}...</span>
          </TooltipTrigger>
          <TooltipContent className="max-w-sm whitespace-pre-wrap">
            {text}
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <Select value={testSetId || "all"} onValueChange={(v) => { setTestSetId(v === "all" ? "" : v); setPage(1); }}>
          <SelectTrigger className="w-64">
            <SelectValue placeholder="按题库筛选..." />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">全部题库</SelectItem>
            {testSets.map((ts) => (
              <SelectItem key={ts.id} value={ts.id}>{ts.code} — {ts.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        {selectedIds.size > 0 && (
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="destructive" size="sm" disabled={bulkDeleting}>
                <Trash2 className="mr-1 h-3 w-3" />
                删除已选 {selectedIds.size} 项
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>批量删除题目？</AlertDialogTitle>
                <AlertDialogDescription>
                  将软删除已选的 {selectedIds.size} 道题目。
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>取消</AlertDialogCancel>
                <AlertDialogAction onClick={handleBulkDelete}>删除</AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        )}
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
        <EmptyState title="未找到题目" description="请尝试选择其他题库" />
      ) : (
        <>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-10">
                  <Checkbox
                    checked={data.items.filter((q) => !q.is_deleted).length > 0 && selectedIds.size === data.items.filter((q) => !q.is_deleted).length}
                    onCheckedChange={toggleSelectAll}
                  />
                </TableHead>
                <TableHead className="w-12">#</TableHead>
                <TableHead>题目</TableHead>
                <TableHead>类型</TableHead>
                <TableHead>级别</TableHead>
                <TableHead className="text-center">选项</TableHead>
                <TableHead className="text-center">答案</TableHead>
                <TableHead className="text-center">音频</TableHead>
                <TableHead className="text-center">已删除</TableHead>
                <TableHead className="text-right">操作</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.items.map((q) => (
                <TableRow key={q.id} className={q.is_deleted ? "opacity-50" : ""}>
                  <TableCell>
                    {!q.is_deleted && (
                      <Checkbox
                        checked={selectedIds.has(q.id)}
                        onCheckedChange={() => toggleSelect(q.id)}
                      />
                    )}
                  </TableCell>
                  <TableCell>{q.question_number}</TableCell>
                  <TableCell className="max-w-[200px] text-sm text-muted-foreground">
                    {renderText(q.question_text, 60)}
                  </TableCell>
                  <TableCell>
                    <Badge variant="secondary">{q.type}</Badge>
                  </TableCell>
                  <TableCell>{q.level || "-"}</TableCell>
                  <TableCell className="text-center">
                    {q.has_options ? <Check className="inline h-4 w-4 text-green-600" /> : <X className="inline h-4 w-4 text-muted-foreground" />}
                  </TableCell>
                  <TableCell className="text-center">
                    {q.has_answer ? <Check className="inline h-4 w-4 text-green-600" /> : <X className="inline h-4 w-4 text-muted-foreground" />}
                  </TableCell>
                  <TableCell className="text-center">
                    {q.has_audio ? <Check className="inline h-4 w-4 text-green-600" /> : <X className="inline h-4 w-4 text-muted-foreground" />}
                  </TableCell>
                  <TableCell className="text-center">{q.is_deleted ? "是" : "-"}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-1">
                      <Button variant="ghost" size="sm" asChild>
                        <Link href={`/questions/${q.id}`}>
                          <Pencil className="h-4 w-4" />
                        </Link>
                      </Button>
                      {!q.is_deleted && (
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button variant="ghost" size="sm">
                              <Trash2 className="h-4 w-4 text-destructive" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>删除题目？</AlertDialogTitle>
                              <AlertDialogDescription>
                                将软删除第 {q.question_number} 题。
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>取消</AlertDialogCancel>
                              <AlertDialogAction onClick={() => handleDelete(q.id)}>删除</AlertDialogAction>
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
