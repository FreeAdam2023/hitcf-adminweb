"use client";

import { useState, useEffect } from "react";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { LoadingSpinner } from "@/components/shared/loading-spinner";
import { fetchSubscriptionRevenue } from "@/lib/api/admin";
import type { SubscriptionRevenue } from "@/lib/api/types";
import {
  DollarSign,
  Users,
  UserCheck,
  UserX,
  AlertTriangle,
  TrendingUp,
} from "lucide-react";

const PLAN_LABELS: Record<string, string> = {
  monthly: "月付",
  quarterly: "季付",
  yearly: "年付",
  tester: "体验官",
  referral: "推荐奖励",
  recall: "召回体验",
};

const PLAN_COLORS: Record<string, string> = {
  monthly: "bg-blue-500",
  quarterly: "bg-violet-500",
  yearly: "bg-emerald-500",
  tester: "bg-gray-400",
  referral: "bg-amber-500",
};

const PLAN_PRICES: Record<string, string> = {
  monthly: "$19.90/月",
  quarterly: "$39.90/季",
  yearly: "$99.90/年",
};

export function RevenueSummary() {
  const [data, setData] = useState<SubscriptionRevenue | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchSubscriptionRevenue()
      .then(setData)
      .catch((e) => toast.error(e.message || "加载收入数据失败"))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <LoadingSpinner />;
  if (!data) return null;

  const totalSubs = data.total_active + data.total_trialing;
  const planTotal = Object.values(data.by_plan).reduce((s, c) => s + c, 0);

  const statCards = [
    {
      label: "活跃订阅",
      value: data.total_active,
      icon: UserCheck,
      iconBg: "bg-emerald-100 dark:bg-emerald-900/40",
      iconColor: "text-emerald-600 dark:text-emerald-400",
      desc: "付费用户",
    },
    {
      label: "试用中",
      value: data.total_trialing,
      icon: Users,
      iconBg: "bg-blue-100 dark:bg-blue-900/40",
      iconColor: "text-blue-600 dark:text-blue-400",
      desc: "免费试用期",
    },
    {
      label: "取消中",
      value: data.total_cancelling ?? 0,
      icon: UserX,
      iconBg: "bg-amber-100 dark:bg-amber-900/40",
      iconColor: "text-amber-600 dark:text-amber-400",
      desc: "用户取消·到期前",
    },
    {
      label: "已取消",
      value: data.total_cancelled,
      icon: UserX,
      iconBg: "bg-gray-100 dark:bg-gray-800",
      iconColor: "text-gray-500",
      desc: "已到期",
    },
    {
      label: "逾期",
      value: data.total_past_due,
      icon: AlertTriangle,
      iconBg: "bg-red-100 dark:bg-red-900/40",
      iconColor: "text-red-600 dark:text-red-400",
      desc: "付款失败",
    },
  ];

  return (
    <div className="space-y-6">
      {/* MRR highlight card */}
      <Card className="border-none bg-gradient-to-r from-emerald-500 to-teal-600 text-white shadow-lg">
        <CardContent className="flex items-center justify-between py-6">
          <div>
            <p className="text-sm font-medium text-emerald-100">预估月经常性收入 (MRR)</p>
            <p className="mt-1 text-4xl font-bold tracking-tight">
              ${data.estimated_mrr.toFixed(2)}
            </p>
            <p className="mt-1 text-sm text-emerald-100">
              {totalSubs} 位活跃 / 试用用户
            </p>
          </div>
          <div className="rounded-full bg-white/20 p-4">
            <TrendingUp className="h-8 w-8" />
          </div>
        </CardContent>
      </Card>

      {/* Stat cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        {statCards.map((c) => (
          <Card key={c.label}>
            <CardContent className="flex items-center gap-4 pt-6">
              <div className={`rounded-lg p-2.5 ${c.iconBg}`}>
                <c.icon className={`h-5 w-5 ${c.iconColor}`} />
              </div>
              <div>
                <p className="text-2xl font-bold tabular-nums">{c.value}</p>
                <p className="text-sm text-muted-foreground">{c.label}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Plan Distribution */}
      {Object.keys(data.by_plan).length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base">套餐分布</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </div>
          </CardHeader>
          <CardContent>
            {/* Donut-style summary bar */}
            <div className="mb-4 flex h-3 overflow-hidden rounded-full bg-muted">
              {Object.entries(data.by_plan).map(([plan, count]) => {
                const pct = planTotal > 0 ? (count / planTotal) * 100 : 0;
                if (pct === 0) return null;
                return (
                  <div
                    key={plan}
                    className={`${PLAN_COLORS[plan] || "bg-gray-400"} transition-all`}
                    style={{ width: `${pct}%` }}
                    title={`${PLAN_LABELS[plan] || plan}: ${count} (${Math.round(pct)}%)`}
                  />
                );
              })}
            </div>

            {/* Plan details */}
            <div className="space-y-3">
              {Object.entries(data.by_plan).map(([plan, count]) => {
                const pct = planTotal > 0 ? Math.round((count / planTotal) * 100) : 0;
                return (
                  <div key={plan} className="flex items-center gap-3">
                    <div className={`h-3 w-3 rounded-full shrink-0 ${PLAN_COLORS[plan] || "bg-gray-400"}`} />
                    <div className="flex flex-1 items-center justify-between">
                      <div>
                        <span className="text-sm font-medium">
                          {PLAN_LABELS[plan] || plan}
                        </span>
                        {PLAN_PRICES[plan] && (
                          <span className="ml-2 text-xs text-muted-foreground">
                            {PLAN_PRICES[plan]}
                          </span>
                        )}
                      </div>
                      <div className="text-right">
                        <span className="text-sm font-semibold tabular-nums">{count}</span>
                        <span className="ml-1.5 text-xs text-muted-foreground">{pct}%</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
