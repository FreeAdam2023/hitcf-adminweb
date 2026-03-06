"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { LoadingSpinner } from "@/components/shared/loading-spinner";
import { fetchCostEstimate } from "@/lib/api/admin";
import type { CostEstimate } from "@/lib/api/types";
import { DollarSign, Server, Zap, Gift } from "lucide-react";

function formatUSD(n: number): string {
  return n === 0 ? "免费" : `$${n.toFixed(2)}`;
}

export function CostOverview() {
  const [data, setData] = useState<CostEstimate | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchCostEstimate()
      .then(setData)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <Card><CardContent className="py-8"><LoadingSpinner /></CardContent></Card>;
  if (!data) return null;

  const { summary } = data;

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">运行成本估算 ({data.period})</CardTitle>
        <DollarSign className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Summary cards */}
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <div className="rounded-lg border border-l-4 border-l-blue-500 bg-blue-50 dark:bg-blue-950 p-3">
            <p className="text-xs text-muted-foreground">固定成本</p>
            <p className="text-xl font-bold">${summary.total_fixed.toFixed(2)}</p>
          </div>
          <div className="rounded-lg border border-l-4 border-l-orange-500 bg-orange-50 dark:bg-orange-950 p-3">
            <p className="text-xs text-muted-foreground">按量成本</p>
            <p className="text-xl font-bold">${summary.total_variable.toFixed(2)}</p>
          </div>
          <div className="rounded-lg border border-l-4 border-l-green-500 bg-green-50 dark:bg-green-950 p-3">
            <p className="text-xs text-muted-foreground">总计/月</p>
            <p className="text-xl font-bold text-green-700 dark:text-green-400">${summary.total_estimated.toFixed(2)}</p>
          </div>
          <div className="rounded-lg border border-l-4 border-l-violet-500 bg-violet-50 dark:bg-violet-950 p-3">
            <p className="text-xs text-muted-foreground">人均成本</p>
            <p className="text-xl font-bold">${summary.cost_per_user.toFixed(2)}</p>
            <p className="text-[10px] text-muted-foreground">{summary.user_count} 位用户</p>
          </div>
        </div>

        {/* Fixed costs table */}
        <div>
          <div className="flex items-center gap-2 mb-2">
            <Server className="h-4 w-4 text-blue-600" />
            <h3 className="text-sm font-semibold">固定服务</h3>
          </div>
          <div className="space-y-1">
            {data.fixed_costs.filter(c => c.type !== "free").map((c) => (
              <div key={c.name} className="flex items-center justify-between text-sm py-1.5 border-b last:border-0">
                <div className="flex items-center gap-2 min-w-0">
                  <span className="truncate">{c.name}</span>
                  {c.plan && <Badge variant="secondary" className="text-[10px] shrink-0">{c.plan}</Badge>}
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  {c.note && <span className="text-xs text-muted-foreground hidden sm:inline">{c.note}</span>}
                  <span className="font-medium w-16 text-right">{formatUSD(c.cost)}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Free services */}
        <div>
          <div className="flex items-center gap-2 mb-2">
            <Gift className="h-4 w-4 text-green-600" />
            <h3 className="text-sm font-semibold">免费服务</h3>
          </div>
          <div className="flex flex-wrap gap-2">
            {data.fixed_costs.filter(c => c.type === "free").map((c) => (
              <div key={c.name} className="flex items-center gap-1.5 rounded-full border bg-green-50 dark:bg-green-950 px-3 py-1">
                <span className="text-xs">{c.name}</span>
                {c.note && <span className="text-[10px] text-muted-foreground">({c.note})</span>}
              </div>
            ))}
          </div>
        </div>

        {/* Variable costs */}
        <div>
          <div className="flex items-center gap-2 mb-2">
            <Zap className="h-4 w-4 text-orange-600" />
            <h3 className="text-sm font-semibold">按量付费</h3>
          </div>
          <div className="space-y-1">
            {data.variable_costs.map((c) => (
              <div key={c.name} className="flex items-center justify-between text-sm py-1.5 border-b last:border-0">
                <div className="flex items-center gap-2 min-w-0">
                  <span className="truncate">{c.name}</span>
                  {c.usage && <Badge variant="outline" className="text-[10px] shrink-0">{c.usage}</Badge>}
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  {c.note && <span className="text-xs text-muted-foreground hidden sm:inline">{c.note}</span>}
                  <span className="font-medium w-16 text-right">{formatUSD(c.cost)}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
