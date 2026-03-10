"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { fetchTraffic } from "@/lib/api/admin";
import type { TrafficData } from "@/lib/api/types";
import { Globe, Eye, Users, TrendingUp } from "lucide-react";
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  return `${(bytes / (1024 * 1024 * 1024)).toFixed(2)} GB`;
}

export function TrafficOverview() {
  const [data, setData] = useState<TrafficData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchTraffic(30)
      .then(setData)
      .catch(() => setData(null))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-medium">网站流量</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">加载中...</p>
        </CardContent>
      </Card>
    );
  }

  if (!data || data.error || !data.days.length) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-medium">网站流量</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            {data?.error === "Cloudflare credentials not configured"
              ? "未配置 Cloudflare API — 请设置 CF_API_TOKEN 和 CF_ZONE_ID 环境变量"
              : data?.error || "暂无流量数据"}
          </p>
        </CardContent>
      </Card>
    );
  }

  const today = data.today;
  const days = data.days;

  // Aggregate totals for the period
  const totalVisitors = days.reduce((s, d) => s + d.unique_visitors, 0);
  const totalRequests = days.reduce((s, d) => s + d.requests, 0);
  const totalPageViews = days.reduce((s, d) => s + d.page_views, 0);
  const totalBytes = days.reduce((s, d) => s + d.bytes, 0);

  // 7-day average
  const last7 = days.slice(-7);
  const avg7Visitors = last7.length
    ? Math.round(last7.reduce((s, d) => s + d.unique_visitors, 0) / last7.length)
    : 0;

  const summaryCards = [
    {
      label: "今日访客",
      value: today?.unique_visitors?.toLocaleString() ?? "—",
      icon: Users,
      color: "text-blue-600",
    },
    {
      label: "今日请求",
      value: today?.requests?.toLocaleString() ?? "—",
      icon: Globe,
      color: "text-emerald-600",
    },
    {
      label: "7天日均访客",
      value: avg7Visitors.toLocaleString(),
      icon: TrendingUp,
      color: "text-violet-600",
    },
    {
      label: "30天总流量",
      value: formatBytes(totalBytes),
      icon: Eye,
      color: "text-orange-600",
    },
  ];

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-semibold">网站流量 (Cloudflare)</h2>

      {/* Summary cards */}
      <div className="grid gap-3 grid-cols-2 lg:grid-cols-4">
        {summaryCards.map((c) => (
          <Card key={c.label}>
            <CardContent className="flex items-center gap-3 p-4">
              <c.icon className={`h-5 w-5 ${c.color} shrink-0`} />
              <div>
                <p className="text-xs text-muted-foreground">{c.label}</p>
                <p className="text-lg font-bold">{c.value}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Charts */}
      <div className="grid gap-4 lg:grid-cols-2">
        {/* Unique Visitors trend */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">
              独立访客 (30天) — 共 {totalVisitors.toLocaleString()}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[220px]">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={days}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis
                    dataKey="date"
                    tick={{ fontSize: 11 }}
                    tickFormatter={(v: string) => v.slice(5)}
                  />
                  <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
                  <Tooltip
                    labelFormatter={(v) => String(v)}
                    formatter={(value) => [value ?? 0, "访客"]}
                  />
                  <Area
                    type="monotone"
                    dataKey="unique_visitors"
                    stroke="#6366f1"
                    fill="#6366f1"
                    fillOpacity={0.15}
                    name="访客"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Requests trend */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">
              请求数 (30天) — 共 {totalRequests.toLocaleString()}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[220px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={days}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis
                    dataKey="date"
                    tick={{ fontSize: 11 }}
                    tickFormatter={(v: string) => v.slice(5)}
                  />
                  <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
                  <Tooltip
                    labelFormatter={(v) => String(v)}
                    formatter={(value) => [value ?? 0, "请求"]}
                  />
                  <Bar dataKey="requests" fill="#10b981" fillOpacity={0.7} name="请求" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Page Views */}
      {totalPageViews > 0 && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">
              页面浏览量 (30天) — 共 {totalPageViews.toLocaleString()}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[200px]">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={days}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis
                    dataKey="date"
                    tick={{ fontSize: 11 }}
                    tickFormatter={(v: string) => v.slice(5)}
                  />
                  <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
                  <Tooltip
                    labelFormatter={(v) => String(v)}
                    formatter={(value) => [value ?? 0, "PV"]}
                  />
                  <Area
                    type="monotone"
                    dataKey="page_views"
                    stroke="#f59e0b"
                    fill="#f59e0b"
                    fillOpacity={0.15}
                    name="PV"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
