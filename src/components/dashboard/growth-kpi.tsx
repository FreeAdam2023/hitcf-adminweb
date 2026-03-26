"use client";

import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { fetchSubscriptionRevenue } from "@/lib/api/admin";
import type { AdminStats, SubscriptionRevenue } from "@/lib/api/types";
import {
  TrendingUp,
  TrendingDown,
  Users,
  UserPlus,
  Activity,
  CreditCard,
  DollarSign,
  Target,
} from "lucide-react";

interface GrowthKPIProps {
  stats: AdminStats;
}

export function GrowthKPI({ stats }: GrowthKPIProps) {
  const [revenue, setRevenue] = useState<SubscriptionRevenue | null>(null);

  useEffect(() => {
    fetchSubscriptionRevenue().then(setRevenue).catch(() => {});
  }, []);

  const new24h = stats.new_24h ?? 0;
  const new7d = stats.new_7d ?? 0;
  const wowRate = stats.wow_rate ?? 0;
  const dauVal = stats.dau ?? 0;
  const wauVal = stats.wau ?? 0;
  const paidCount = stats.active_subscription_count;
  const mrr = revenue?.estimated_mrr ?? 0;
  const trialing = revenue?.total_trialing ?? 0;

  const wowPositive = wowRate >= 0;
  const WowIcon = wowPositive ? TrendingUp : TrendingDown;

  // Plan breakdown
  const byPlan = revenue?.by_plan ?? {};
  const planLabels: Record<string, string> = {
    monthly: "月付",
    quarterly: "季付",
    yearly: "年付",
  };

  // Milestone calculation
  const milestones = [50, 100, 200, 500, 1000, 2000, 5000, 10000];
  let nextMilestone: number | null = null;
  let daysToMilestone: number | null = null;
  for (const m of milestones) {
    if (stats.user_count < m) {
      nextMilestone = m;
      const remaining = m - stats.user_count;
      const dailyRate = new7d > 0 ? new7d / 7 : new24h > 0 ? new24h : 0;
      daysToMilestone = dailyRate > 0 ? Math.round(remaining / dailyRate) : null;
      break;
    }
  }

  // Revenue goal: $20,000 total
  const mrrTarget = 20000;
  const mrrProgress = Math.min((mrr / mrrTarget) * 100, 100);

  // Estimated time to reach revenue goal using compound growth
  // Use week-over-week user growth as proxy for MRR growth
  // Formula: MRR × (1 + monthlyRate)^n = target → n = log(target/MRR) / log(1 + monthlyRate)
  let etaLabel: string | null = null;
  if (mrr > 0 && mrr < mrrTarget) {
    // Convert weekly growth rate to monthly (×4.33 weeks/month, compounded)
    const weeklyRate = wowRate / 100; // e.g. 0.15 for 15%
    const monthlyRate = weeklyRate > 0 ? Math.pow(1 + weeklyRate, 4.33) - 1 : 0;

    let months: number;
    if (monthlyRate > 0.01) {
      // Compound growth: n = log(target/current) / log(1+rate)
      months = Math.log(mrrTarget / mrr) / Math.log(1 + monthlyRate);
    } else {
      // No meaningful growth — linear fallback
      months = (mrrTarget - mrr) / mrr;
    }

    if (months < 1) {
      etaLabel = `${Math.max(1, Math.ceil(months * 30))} 天`;
    } else if (months < 12) {
      const m = Math.floor(months);
      const d = Math.round((months - m) * 30);
      etaLabel = d > 0 ? `${m} 月 ${d} 天` : `${m} 月`;
    } else {
      const y = Math.floor(months / 12);
      const m = Math.round(months % 12);
      etaLabel = m > 0 ? `${y} 年 ${m} 月` : `${y} 年`;
    }
  }

  return (
    <Card className="overflow-hidden border-0 shadow-lg">
      {/* Gradient header with revenue hero */}
      <div className="bg-gradient-to-r from-indigo-600 to-purple-600 px-6 py-5">
        <div className="flex items-start justify-between">
          {/* Left: title + milestone */}
          <div>
            <h2 className="text-lg font-bold text-white">
              Hi<span className="text-yellow-300">TCF</span>
              <span className="ml-2 text-sm font-normal opacity-80">
                增长仪表板
              </span>
            </h2>
            {nextMilestone && (
              <div className="mt-2 flex items-center gap-1.5 rounded-full bg-white/15 px-3 py-1 text-xs text-white/90 w-fit">
                <Target className="h-3.5 w-3.5" />
                <span>
                  下一里程碑: <strong>{nextMilestone}</strong> 用户
                  {daysToMilestone && (
                    <span> · 预计 {daysToMilestone} 天</span>
                  )}
                  <span> (还差 {nextMilestone - stats.user_count} 人)</span>
                </span>
              </div>
            )}
          </div>

          {/* Right: Revenue hero */}
          <div className="flex items-center gap-6">
            {/* Paid users — hero number */}
            <div className="text-right">
              <div className="flex items-center justify-end gap-2">
                <CreditCard className="h-5 w-5 text-yellow-300" />
                <span className="text-4xl font-extrabold text-white">
                  {paidCount}
                </span>
              </div>
              <div className="mt-0.5 text-xs text-white/70">
                付费用户
                {trialing > 0 && (
                  <span className="ml-1.5 rounded bg-white/15 px-1.5 py-0.5">
                    +{trialing} 试用中
                  </span>
                )}
              </div>
              {/* Plan breakdown */}
              {Object.keys(byPlan).length > 0 && (
                <div className="mt-1 flex items-center justify-end gap-2 text-[10px] text-white/60">
                  {Object.entries(byPlan).map(([plan, count]) => (
                    <span key={plan}>
                      {planLabels[plan] || plan} {count}
                    </span>
                  ))}
                </div>
              )}
            </div>

            {/* Divider */}
            <div className="h-14 w-px bg-white/20" />

            {/* MRR — hero number */}
            <div className="text-right">
              <div className="flex items-center justify-end gap-2">
                <DollarSign className="h-5 w-5 text-emerald-300" />
                <span className="text-4xl font-extrabold text-white">
                  {revenue ? `$${mrr.toFixed(0)}` : "—"}
                </span>
              </div>
              <div className="mt-0.5 text-xs text-white/70">目标盈利</div>
              {/* Revenue progress bar toward $20,000 goal */}
              <div className="mt-1.5 flex items-center gap-2">
                <div className="h-1.5 w-24 rounded-full bg-white/20">
                  <div
                    className="h-1.5 rounded-full bg-emerald-400 transition-all"
                    style={{ width: `${mrrProgress}%` }}
                  />
                </div>
                <span className="text-[10px] text-white/50">
                  ${mrrTarget} 目标
                </span>
              </div>
              {etaLabel && (
                <div className="mt-1 text-[10px] text-white/50">
                  预计 <span className="text-emerald-300 font-medium">{etaLabel}</span> 达成
                  {wowRate > 0 && <span className="ml-1 text-white/30">(周增{wowRate.toFixed(0)}%)</span>}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* KPI Grid — 6 cells */}
      <div className="grid grid-cols-3 divide-x divide-border border-b lg:grid-cols-6">
        <KPICell
          label="累计用户"
          value={stats.user_count}
          icon={<Users className="h-4 w-4 text-blue-600" />}
        />
        <KPICell
          label="今日新增"
          value={`+${new24h}`}
          icon={<UserPlus className="h-4 w-4 text-emerald-600" />}
          valueColor="text-emerald-600"
        />
        <KPICell
          label="本周新增"
          value={new7d}
          icon={<UserPlus className="h-4 w-4 text-blue-600" />}
        />
        <KPICell
          label="周环比"
          value={`${wowPositive ? "↑" : "↓"}${Math.abs(wowRate).toFixed(0)}%`}
          icon={
            <WowIcon
              className={`h-4 w-4 ${wowPositive ? "text-emerald-600" : "text-red-600"}`}
            />
          }
          valueColor={wowPositive ? "text-emerald-600" : "text-red-600"}
        />
        <KPICell
          label="今日活跃"
          value={dauVal}
          icon={<Activity className="h-4 w-4 text-orange-600" />}
          valueColor="text-orange-600"
        />
        <KPICell
          label="本周活跃"
          value={wauVal}
          icon={<Activity className="h-4 w-4 text-amber-600" />}
          valueColor="text-amber-600"
        />
      </div>
    </Card>
  );
}

function KPICell({
  label,
  value,
  icon,
  valueColor = "text-foreground",
}: {
  label: string;
  value: string | number;
  icon: React.ReactNode;
  valueColor?: string;
}) {
  return (
    <div className="flex flex-col items-center justify-center gap-1 px-3 py-4">
      {icon}
      <div className={`text-2xl font-bold ${valueColor}`}>{value}</div>
      <div className="text-[11px] text-muted-foreground">{label}</div>
    </div>
  );
}
