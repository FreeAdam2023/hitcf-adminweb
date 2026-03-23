"use client";

import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { fetchSubscriptionRevenue } from "@/lib/api/admin";
import type { AdminStats, SubscriptionRevenue } from "@/lib/api/types";
import { TrendingUp, TrendingDown, Users, UserPlus, Activity, CreditCard, DollarSign, Target } from "lucide-react";

interface GrowthKPIProps {
  stats: AdminStats;
}

export function GrowthKPI({ stats }: GrowthKPIProps) {
  const [revenue, setRevenue] = useState<SubscriptionRevenue | null>(null);

  useEffect(() => {
    fetchSubscriptionRevenue().then(setRevenue).catch(() => {});
  }, []);

  const wowPositive = stats.wow_rate >= 0;
  const WowIcon = wowPositive ? TrendingUp : TrendingDown;

  // Milestone calculation
  const milestones = [50, 100, 200, 500, 1000, 2000, 5000, 10000];
  let nextMilestone: number | null = null;
  let daysToMilestone: number | null = null;
  for (const m of milestones) {
    if (stats.user_count < m) {
      nextMilestone = m;
      const remaining = m - stats.user_count;
      const dailyRate = stats.new_7d / 7;
      daysToMilestone = dailyRate > 0 ? Math.round(remaining / dailyRate) : null;
      break;
    }
  }

  return (
    <Card className="overflow-hidden border-0 shadow-lg">
      {/* Gradient header */}
      <div className="bg-gradient-to-r from-indigo-600 to-purple-600 px-6 py-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-white">
            Hi<span className="text-yellow-300">TCF</span>
            <span className="ml-2 text-sm font-normal opacity-80">增长仪表板</span>
          </h2>
          {nextMilestone && (
            <div className="flex items-center gap-1.5 rounded-full bg-white/15 px-3 py-1 text-xs text-white">
              <Target className="h-3.5 w-3.5" />
              <span>
                下一里程碑: <strong>{nextMilestone}</strong> 用户
                {daysToMilestone && <span> · 预计 {daysToMilestone} 天</span>}
                <span> (还差 {nextMilestone - stats.user_count} 人)</span>
              </span>
            </div>
          )}
        </div>
      </div>

      {/* KPI Grid */}
      <div className="grid grid-cols-4 divide-x divide-border border-b lg:grid-cols-8">
        {/* Row 1: Growth */}
        <KPICell
          label="累计用户"
          value={stats.user_count}
          icon={<Users className="h-4 w-4 text-blue-600" />}
        />
        <KPICell
          label="今日新增"
          value={`+${stats.new_24h}`}
          icon={<UserPlus className="h-4 w-4 text-emerald-600" />}
          valueColor="text-emerald-600"
        />
        <KPICell
          label="本周新增"
          value={stats.new_7d}
          icon={<UserPlus className="h-4 w-4 text-blue-600" />}
        />
        <KPICell
          label="周环比"
          value={`${wowPositive ? "↑" : "↓"}${Math.abs(stats.wow_rate).toFixed(0)}%`}
          icon={<WowIcon className={`h-4 w-4 ${wowPositive ? "text-emerald-600" : "text-red-600"}`} />}
          valueColor={wowPositive ? "text-emerald-600" : "text-red-600"}
        />
        {/* Row 2: Engagement */}
        <KPICell
          label="今日活跃"
          value={stats.dau}
          icon={<Activity className="h-4 w-4 text-orange-600" />}
          valueColor="text-orange-600"
        />
        <KPICell
          label="本周活跃"
          value={stats.wau}
          icon={<Activity className="h-4 w-4 text-amber-600" />}
          valueColor="text-amber-600"
        />
        <KPICell
          label="付费用户"
          value={stats.active_subscription_count}
          icon={<CreditCard className="h-4 w-4 text-purple-600" />}
          valueColor="text-purple-600"
        />
        <KPICell
          label="MRR"
          value={revenue ? `$${revenue.estimated_mrr.toFixed(0)}` : "—"}
          icon={<DollarSign className="h-4 w-4 text-emerald-600" />}
          valueColor="text-emerald-600"
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
