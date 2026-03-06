"use client";

import { useState, useEffect } from "react";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { LoadingSpinner } from "@/components/shared/loading-spinner";
import { fetchAnalyticsOverview } from "@/lib/api/admin";
import type { AnalyticsOverview } from "@/lib/api/types";
import { BarChart3, Target, Users, Zap, TrendingUp } from "lucide-react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

const MODE_LABELS: Record<string, { label: string; icon: typeof BarChart3; color: string }> = {
  practice: { label: "练习", icon: BarChart3, color: "text-blue-600" },
  exam: { label: "考试", icon: Target, color: "text-green-600" },
  speed_drill: { label: "极速刷题", icon: Zap, color: "text-orange-500" },
};

const TYPE_COLORS: Record<string, string> = {
  listening: "text-purple-600",
  reading: "text-blue-600",
  speaking: "text-green-600",
  writing: "text-orange-600",
};

const TYPE_LABELS: Record<string, string> = {
  listening: "听力",
  reading: "阅读",
  speaking: "口语",
  writing: "写作",
};

export function OverviewCharts() {
  const [data, setData] = useState<AnalyticsOverview | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAnalyticsOverview()
      .then(setData)
      .catch((e) => toast.error(e.message || "加载失败"))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <LoadingSpinner />;
  if (!data) return null;

  return (
    <div className="space-y-6">
      {/* User Growth Trend */}
      {data.user_growth?.length > 0 && (
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-base">用户增长趋势</CardTitle>
            <TrendingUp className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={data.user_growth}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis
                    dataKey="date"
                    tick={{ fontSize: 11 }}
                    tickFormatter={(v: string) => v.slice(5)}
                  />
                  <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
                  <Tooltip
                    labelFormatter={(v) => String(v)}
                    formatter={(value) => [value ?? 0, "总用户数"]}
                  />
                  <Area
                    type="monotone"
                    dataKey="total"
                    stroke="hsl(142 71% 45%)"
                    fill="hsl(142 71% 45%)"
                    fillOpacity={0.15}
                    name="总用户数"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Mode Distribution */}
      <div>
        <h3 className="text-sm font-medium text-muted-foreground mb-3">模式分布 (30天)</h3>
        <div className="grid gap-4 md:grid-cols-3">
          {Object.entries(data.by_mode).map(([mode, count]) => {
            const meta = MODE_LABELS[mode] || { label: mode, icon: BarChart3, color: "text-muted-foreground" };
            const Icon = meta.icon;
            return (
              <Card key={mode}>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">{meta.label}</CardTitle>
                  <Icon className={`h-4 w-4 ${meta.color}`} />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{count.toLocaleString()}</div>
                  <p className="text-xs text-muted-foreground">次尝试</p>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>

      {/* Average Score by Type */}
      {Object.keys(data.avg_score_by_type).length > 0 && (
        <div>
          <h3 className="text-sm font-medium text-muted-foreground mb-3">各类型平均分</h3>
          <div className="grid gap-4 md:grid-cols-4">
            {Object.entries(data.avg_score_by_type).map(([type, info]) => (
              <Card key={type}>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">{TYPE_LABELS[type] || type}</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className={`text-2xl font-bold ${TYPE_COLORS[type] || ""}`}>
                    {info.avg_score.toFixed(1)}%
                  </div>
                  <p className="text-xs text-muted-foreground">
                    来自 {info.count.toLocaleString()} 次尝试
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Daily New Users (30d) */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-base">每日新注册 (30天)</CardTitle>
          <Users className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          {data.new_users.length === 0 ? (
            <p className="text-sm text-muted-foreground">暂无数据</p>
          ) : (
            <div className="h-[200px]">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={data.new_users}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis
                    dataKey="date"
                    tick={{ fontSize: 11 }}
                    tickFormatter={(v: string) => v.slice(5)}
                  />
                  <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
                  <Tooltip labelFormatter={(v) => String(v)} />
                  <Area
                    type="monotone"
                    dataKey="count"
                    stroke="hsl(var(--primary))"
                    fill="hsl(var(--primary))"
                    fillOpacity={0.15}
                    name="注册数"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Daily Attempts + DAU side by side */}
      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">每日练习次数 (30天)</CardTitle>
          </CardHeader>
          <CardContent>
            {data.daily_attempts.length === 0 ? (
              <p className="text-sm text-muted-foreground">暂无数据</p>
            ) : (
              <div className="h-[200px]">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={data.daily_attempts}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                    <XAxis
                      dataKey="date"
                      tick={{ fontSize: 11 }}
                      tickFormatter={(v: string) => v.slice(5)}
                    />
                    <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
                    <Tooltip labelFormatter={(v) => String(v)} />
                    <Area
                      type="monotone"
                      dataKey="count"
                      stroke="hsl(var(--primary))"
                      fill="hsl(var(--primary))"
                      fillOpacity={0.15}
                      name="次数"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-base">日活跃用户 (30天)</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {data.dau.length === 0 ? (
              <p className="text-sm text-muted-foreground">暂无数据</p>
            ) : (
              <div className="h-[200px]">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={data.dau}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                    <XAxis
                      dataKey="date"
                      tick={{ fontSize: 11 }}
                      tickFormatter={(v: string) => v.slice(5)}
                    />
                    <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
                    <Tooltip labelFormatter={(v) => String(v)} />
                    <Area
                      type="monotone"
                      dataKey="dau"
                      stroke="hsl(142 71% 45%)"
                      fill="hsl(142 71% 45%)"
                      fillOpacity={0.15}
                      name="DAU"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
