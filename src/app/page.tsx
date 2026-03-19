"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { PageHeader } from "@/components/shared/page-header";
import { LoadingSpinner } from "@/components/shared/loading-spinner";
import { fetchAdminStats, fetchAuditLogs, fetchBatchStatus, fetchAnalyticsOverview } from "@/lib/api/admin";
import type { AdminStats, AuditLogItem, BatchStatus, PaginatedResponse, AnalyticsOverview } from "@/lib/api/types";
import { Users, CreditCard, BookOpen, FileText, BarChart3, AlertTriangle, ListChecks, Volume2, Lightbulb, AlertCircle, ArrowRight, Shield, Loader2, Mic, BookMarked, ExternalLink, Search, Layers, type LucideIcon } from "lucide-react";
import { AreaChart, Area, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { UserGeoMap } from "@/components/dashboard/user-geo-map";
import { CostOverview } from "@/components/dashboard/cost-overview";
import { TrafficOverview } from "@/components/dashboard/traffic-overview";

interface StatCard {
  label: string;
  value: number;
  icon: LucideIcon;
  iconColor: string;
  bgColor: string;
  borderColor: string;
}

export default function DashboardPage() {
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [analytics, setAnalytics] = useState<AnalyticsOverview | null>(null);
  const [recentActions, setRecentActions] = useState<AuditLogItem[]>([]);
  const [batchStatus, setBatchStatus] = useState<BatchStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [data, logs, batch, analyticsData] = await Promise.all([
        fetchAdminStats(),
        fetchAuditLogs({ page_size: 5 }).catch(() => ({ items: [] })),
        fetchBatchStatus().catch(() => null),
        fetchAnalyticsOverview().catch(() => null),
      ]);
      setStats(data);
      setRecentActions((logs as PaginatedResponse<AuditLogItem>).items || []);
      setBatchStatus(batch);
      setAnalytics(analyticsData);
    } catch (err) {
      setError(err instanceof Error ? err.message : "加载失败");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <LoadingSpinner />
      </div>
    );
  }

  if (error || !stats) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <AlertCircle className="mb-4 h-12 w-12 text-destructive" />
        <h3 className="text-lg font-medium">加载失败</h3>
        <p className="mt-1 text-sm text-muted-foreground">
          {error || "无法加载统计数据"}
        </p>
        <Button className="mt-6" onClick={load}>
          重试
        </Button>
      </div>
    );
  }

  const overviewCards: StatCard[] = [
    { label: "总用户", value: stats.user_count ?? 0, icon: Users, iconColor: "text-blue-600", bgColor: "bg-blue-50 dark:bg-blue-950", borderColor: "border-l-blue-500" },
    { label: "活跃订阅", value: stats.active_subscription_count ?? 0, icon: CreditCard, iconColor: "text-emerald-600", bgColor: "bg-emerald-50 dark:bg-emerald-950", borderColor: "border-l-emerald-500" },
    { label: "题库套数", value: stats.test_set_count ?? 0, icon: BookOpen, iconColor: "text-violet-600", bgColor: "bg-violet-50 dark:bg-violet-950", borderColor: "border-l-violet-500" },
    { label: "题目总数", value: stats.question_count ?? 0, icon: FileText, iconColor: "text-orange-600", bgColor: "bg-orange-50 dark:bg-orange-950", borderColor: "border-l-orange-500" },
    { label: "总答题数", value: stats.answer_count ?? 0, icon: BarChart3, iconColor: "text-cyan-600", bgColor: "bg-cyan-50 dark:bg-cyan-950", borderColor: "border-l-cyan-500" },
    { label: "口语练习", value: stats.speaking_attempt_count ?? 0, icon: Mic, iconColor: "text-pink-600", bgColor: "bg-pink-50 dark:bg-pink-950", borderColor: "border-l-pink-500" },
    { label: "收藏单词", value: stats.saved_word_count ?? 0, icon: BookMarked, iconColor: "text-amber-600", bgColor: "bg-amber-50 dark:bg-amber-950", borderColor: "border-l-amber-500" },
    { label: "你好法语词汇", value: stats.nihao_word_count ?? 0, icon: BookOpen, iconColor: "text-teal-600", bgColor: "bg-teal-50 dark:bg-teal-950", borderColor: "border-l-teal-500" },
    { label: "单词查询次数", value: stats.word_lookup_count ?? 0, icon: Search, iconColor: "text-indigo-600", bgColor: "bg-indigo-50 dark:bg-indigo-950", borderColor: "border-l-indigo-500" },
    { label: "单词卡片数量", value: stats.vocabulary_card_count ?? 0, icon: Layers, iconColor: "text-rose-600", bgColor: "bg-rose-50 dark:bg-rose-950", borderColor: "border-l-rose-500" },
  ];

  const qualityCards = [
    { label: "缺答案", value: stats.questions_without_answer ?? 0, base: stats.listening_reading_count ?? 0, scope: "听力+阅读", icon: AlertTriangle, iconColor: "text-amber-600", bgColor: "bg-amber-50 dark:bg-amber-950", href: "/questions" },
    { label: "缺选项", value: stats.questions_without_options ?? 0, base: stats.listening_reading_count ?? 0, scope: "听力+阅读", icon: ListChecks, iconColor: "text-red-600", bgColor: "bg-red-50 dark:bg-red-950", href: "/questions" },
    { label: "缺音频", value: stats.questions_without_audio ?? 0, base: stats.listening_count ?? 0, scope: "听力", icon: Volume2, iconColor: "text-orange-600", bgColor: "bg-orange-50 dark:bg-orange-950", href: "/audio-review" },
    { label: "有解析", value: stats.questions_with_explanation ?? 0, base: stats.listening_reading_count ?? 0, scope: "听力+阅读", icon: Lightbulb, iconColor: "text-green-600", bgColor: "bg-green-50 dark:bg-green-950", href: "/explanations" },
  ];

  const PIE_COLORS = ["#6366f1", "#f59e0b", "#10b981", "#ef4444"];

  return (
    <div className="space-y-6">
      <PageHeader title="仪表盘" description="平台数据总览" />

      {/* Overview Stats */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {overviewCards.map((c) => (
          <Card key={c.label} className={`border-l-4 ${c.borderColor} ${c.bgColor}`}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{c.label}</CardTitle>
              <c.icon className={`h-5 w-5 ${c.iconColor}`} />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{c.value.toLocaleString()}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* User Geo Map */}
      <UserGeoMap />

      {/* Website Traffic */}
      <TrafficOverview />

      {/* Charts */}
      {analytics && (
        <div className="space-y-4">
          {/* User Growth Trend */}
          {analytics.user_growth?.length > 0 && (
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">用户增长趋势</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-[280px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={analytics.user_growth}>
                      <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                      <XAxis dataKey="date" tick={{ fontSize: 11 }} tickFormatter={(v: string) => v.slice(5)} />
                      <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
                      <Tooltip labelFormatter={(v) => String(v)} formatter={(value) => [value ?? 0, "总用户数"]} />
                      <Area type="monotone" dataKey="total" stroke="#10b981" fill="#10b981" fillOpacity={0.15} name="总用户数" />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          )}

          <div className="grid gap-4 lg:grid-cols-3">
            {/* New User Registrations */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">每日新注册 (30天)</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-[200px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={analytics.new_users}>
                      <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                      <XAxis dataKey="date" tick={{ fontSize: 11 }} tickFormatter={(v: string) => v.slice(5)} />
                      <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
                      <Tooltip labelFormatter={(v) => String(v)} />
                      <Area type="monotone" dataKey="count" stroke="#6366f1" fill="#6366f1" fillOpacity={0.15} name="注册数" />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            {/* Daily Active Users */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">日活跃用户 (30天)</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-[200px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={analytics.dau}>
                      <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                      <XAxis dataKey="date" tick={{ fontSize: 11 }} tickFormatter={(v: string) => v.slice(5)} />
                      <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
                      <Tooltip labelFormatter={(v) => String(v)} />
                      <Area type="monotone" dataKey="dau" stroke="#f59e0b" fill="#f59e0b" fillOpacity={0.15} name="DAU" />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            {/* Practice vs Exam */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">练习 vs 考试 (30天)</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-[200px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={Object.entries(analytics.by_mode).map(([name, value]) => ({
                          name: name === "practice" ? "练习" : name === "exam" ? "考试" : name,
                          value,
                        }))}
                        cx="50%" cy="50%" innerRadius={50} outerRadius={75}
                        dataKey="value" nameKey="name"
                        label={({ name, percent }) => `${name ?? ""} ${((percent ?? 0) * 100).toFixed(0)}%`}
                      >
                        {Object.keys(analytics.by_mode).map((_, i) => (
                          <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Data Quality */}
        <div>
          <h2 className="mb-3 text-lg font-semibold">数据质量</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            {qualityCards.map((c) => (
              <Link key={c.label} href={c.href}>
                <Card className={`transition-colors hover:bg-accent/50 ${c.bgColor}`}>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">{c.label}</CardTitle>
                    <c.icon className={`h-4 w-4 ${c.iconColor}`} />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{c.value.toLocaleString()}</div>
                    <p className="text-xs text-muted-foreground">
                      共 {c.base.toLocaleString()} 题 ({c.scope})
                    </p>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        </div>

        {/* Right column */}
        <div className="space-y-4">
          {/* Batch Generation Status */}
          {batchStatus && batchStatus.total > 0 && (
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">批量生成</CardTitle>
                {batchStatus.running && <Loader2 className="h-4 w-4 animate-spin text-primary" />}
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between text-sm mb-2">
                  <span>{batchStatus.running ? "进行中" : "已完成"}</span>
                  <span className="text-muted-foreground">
                    {batchStatus.completed + batchStatus.failed} / {batchStatus.total}
                  </span>
                </div>
                <div className="h-2 rounded-full bg-muted">
                  <div
                    className="h-2 rounded-full bg-primary transition-all"
                    style={{ width: `${batchStatus.total > 0 ? ((batchStatus.completed + batchStatus.failed) / batchStatus.total) * 100 : 0}%` }}
                  />
                </div>
                {batchStatus.failed > 0 && (
                  <p className="text-xs text-red-600 mt-1">{batchStatus.failed} 个失败</p>
                )}
              </CardContent>
            </Card>
          )}

          {/* Recent Actions */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">最近操作</CardTitle>
              <Link href="/audit">
                <Button variant="ghost" size="sm">
                  查看全部 <ArrowRight className="ml-1 h-3 w-3" />
                </Button>
              </Link>
            </CardHeader>
            <CardContent>
              {recentActions.length === 0 ? (
                <p className="text-sm text-muted-foreground">暂无操作记录</p>
              ) : (
                <div className="space-y-3">
                  {recentActions.map((log) => (
                    <div key={log.id} className="flex items-center justify-between text-sm">
                      <div className="flex items-center gap-2 min-w-0">
                        <Shield className="h-3 w-3 text-muted-foreground shrink-0" />
                        <span className="font-mono text-xs truncate">{log.action}</span>
                        <Badge variant="outline" className="text-[10px] shrink-0">{log.target_type}</Badge>
                      </div>
                      <span className="text-xs text-muted-foreground shrink-0 ml-2">
                        {new Date(log.created_at).toLocaleDateString("zh-CN")}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Quick Links */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium">快捷入口</CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-2 gap-2">
              <Link href="/audio-review">
                <Button variant="outline" size="sm" className="w-full justify-start">
                  <Volume2 className="mr-2 h-3 w-3 text-orange-500" />
                  音频审核
                </Button>
              </Link>
              <Link href="/explanations">
                <Button variant="outline" size="sm" className="w-full justify-start">
                  <Lightbulb className="mr-2 h-3 w-3 text-amber-500" />
                  {((stats.listening_reading_count ?? 0) - (stats.questions_with_explanation ?? 0))} 题缺解析
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Cost Overview */}
      <CostOverview />

      {/* External Services */}
      <div>
        <h2 className="mb-3 text-lg font-semibold">外部服务</h2>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {[
            { name: "MongoDB Atlas", desc: "数据库集群", url: "https://cloud.mongodb.com", color: "bg-green-600" },
            { name: "Azure Portal", desc: "Web Apps / Speech / Blob", url: "https://portal.azure.com", color: "bg-blue-600" },
            { name: "Stripe", desc: "支付 & 订阅", url: "https://dashboard.stripe.com", color: "bg-purple-600" },
            { name: "Cloudflare", desc: "DNS / Access / CDN", url: "https://dash.cloudflare.com", color: "bg-orange-500" },
            { name: "GitHub", desc: "代码 & CI/CD", url: "https://github.com", color: "bg-gray-800" },
            { name: "Resend", desc: "邮件服务", url: "https://resend.com/emails", color: "bg-gray-700" },
            { name: "xAI Console", desc: "Grok API (口语AI)", url: "https://console.x.ai", color: "bg-gray-900" },
            { name: "Google Search Console", desc: "SEO & 索引", url: "https://search.google.com/search-console?resource_id=sc-domain%3Ahitcf.com", color: "bg-blue-500" },
            { name: "Bing Webmaster", desc: "SEO & 索引", url: "https://www.bing.com/webmasters?siteUrl=https%3A%2F%2Fhitcf.com", color: "bg-teal-600" },
            { name: "HiTCF Prod", desc: "hitcf.com (线上)", url: "https://hitcf.com", color: "bg-indigo-600" },
          ].map((s) => (
            <a key={s.name} href={s.url} target="_blank" rel="noopener noreferrer">
              <Card className="transition-colors hover:bg-accent/50">
                <CardContent className="flex items-center gap-3 p-4">
                  <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-md text-white text-xs font-bold ${s.color}`}>
                    {s.name.charAt(0)}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5">
                      <span className="text-sm font-medium">{s.name}</span>
                      <ExternalLink className="h-3 w-3 text-muted-foreground" />
                    </div>
                    <p className="text-xs text-muted-foreground truncate">{s.desc}</p>
                  </div>
                </CardContent>
              </Card>
            </a>
          ))}
        </div>
      </div>
    </div>
  );
}
