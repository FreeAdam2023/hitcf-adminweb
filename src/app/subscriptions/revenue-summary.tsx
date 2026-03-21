"use client";

import { useState, useEffect } from "react";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { LoadingSpinner } from "@/components/shared/loading-spinner";
import { fetchSubscriptionRevenue } from "@/lib/api/admin";
import type { SubscriptionRevenue } from "@/lib/api/types";
import { DollarSign, Users, UserCheck, UserX, AlertTriangle } from "lucide-react";

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

  const cards = [
    { label: "活跃", value: data.total_active, icon: UserCheck, color: "text-green-600" },
    { label: "试用中", value: data.total_trialing, icon: Users, color: "text-blue-600" },
    { label: "已取消", value: data.total_cancelled, icon: UserX, color: "text-muted-foreground" },
    { label: "逾期", value: data.total_past_due, icon: AlertTriangle, color: "text-red-600" },
    { label: "预估MRR", value: `$${data.estimated_mrr.toLocaleString()}`, icon: DollarSign, color: "text-green-600" },
  ];

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-3 lg:grid-cols-5">
        {cards.map((c) => (
          <Card key={c.label}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{c.label}</CardTitle>
              <c.icon className={`h-4 w-4 ${c.color}`} />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{typeof c.value === "number" ? c.value.toLocaleString() : c.value}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Plan Distribution */}
      {Object.keys(data.by_plan).length > 0 && (() => {
        const planEntries = Object.entries(data.by_plan);
        const planTotal = planEntries.reduce((s, [, c]) => s + c, 0);
        const COLORS = ["bg-indigo-500", "bg-emerald-500", "bg-amber-500", "bg-rose-500"];
        return (
          <Card>
            <CardHeader>
              <CardTitle className="text-base">套餐分布</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Stacked bar */}
              <div className="h-4 rounded-full bg-muted flex overflow-hidden">
                {planEntries.map(([plan, count], i) => {
                  const pct = planTotal > 0 ? (count / planTotal) * 100 : 0;
                  return (
                    <div
                      key={plan}
                      className={`h-full ${COLORS[i % COLORS.length]}`}
                      style={{ width: `${pct}%` }}
                      title={`${plan}: ${count} (${Math.round(pct)}%)`}
                    />
                  );
                })}
              </div>
              {/* Legend */}
              <div className="grid gap-2 sm:grid-cols-2">
                {planEntries.map(([plan, count], i) => {
                  const pct = planTotal > 0 ? Math.round((count / planTotal) * 100) : 0;
                  return (
                    <div key={plan} className="flex items-center gap-2 text-sm">
                      <span className={`h-3 w-3 rounded-sm shrink-0 ${COLORS[i % COLORS.length]}`} />
                      <span className="flex-1 truncate">{plan}</span>
                      <span className="font-medium tabular-nums">{count}</span>
                      <span className="text-muted-foreground text-xs">({pct}%)</span>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        );
      })()}
    </div>
  );
}
