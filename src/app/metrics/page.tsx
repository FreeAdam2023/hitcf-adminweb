"use client";

import { useEffect, useState, useCallback } from "react";
import { PageHeader } from "@/components/shared/page-header";
import {
  fetchMetrics,
  fetchSlowRoutes,
  fetchBackgroundTasks,
  type MetricsSnapshot,
  type RouteMetrics,
  type BackgroundTasksResponse,
} from "@/lib/api/admin";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Activity,
  Clock,
  AlertTriangle,
  RefreshCw,
  Server,
  Zap,
  Radar,
} from "lucide-react";

function formatUptime(seconds: number): string {
  const d = Math.floor(seconds / 86400);
  const h = Math.floor((seconds % 86400) / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  if (d > 0) return `${d}d ${h}h ${m}m`;
  if (h > 0) return `${h}h ${m}m`;
  return `${m}m`;
}

function latencyColor(ms: number): string {
  if (ms < 0.2) return "text-green-600";
  if (ms < 1.0) return "text-yellow-600";
  return "text-red-600";
}

function errorRateColor(rate: string): string {
  const num = parseFloat(rate);
  if (num === 0) return "text-muted-foreground";
  if (num < 5) return "text-yellow-600";
  return "text-red-600 font-medium";
}

type SortKey = "route" | "total" | "errors" | "error_rate" | "p50" | "p95" | "p99";
type SortDir = "asc" | "desc";

export default function MetricsPage() {
  const [data, setData] = useState<MetricsSnapshot | null>(null);
  const [slowRoutes, setSlowRoutes] = useState<
    Array<RouteMetrics & { route: string }>
  >([]);
  const [bgTasks, setBgTasks] = useState<BackgroundTasksResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [threshold, setThreshold] = useState("1.0");
  const [filter, setFilter] = useState("");
  const [sortKey, setSortKey] = useState<SortKey>("total");
  const [sortDir, setSortDir] = useState<SortDir>("desc");

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [metrics, slow, tasks] = await Promise.all([
        fetchMetrics(),
        fetchSlowRoutes(parseFloat(threshold) || 1.0),
        fetchBackgroundTasks(),
      ]);
      setData(metrics);
      setSlowRoutes(slow.routes || []);
      setBgTasks(tasks);
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  }, [threshold]);

  useEffect(() => {
    load();
  }, [load]);

  const routes: Array<{ route: string } & RouteMetrics> = data
    ? Object.entries(data.routes)
        .map(([route, stats]) => ({ route, ...stats }))
        .filter((r) => !filter || r.route.toLowerCase().includes(filter.toLowerCase()))
    : [];

  // Sort
  routes.sort((a, b) => {
    let av: number | string;
    let bv: number | string;
    if (sortKey === "route") {
      av = a.route;
      bv = b.route;
    } else if (sortKey === "error_rate") {
      av = parseFloat(a.error_rate);
      bv = parseFloat(b.error_rate);
    } else {
      av = a[sortKey];
      bv = b[sortKey];
    }
    if (av < bv) return sortDir === "asc" ? -1 : 1;
    if (av > bv) return sortDir === "asc" ? 1 : -1;
    return 0;
  });

  const handleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(key);
      setSortDir("desc");
    }
  };

  const sortIcon = (key: SortKey) =>
    sortKey === key ? (sortDir === "asc" ? " \u2191" : " \u2193") : "";

  return (
    <div className="space-y-6">
      <PageHeader
        title="性能监控"
        description="请求指标 · 延迟分位 · 慢路由告警"
        actions={
          <Button variant="outline" size="sm" onClick={load} disabled={loading}>
            <RefreshCw className={`mr-2 h-4 w-4 ${loading ? "animate-spin" : ""}`} />
            刷新
          </Button>
        }
      />

      {/* Summary cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">运行时间</CardTitle>
            <Server className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {data ? formatUptime(data.uptime_seconds) : "-"}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">总请求</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {data ? data.total_requests.toLocaleString() : "-"}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">总错误</CardTitle>
            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {data ? data.total_errors.toLocaleString() : "-"}
            </div>
            {data && data.total_requests > 0 && (
              <p className="text-xs text-muted-foreground">
                {((data.total_errors / data.total_requests) * 100).toFixed(1)}% 错误率
              </p>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">慢路由</CardTitle>
            <Zap className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{slowRoutes.length}</div>
            <p className="text-xs text-muted-foreground">
              P95 &gt; {threshold}s
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Slow routes alert */}
      {slowRoutes.length > 0 && (
        <Card className="border-yellow-500/50">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-sm">
              <AlertTriangle className="h-4 w-4 text-yellow-500" />
              慢路由 (P95 &gt; {threshold}s)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {slowRoutes.map((r) => (
                <div
                  key={r.route}
                  className="flex items-center justify-between rounded-md bg-muted px-3 py-2 text-sm"
                >
                  <code className="font-mono text-xs">{r.route}</code>
                  <div className="flex items-center gap-3">
                    <Badge variant="outline">P95: {r.p95}s</Badge>
                    <Badge variant="outline">P99: {r.p99}s</Badge>
                    <span className="text-muted-foreground">{r.total} reqs</span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Route table */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <CardTitle className="flex items-center gap-2 text-sm">
              <Clock className="h-4 w-4" />
              路由指标 ({routes.length})
            </CardTitle>
            <div className="flex items-center gap-2">
              <Input
                placeholder="搜索路由..."
                value={filter}
                onChange={(e) => setFilter(e.target.value)}
                className="h-8 w-48"
              />
              <Input
                type="number"
                step="0.5"
                min="0.1"
                max="30"
                value={threshold}
                onChange={(e) => setThreshold(e.target.value)}
                className="h-8 w-20"
                title="慢路由阈值 (秒)"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead
                    className="cursor-pointer select-none"
                    onClick={() => handleSort("route")}
                  >
                    路由{sortIcon("route")}
                  </TableHead>
                  <TableHead
                    className="cursor-pointer select-none text-right"
                    onClick={() => handleSort("total")}
                  >
                    请求数{sortIcon("total")}
                  </TableHead>
                  <TableHead
                    className="cursor-pointer select-none text-right"
                    onClick={() => handleSort("errors")}
                  >
                    错误{sortIcon("errors")}
                  </TableHead>
                  <TableHead
                    className="cursor-pointer select-none text-right"
                    onClick={() => handleSort("error_rate")}
                  >
                    错误率{sortIcon("error_rate")}
                  </TableHead>
                  <TableHead
                    className="cursor-pointer select-none text-right"
                    onClick={() => handleSort("p50")}
                  >
                    P50{sortIcon("p50")}
                  </TableHead>
                  <TableHead
                    className="cursor-pointer select-none text-right"
                    onClick={() => handleSort("p95")}
                  >
                    P95{sortIcon("p95")}
                  </TableHead>
                  <TableHead
                    className="cursor-pointer select-none text-right"
                    onClick={() => handleSort("p99")}
                  >
                    P99{sortIcon("p99")}
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {routes.length === 0 && !loading ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center text-muted-foreground">
                      暂无数据
                    </TableCell>
                  </TableRow>
                ) : (
                  routes.map((r) => (
                    <TableRow key={r.route}>
                      <TableCell>
                        <code className="rounded bg-muted px-1.5 py-0.5 font-mono text-xs">
                          {r.route}
                        </code>
                      </TableCell>
                      <TableCell className="text-right tabular-nums">
                        {r.total.toLocaleString()}
                      </TableCell>
                      <TableCell className="text-right tabular-nums">{r.errors}</TableCell>
                      <TableCell className={`text-right tabular-nums ${errorRateColor(r.error_rate)}`}>
                        {r.error_rate}
                      </TableCell>
                      <TableCell className={`text-right tabular-nums ${latencyColor(r.p50)}`}>
                        {r.p50}s
                      </TableCell>
                      <TableCell className={`text-right tabular-nums ${latencyColor(r.p95)}`}>
                        {r.p95}s
                      </TableCell>
                      <TableCell className={`text-right tabular-nums ${latencyColor(r.p99)}`}>
                        {r.p99}s
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Background Tasks — Seat Monitor */}
      {bgTasks && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Radar className="h-5 w-5" />
              后台任务 · 考位监控
              <Badge variant="outline" className="ml-2 font-normal">
                每 {bgTasks.seat_monitor.interval_seconds / 60} 分钟
              </Badge>
              <span className="ml-auto text-sm font-normal text-muted-foreground">
                累计 {bgTasks.seat_monitor.total_snapshots} 次抓取 · {bgTasks.seat_monitor.total_watches} 个订阅
              </span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>城市</TableHead>
                    <TableHead>状态</TableHead>
                    <TableHead>上次检查</TableHead>
                    <TableHead className="text-right">耗时</TableHead>
                    <TableHead className="text-right">可用日期</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {bgTasks.seat_monitor.cities.map((c) => {
                    const ago = c.last_check
                      ? `${Math.round((Date.now() - new Date(c.last_check).getTime()) / 60000)} 分钟前`
                      : "-";
                    return (
                      <TableRow key={c.city_code}>
                        <TableCell className="font-medium">{c.city_name}</TableCell>
                        <TableCell>
                          <Badge variant={c.status === "success" ? "default" : "destructive"}>
                            {c.status}
                          </Badge>
                          {c.error && <span className="ml-2 text-xs text-red-500">{c.error}</span>}
                        </TableCell>
                        <TableCell>{ago}</TableCell>
                        <TableCell className="text-right tabular-nums">
                          {c.duration_ms != null ? `${c.duration_ms}ms` : "-"}
                        </TableCell>
                        <TableCell className="text-right">
                          {c.available_dates.length > 0 ? (
                            <span className="font-medium text-green-600">{c.available_dates.length} 个</span>
                          ) : (
                            <span className="text-muted-foreground">无</span>
                          )}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
