"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { LoadingSpinner } from "@/components/shared/loading-spinner";
import { fetchCostEstimate } from "@/lib/api/admin";
import type { CostEstimate } from "@/lib/api/types";
import {
  DollarSign,
  TrendingUp,
  TrendingDown,
  Server,
  Zap,
  Gift,
  AlertTriangle,
  CreditCard,
  ArrowUpRight,
  ArrowDownRight,
  Minus,
  Cloud,
} from "lucide-react";

function formatUSD(n: number | null): string {
  if (n === null) return "待补充";
  return n === 0 ? "免费" : `$${n.toFixed(2)}`;
}

export default function FinancialsPage() {
  const [data, setData] = useState<CostEstimate | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchCostEstimate()
      .then(setData)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading)
    return (
      <div className="py-20">
        <LoadingSpinner />
      </div>
    );
  if (!data) return <p className="text-muted-foreground p-8">加载失败</p>;

  const { summary, revenue } = data;
  const isProfit = summary.net_profit >= 0;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">收支报表</h1>
        <p className="text-sm text-muted-foreground">{data.period}</p>
      </div>

      {/* Hero: Revenue vs Expenses vs Profit */}
      <div className="grid gap-4 sm:grid-cols-3">
        {/* Revenue */}
        <Card className="border-l-4 border-l-emerald-500">
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <TrendingUp className="h-4 w-4 text-emerald-600" />
              月收入 (MRR)
            </div>
            <p className="mt-1 text-3xl font-bold text-emerald-600">
              ${revenue.estimated_mrr.toFixed(2)}
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              {revenue.active_subscriptions} 个活跃订阅
              {Object.entries(revenue.by_plan).map(([plan, count]) => (
                <span key={plan} className="ml-2">
                  {plan} ×{count}
                </span>
              ))}
            </p>
          </CardContent>
        </Card>

        {/* Expenses */}
        <Card className="border-l-4 border-l-red-500">
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <TrendingDown className="h-4 w-4 text-red-600" />
              月支出 (估算)
            </div>
            <p className="mt-1 text-3xl font-bold text-red-600">
              ${summary.total_estimated.toFixed(2)}
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              固定 ${summary.total_fixed.toFixed(2)} + 按量 $
              {summary.total_variable.toFixed(2)}
            </p>
          </CardContent>
        </Card>

        {/* Net Profit/Loss */}
        <Card
          className={`border-l-4 ${isProfit ? "border-l-blue-500" : "border-l-orange-500"}`}
        >
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              {isProfit ? (
                <ArrowUpRight className="h-4 w-4 text-blue-600" />
              ) : (
                <ArrowDownRight className="h-4 w-4 text-orange-600" />
              )}
              月{isProfit ? "盈利" : "亏损"}
            </div>
            <p
              className={`mt-1 text-3xl font-bold ${isProfit ? "text-blue-600" : "text-orange-600"}`}
            >
              {isProfit ? "+" : ""}${summary.net_profit.toFixed(2)}
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              人均成本 ${summary.cost_per_user.toFixed(2)} ·{" "}
              {summary.user_count} 用户
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Manual costs alert */}
      {data.manual_costs && data.manual_costs.length > 0 && (
        <Card className="border-orange-300 bg-orange-50 dark:border-orange-800 dark:bg-orange-950">
          <CardContent className="pt-6">
            <div className="flex items-start gap-3">
              <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-orange-600" />
              <div className="space-y-2">
                <p className="text-sm font-semibold text-orange-800 dark:text-orange-200">
                  以下费用无法自动获取，请手动补充
                </p>
                {data.manual_costs.map((c) => (
                  <div
                    key={c.name}
                    className="flex items-center gap-2 text-sm text-orange-700 dark:text-orange-300"
                  >
                    <Minus className="h-3 w-3" />
                    <span className="font-medium">{c.name}</span>
                    <span className="text-xs opacity-75">— {c.note}</span>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Detailed breakdown */}
      <div className="grid gap-4 lg:grid-cols-2">
        {/* Income */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              <span className="flex items-center gap-2">
                <CreditCard className="h-4 w-4 text-emerald-600" />
                收入明细
              </span>
            </CardTitle>
            <Badge
              variant="outline"
              className="border-emerald-300 text-emerald-700"
            >
              Stripe
            </Badge>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {Object.entries(revenue.by_plan).length > 0 ? (
                Object.entries(revenue.by_plan).map(([plan, count]) => {
                  const priceMap: Record<string, number> = {
                    monthly: 19.9,
                    quarterly: 49.9,
                    semiannual: 69.9,
                    yearly: 99.9,
                  };
                  const mrrMap: Record<string, number> = {
                    monthly: 19.9,
                    quarterly: 16.63,
                    semiannual: 11.65,
                    yearly: 8.33,
                  };
                  const planLabels: Record<string, string> = {
                    monthly: "月付",
                    quarterly: "季付",
                    semiannual: "半年付",
                    yearly: "年付",
                  };
                  return (
                    <div
                      key={plan}
                      className="flex items-center justify-between border-b py-2 text-sm last:border-0"
                    >
                      <div className="flex items-center gap-2">
                        <span>{planLabels[plan] || plan}</span>
                        <Badge variant="secondary" className="text-[10px]">
                          ×{count}
                        </Badge>
                        <span className="text-xs text-muted-foreground">
                          ${priceMap[plan]?.toFixed(2) || "?"}/次
                        </span>
                      </div>
                      <span className="font-medium text-emerald-600">
                        ${((mrrMap[plan] || 0) * count).toFixed(2)}/月
                      </span>
                    </div>
                  );
                })
              ) : (
                <p className="py-4 text-center text-sm text-muted-foreground">
                  暂无付费订阅
                </p>
              )}
              <div className="flex items-center justify-between border-t pt-2 font-semibold">
                <span>MRR 合计</span>
                <span className="text-emerald-600">
                  ${revenue.estimated_mrr.toFixed(2)}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Expenses */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              <span className="flex items-center gap-2">
                <DollarSign className="h-4 w-4 text-red-600" />
                支出明细
              </span>
            </CardTitle>
            <Badge variant="outline" className="border-red-300 text-red-700">
              ${summary.total_estimated.toFixed(2)}/月
            </Badge>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Fixed */}
            <div>
              <div className="mb-2 flex items-center gap-2">
                <Server className="h-3.5 w-3.5 text-blue-600" />
                <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  固定成本 — ${summary.total_fixed.toFixed(2)}
                </h3>
              </div>
              <div className="space-y-1">
                {data.fixed_costs
                  .filter((c) => c.type !== "free")
                  .map((c) => (
                    <div
                      key={c.name}
                      className="flex items-center justify-between border-b py-1.5 text-sm last:border-0"
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        <span className="truncate">{c.name}</span>
                        {c.plan && (
                          <Badge
                            variant="secondary"
                            className="shrink-0 text-[10px]"
                          >
                            {c.plan}
                          </Badge>
                        )}
                      </div>
                      <span className="shrink-0 font-medium">
                        {formatUSD(c.cost)}
                      </span>
                    </div>
                  ))}
              </div>
            </div>

            {/* Free services */}
            <div>
              <div className="mb-2 flex items-center gap-2">
                <Gift className="h-3.5 w-3.5 text-green-600" />
                <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  免费服务
                </h3>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {data.fixed_costs
                  .filter((c) => c.type === "free")
                  .map((c) => (
                    <Badge
                      key={c.name}
                      variant="outline"
                      className="border-green-300 text-green-700 dark:border-green-700 dark:text-green-400"
                    >
                      {c.name}
                    </Badge>
                  ))}
              </div>
            </div>

            {/* Variable */}
            <div>
              <div className="mb-2 flex items-center gap-2">
                <Zap className="h-3.5 w-3.5 text-orange-600" />
                <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  按量成本 — ${summary.total_variable.toFixed(2)}
                </h3>
              </div>
              <div className="space-y-1">
                {data.variable_costs.map((c) => (
                  <div
                    key={c.name}
                    className="flex items-center justify-between border-b py-1.5 text-sm last:border-0"
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="truncate">{c.name}</span>
                      {c.usage && (
                        <Badge
                          variant="outline"
                          className="shrink-0 text-[10px]"
                        >
                          {c.usage}
                        </Badge>
                      )}
                    </div>
                    <span className="shrink-0 font-medium">
                      {formatUSD(c.cost)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Azure real costs */}
      {data.azure_costs && (
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              <span className="flex items-center gap-2">
                <Cloud className="h-4 w-4 text-blue-600" />
                Azure 实际账单
              </span>
            </CardTitle>
            <Badge variant="outline" className="border-blue-300 text-blue-700">
              {data.azure_costs.currency}${data.azure_costs.total.toFixed(2)} · {data.azure_costs.period}
            </Badge>
          </CardHeader>
          <CardContent>
            <div className="space-y-1">
              {Object.entries(data.azure_costs.by_service)
                .sort(([, a], [, b]) => b - a)
                .map(([service, cost]) => (
                  <div
                    key={service}
                    className="flex items-center justify-between border-b py-1.5 text-sm last:border-0"
                  >
                    <span className="truncate">{service}</span>
                    <span className="shrink-0 font-medium">
                      {data.azure_costs!.currency}${cost.toFixed(2)}
                    </span>
                  </div>
                ))}
              <div className="flex items-center justify-between border-t pt-2 font-semibold">
                <span>合计</span>
                <span className="text-blue-600">
                  {data.azure_costs.currency}${data.azure_costs.total.toFixed(2)}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Profit margin bar */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">盈利进度（目标 $20,000）</span>
            <span className="font-medium">
              累计收入需自行统计（Stripe Dashboard → Payments）
            </span>
          </div>
          <div className="mt-2 flex items-center gap-3">
            <div className="h-2 flex-1 rounded-full bg-muted">
              <div
                className={`h-2 rounded-full transition-all ${isProfit ? "bg-emerald-500" : "bg-orange-500"}`}
                style={{
                  width: `${Math.min(Math.max((revenue.estimated_mrr / summary.total_estimated) * 100, 0), 100)}%`,
                }}
              />
            </div>
            <span className="text-xs text-muted-foreground">
              收入覆盖率{" "}
              {summary.total_estimated > 0
                ? `${Math.round((revenue.estimated_mrr / summary.total_estimated) * 100)}%`
                : "—"}
            </span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
