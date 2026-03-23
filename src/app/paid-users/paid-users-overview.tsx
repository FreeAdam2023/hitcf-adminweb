"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { LoadingSpinner } from "@/components/shared/loading-spinner";
import { fetchSubscriptionRevenue, fetchSubscriptions, fetchUserDetail, fetchLTV } from "@/lib/api/admin";
import type { SubscriptionRevenue, UserDetail, LTVData } from "@/lib/api/types";
import { Globe, Languages, Link2, Clock } from "lucide-react";
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from "recharts";

const PLAN_COLORS: Record<string, string> = {
  monthly: "#6366f1",
  quarterly: "#8b5cf6",
  yearly: "#a855f7",
  tester: "#6b7280",
  referral: "#f59e0b",
};

const PLAN_LABELS: Record<string, string> = {
  monthly: "月付",
  quarterly: "季付",
  yearly: "年付",
  tester: "测试",
  referral: "推荐",
};

export function PaidUsersOverview() {
  const [revenue, setRevenue] = useState<SubscriptionRevenue | null>(null);
  const [users, setUsers] = useState<UserDetail[]>([]);
  const [ltv, setLtv] = useState<LTVData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const [rev, subs, ltvData] = await Promise.all([
          fetchSubscriptionRevenue(),
          fetchSubscriptions({ status: "active", page_size: 100 }).then(async (res) => {
            // Also fetch trialing
            const trialing = await fetchSubscriptions({ status: "trialing", page_size: 100 });
            return [...res.items, ...trialing.items];
          }),
          fetchLTV().catch(() => null),
        ]);
        setRevenue(rev);
        setLtv(ltvData);

        // Fetch detail for each subscriber (parallel)
        const details = await Promise.all(
          subs
            .filter(s => s.plan !== "tester" && !s.cancel_at_period_end)
            .map(s => fetchUserDetail(s.user_id).catch(() => null))
        );
        setUsers(details.filter((d): d is UserDetail => d !== null));
      } catch {
        // ignore
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  if (loading) return <div className="flex h-40 items-center justify-center"><LoadingSpinner /></div>;

  // Aggregate persona data
  const countries: Record<string, number> = {};
  const languages: Record<string, number> = {};
  const sources: Record<string, number> = {};
  let totalDaysToSubscribe = 0;
  let countWithSub = 0;

  for (const u of users) {
    const country = u.tracking?.signup_country || "未知";
    countries[country] = (countries[country] || 0) + 1;

    // Language from detail isn't directly available, use tracking data as proxy
    const lang = u.tracking?.signup_referer?.includes("/fr") ? "fr"
      : u.tracking?.signup_referer?.includes("/ar") ? "ar"
      : u.tracking?.signup_referer?.includes("/en") ? "en"
      : "zh";
    languages[lang] = (languages[lang] || 0) + 1;

    const src = u.tracking?.signup_utm_source
      || (u.tracking?.signup_referer ? new URL(u.tracking.signup_referer).hostname : null)
      || "direct";
    sources[src] = (sources[src] || 0) + 1;

    if (u.subscription && u.created_at) {
      const regDate = new Date(u.created_at);
      // Approximate subscription start from created_at (trial starts at registration)
      const now = new Date();
      const daysSinceReg = Math.floor((now.getTime() - regDate.getTime()) / 86400000);
      totalDaysToSubscribe += daysSinceReg;
      countWithSub++;
    }
  }

  const avgDays = countWithSub > 0 ? Math.round(totalDaysToSubscribe / countWithSub) : 0;

  // Plan distribution for pie chart
  const planData = revenue
    ? Object.entries(revenue.by_plan)
        .filter(([, count]) => count > 0)
        .map(([plan, count]) => ({ name: PLAN_LABELS[plan] || plan, value: count, fill: PLAN_COLORS[plan] || "#6b7280" }))
    : [];

  const LANG_LABELS: Record<string, string> = { zh: "中文", en: "English", fr: "Français", ar: "العربية" };

  const sortedCountries = Object.entries(countries).sort((a, b) => b[1] - a[1]);
  const sortedSources = Object.entries(sources).sort((a, b) => b[1] - a[1]);
  const sortedLangs = Object.entries(languages).sort((a, b) => b[1] - a[1]);

  return (
    <div className="space-y-6">
      {/* MRR Hero */}
      {revenue && (
        <Card className="overflow-hidden border-0 shadow-lg">
          <div className="bg-gradient-to-r from-indigo-600 to-purple-600 p-6">
            <div className="grid grid-cols-3 gap-6 text-center text-white">
              <div>
                <div className="text-3xl font-bold">${revenue.estimated_mrr.toFixed(0)}</div>
                <div className="text-sm opacity-80">月度经常性收入 (MRR)</div>
              </div>
              <div>
                <div className="text-3xl font-bold">{revenue.total_active}</div>
                <div className="text-sm opacity-80">活跃订阅</div>
              </div>
              <div>
                <div className="text-3xl font-bold">{revenue.total_trialing}</div>
                <div className="text-sm opacity-80">试用中</div>
              </div>
            </div>
          </div>
        </Card>
      )}

      <div className="grid gap-6 md:grid-cols-2">
        {/* Plan Distribution */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">方案分布</CardTitle>
          </CardHeader>
          <CardContent>
            {planData.length > 0 ? (
              <div className="flex items-center gap-6">
                <ResponsiveContainer width={120} height={120}>
                  <PieChart>
                    <Pie data={planData} dataKey="value" cx="50%" cy="50%" outerRadius={55} strokeWidth={2}>
                      {planData.map((entry, i) => (
                        <Cell key={i} fill={entry.fill} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
                <div className="space-y-2">
                  {planData.map(p => (
                    <div key={p.name} className="flex items-center gap-2 text-sm">
                      <div className="h-3 w-3 rounded-full" style={{ backgroundColor: p.fill }} />
                      <span>{p.name}</span>
                      <span className="font-bold">{p.value}</span>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">暂无数据</p>
            )}
          </CardContent>
        </Card>

        {/* LTV Summary */}
        {ltv && (
          <Card>
            <CardHeader>
              <CardTitle className="text-base">生命周期价值 (LTV)</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">预估 LTV</span>
                <span className="text-xl font-bold text-emerald-600">${ltv.estimated_ltv.toFixed(0)}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">月均 ARPU</span>
                <span className="font-semibold">${ltv.estimated_monthly_arpu.toFixed(1)}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">平均留存天数</span>
                <span className="font-semibold">{Math.round(ltv.avg_tenure_days)} 天</span>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Persona Cards */}
      <div className="grid gap-6 md:grid-cols-3">
        {/* Country */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <Globe className="h-4 w-4" /> 国家分布
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {sortedCountries.map(([c, n]) => (
              <div key={c} className="flex items-center justify-between text-sm">
                <span>{c}</span>
                <Badge variant="secondary">{n}</Badge>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Language */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <Languages className="h-4 w-4" /> 语言偏好
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {sortedLangs.map(([l, n]) => (
              <div key={l} className="flex items-center justify-between text-sm">
                <span>{LANG_LABELS[l] || l}</span>
                <Badge variant="secondary">{n}</Badge>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Source */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <Link2 className="h-4 w-4" /> 获客渠道
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {sortedSources.map(([s, n]) => (
              <div key={s} className="flex items-center justify-between text-sm">
                <span className="max-w-[160px] truncate">{s}</span>
                <Badge variant="secondary">{n}</Badge>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      {/* Summary insight */}
      <Card>
        <CardContent className="flex items-center gap-3 py-4">
          <Clock className="h-5 w-5 text-muted-foreground" />
          <span className="text-sm">
            付费用户平均注册 <strong>{avgDays} 天</strong>，
            共 <strong>{users.length}</strong> 位有效付费用户
          </span>
        </CardContent>
      </Card>
    </div>
  );
}
