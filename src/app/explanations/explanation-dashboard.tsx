"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select, SelectTrigger, SelectValue, SelectContent, SelectItem,
} from "@/components/ui/select";
import { LoadingSpinner } from "@/components/shared/loading-spinner";
import {
  fetchExplanationStats, startBatchGeneration, fetchBatchStatus, cancelBatchGeneration, fetchTestSets,
} from "@/lib/api/admin";
import type { ExplanationStats, BatchStatus, AdminTestSetItem } from "@/lib/api/types";
import { Lightbulb, AlertCircle, CheckCircle } from "lucide-react";

export function ExplanationDashboard() {
  const [stats, setStats] = useState<ExplanationStats | null>(null);
  const [batch, setBatch] = useState<BatchStatus | null>(null);
  const [testSets, setTestSets] = useState<AdminTestSetItem[]>([]);
  const [loading, setLoading] = useState(true);

  // Batch controls
  const [selectedType, setSelectedType] = useState("all");
  const [selectedTestSet, setSelectedTestSet] = useState("all");
  const [limit, setLimit] = useState("50");
  const [starting, setStarting] = useState(false);

  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const loadStats = useCallback(async () => {
    try {
      const [s, b, ts] = await Promise.all([
        fetchExplanationStats(),
        fetchBatchStatus(),
        fetchTestSets({ page_size: 100 }),
      ]);
      setStats(s);
      setBatch(b);
      setTestSets(ts.items);
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : "加载统计失败");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadStats(); }, [loadStats]);

  // Poll while batch is running
  useEffect(() => {
    if (batch?.running) {
      pollRef.current = setInterval(async () => {
        try {
          const b = await fetchBatchStatus();
          setBatch(b);
          if (!b.running) {
            if (pollRef.current) clearInterval(pollRef.current);
            pollRef.current = null;
            loadStats();
          }
        } catch {}
      }, 3000);
    }
    return () => {
      if (pollRef.current) { clearInterval(pollRef.current); pollRef.current = null; }
    };
  }, [batch?.running, loadStats]);

  async function handleStart() {
    setStarting(true);
    try {
      const params: Record<string, unknown> = {};
      if (selectedType !== "all") params.type = selectedType;
      if (selectedTestSet !== "all") params.test_set_id = selectedTestSet;
      params.limit = Number(limit);
      const res = await startBatchGeneration(params as { test_set_id?: string; type?: string; limit?: number });
      toast.success(res.message);
      // Start polling
      const b = await fetchBatchStatus();
      setBatch(b);
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : "启动批量生成失败");
    } finally {
      setStarting(false);
    }
  }

  async function handleCancel() {
    try {
      const res = await cancelBatchGeneration();
      toast.success(res.message);
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : "取消批量生成失败");
    }
  }

  if (loading) return <LoadingSpinner />;
  if (!stats) return null;

  const pct = stats.total > 0 ? Math.round((stats.with_explanation / stats.total) * 100) : 0;

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">题目总数</CardTitle>
            <Lightbulb className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent><div className="text-2xl font-bold">{stats.total.toLocaleString()}</div></CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">已生成解析</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent><div className="text-2xl font-bold">{stats.with_explanation.toLocaleString()}</div></CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">待生成</CardTitle>
            <AlertCircle className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent><div className="text-2xl font-bold">{stats.without_explanation.toLocaleString()}</div></CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">覆盖率</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{pct}%</div>
            <div className="mt-2 h-2 rounded-full bg-muted">
              <div className="h-2 rounded-full bg-primary" style={{ width: `${pct}%` }} />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* By Type */}
      <Card>
        <CardHeader><CardTitle className="text-base">按类型统计</CardTitle></CardHeader>
        <CardContent>
          <div className="grid gap-3 md:grid-cols-4">
            {Object.entries(stats.by_type).map(([type, data]) => {
              const typePct = data.total > 0 ? Math.round((data.with_explanation / data.total) * 100) : 0;
              return (
                <div key={type} className="space-y-1">
                  <div className="flex justify-between text-sm">
                    <span className="font-medium capitalize">{type}</span>
                    <span className="text-muted-foreground">{data.with_explanation}/{data.total}</span>
                  </div>
                  <div className="h-2 rounded-full bg-muted">
                    <div className="h-2 rounded-full bg-primary" style={{ width: `${typePct}%` }} />
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Batch Generation */}
      <Card>
        <CardHeader><CardTitle className="text-base">批量生成</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          {batch?.running ? (
            <div className="space-y-3">
              <div className="flex items-center justify-between text-sm">
                <span>进度: {batch.completed + batch.failed} / {batch.total}</span>
                <span className="text-muted-foreground">
                  {batch.failed > 0 && <span className="text-red-600">{batch.failed} 个失败</span>}
                </span>
              </div>
              <div className="h-3 rounded-full bg-muted">
                <div
                  className="h-3 rounded-full bg-primary transition-all"
                  style={{ width: `${batch.total > 0 ? ((batch.completed + batch.failed) / batch.total) * 100 : 0}%` }}
                />
              </div>
              {batch.errors.length > 0 && (
                <div className="text-xs text-red-600 space-y-1">
                  {batch.errors.map((err, i) => (
                    <div key={i}>Q {err.question_id}: {err.error}</div>
                  ))}
                </div>
              )}
              <Button variant="destructive" size="sm" onClick={handleCancel}>取消</Button>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="grid gap-3 md:grid-cols-3">
                <div className="space-y-2">
                  <Label>类型</Label>
                  <Select value={selectedType} onValueChange={setSelectedType}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">全部类型</SelectItem>
                      <SelectItem value="listening">听力</SelectItem>
                      <SelectItem value="reading">阅读</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>题库</Label>
                  <Select value={selectedTestSet} onValueChange={setSelectedTestSet}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">全部题库</SelectItem>
                      {testSets.map((ts) => (
                        <SelectItem key={ts.id} value={ts.id}>{ts.code} - {ts.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>数量上限</Label>
                  <Input
                    type="number"
                    min={1}
                    max={500}
                    value={limit}
                    onChange={(e) => setLimit(e.target.value)}
                  />
                </div>
              </div>
              <Button onClick={handleStart} disabled={starting}>
                {starting ? "启动中..." : "开始批量生成"}
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
