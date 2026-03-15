"use client";

import { useState, useEffect } from "react";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { LoadingSpinner } from "@/components/shared/loading-spinner";
import { UserGeoMap } from "@/components/dashboard/user-geo-map";
import { fetchAnalyticsOverview } from "@/lib/api/admin";
import type { AnalyticsOverview } from "@/lib/api/types";
import {
  BarChart3,
  Target,
  Users,
  Zap,
  TrendingUp,
  UserPlus,
  Activity,
} from "lucide-react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

const MODE_META: Record<string, { label: string; icon: typeof BarChart3; color: string; bg: string }> = {
  practice: { label: "练习", icon: BarChart3, color: "text-blue-600", bg: "bg-blue-50 dark:bg-blue-950/40" },
  exam: { label: "考试", icon: Target, color: "text-emerald-600", bg: "bg-emerald-50 dark:bg-emerald-950/40" },
  speed_drill: { label: "极速刷题", icon: Zap, color: "text-orange-500", bg: "bg-orange-50 dark:bg-orange-950/40" },
};

const TYPE_COLORS: Record<string, string> = {
  listening: "text-purple-600",
  reading: "text-blue-600",
  speaking: "text-emerald-600",
  writing: "text-orange-600",
};

const TYPE_LABELS: Record<string, string> = {
  listening: "听力",
  reading: "阅读",
  speaking: "口语",
  writing: "写作",
};

const TYPE_BG: Record<string, string> = {
  listening: "bg-purple-50 dark:bg-purple-950/40",
  reading: "bg-blue-50 dark:bg-blue-950/40",
  speaking: "bg-emerald-50 dark:bg-emerald-950/40",
  writing: "bg-orange-50 dark:bg-orange-950/40",
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

  // Compute KPIs
  const latestTotal = data.user_growth?.length > 0 ? data.user_growth[data.user_growth.length - 1].total : 0;
  const todayNewUsers = data.new_users?.length > 0 ? data.new_users[data.new_users.length - 1].count : 0;
  const todayDAU = data.dau?.length > 0 ? data.dau[data.dau.length - 1].dau : 0;
  const totalAttempts30d = data.daily_attempts?.reduce((s, d) => s + d.count, 0) || 0;

  const kpis = [
    { label: "总用户", value: latestTotal.toLocaleString(), icon: Users, color: "text-blue-600", bg: "bg-blue-50 dark:bg-blue-950/40" },
    { label: "今日新增", value: todayNewUsers.toLocaleString(), icon: UserPlus, color: "text-emerald-600", bg: "bg-emerald-50 dark:bg-emerald-950/40" },
    { label: "今日活跃", value: todayDAU.toLocaleString(), icon: Activity, color: "text-purple-600", bg: "bg-purple-50 dark:bg-purple-950/40" },
    { label: "30 天答题", value: totalAttempts30d.toLocaleString(), icon: TrendingUp, color: "text-orange-600", bg: "bg-orange-50 dark:bg-orange-950/40" },
  ];

  return (
    <div className="space-y-6">
      {/* KPI Cards */}
      <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
        {kpis.map((kpi) => (
          <Card key={kpi.label}>
            <CardContent className="flex items-center gap-4 pt-6">
              <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${kpi.bg}`}>
                <kpi.icon className={`h-5 w-5 ${kpi.color}`} />
              </div>
              <div>
                <p className="text-2xl font-bold tracking-tight">{kpi.value}</p>
                <p className="text-xs text-muted-foreground">{kpi.label}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* User Growth + Geo Map side by side */}
      <div className="grid gap-4 lg:grid-cols-5">
        {/* Growth chart — 3/5 width */}
        {data.user_growth?.length > 0 && (
          <Card className="lg:col-span-3">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-base">用户增长趋势</CardTitle>
              <TrendingUp className="h-4 w-4 text-emerald-600" />
            </CardHeader>
            <CardContent>
              <div className="h-[280px]">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={data.user_growth}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                    <XAxis dataKey="date" tick={{ fontSize: 11 }} tickFormatter={(v: string) => v.slice(5)} />
                    <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
                    <Tooltip labelFormatter={(v) => String(v)} formatter={(value) => [value ?? 0, "总用户数"]} />
                    <Area type="monotone" dataKey="total" stroke="hsl(142 71% 45%)" fill="hsl(142 71% 45%)" fillOpacity={0.15} name="总用户数" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        )}
        {/* Geo map — 2/5 width */}
        <div className="lg:col-span-2">
          <UserGeoMap />
        </div>
      </div>

      {/* Mode Distribution + Avg Score */}
      <div className="grid gap-4 lg:grid-cols-2">
        {/* Mode distribution */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">模式分布 (30天)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-3 grid-cols-3">
              {Object.entries(data.by_mode).map(([mode, count]) => {
                const meta = MODE_META[mode] || { label: mode, icon: BarChart3, color: "text-muted-foreground", bg: "bg-muted" };
                const Icon = meta.icon;
                return (
                  <div key={mode} className="flex flex-col items-center gap-1.5 rounded-lg border p-3">
                    <div className={`flex h-9 w-9 items-center justify-center rounded-lg ${meta.bg}`}>
                      <Icon className={`h-4 w-4 ${meta.color}`} />
                    </div>
                    <span className="text-xl font-bold">{count.toLocaleString()}</span>
                    <span className="text-xs text-muted-foreground">{meta.label}</span>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Avg score by type */}
        {Object.keys(data.avg_score_by_type).length > 0 && (
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">各类型平均分</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-3 grid-cols-2">
                {Object.entries(data.avg_score_by_type).map(([type, info]) => (
                  <div key={type} className="flex items-center gap-3 rounded-lg border p-3">
                    <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${TYPE_BG[type] || "bg-muted"}`}>
                      <span className={`text-sm font-bold ${TYPE_COLORS[type] || ""}`}>
                        {info.avg_score.toFixed(0)}%
                      </span>
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-medium">{TYPE_LABELS[type] || type}</p>
                      <p className="text-xs text-muted-foreground">{info.count.toLocaleString()} 次</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Daily metrics: New Users + Attempts + DAU */}
      <div className="grid gap-4 lg:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">每日新注册 (30天)</CardTitle>
            <UserPlus className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {data.new_users.length === 0 ? (
              <p className="text-sm text-muted-foreground">暂无数据</p>
            ) : (
              <div className="h-[160px]">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={data.new_users}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                    <XAxis dataKey="date" tick={{ fontSize: 10 }} tickFormatter={(v: string) => v.slice(5)} />
                    <YAxis tick={{ fontSize: 10 }} allowDecimals={false} width={28} />
                    <Tooltip labelFormatter={(v) => String(v)} />
                    <Area type="monotone" dataKey="count" stroke="hsl(var(--primary))" fill="hsl(var(--primary))" fillOpacity={0.15} name="注册数" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">每日做题 (30天)</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {data.daily_attempts.length === 0 ? (
              <p className="text-sm text-muted-foreground">暂无数据</p>
            ) : (
              <div className="h-[160px]">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={data.daily_attempts}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                    <XAxis dataKey="date" tick={{ fontSize: 10 }} tickFormatter={(v: string) => v.slice(5)} />
                    <YAxis tick={{ fontSize: 10 }} allowDecimals={false} width={28} />
                    <Tooltip labelFormatter={(v) => String(v)} />
                    <Area type="monotone" dataKey="count" stroke="hsl(var(--primary))" fill="hsl(var(--primary))" fillOpacity={0.15} name="次数" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">日活 DAU (30天)</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {data.dau.length === 0 ? (
              <p className="text-sm text-muted-foreground">暂无数据</p>
            ) : (
              <div className="h-[160px]">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={data.dau}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                    <XAxis dataKey="date" tick={{ fontSize: 10 }} tickFormatter={(v: string) => v.slice(5)} />
                    <YAxis tick={{ fontSize: 10 }} allowDecimals={false} width={28} />
                    <Tooltip labelFormatter={(v) => String(v)} />
                    <Area type="monotone" dataKey="dau" stroke="hsl(142 71% 45%)" fill="hsl(142 71% 45%)" fillOpacity={0.15} name="DAU" />
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
