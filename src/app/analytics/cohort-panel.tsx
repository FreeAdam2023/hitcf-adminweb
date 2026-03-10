"use client";

import { useEffect, useState } from "react";
import { fetchCohortRetention, fetchFeatureAdoption, fetchLTV } from "@/lib/api/admin";
import type { CohortRetentionData, FeatureAdoptionData, LTVData } from "@/lib/api/types";

function RetentionMatrix({ data }: { data: CohortRetentionData }) {
  return (
    <div className="rounded-lg border bg-card p-5 overflow-x-auto">
      <h3 className="mb-3 text-sm font-semibold uppercase tracking-wider text-muted-foreground">
        Cohort 留存矩阵 ({data.granularity === "weekly" ? "按周" : "按月"})
      </h3>
      <table className="w-full text-xs">
        <thead>
          <tr className="border-b text-muted-foreground">
            <th className="pb-2 pr-3 text-left">Cohort</th>
            <th className="pb-2 pr-2 text-right">人数</th>
            {data.periods.map((p) => (
              <th key={p} className="pb-2 px-1 text-center">{p}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.cohorts.map((row) => (
            <tr key={row.cohort} className="border-b last:border-0">
              <td className="py-1.5 pr-3 font-medium whitespace-nowrap">{row.cohort}</td>
              <td className="py-1.5 pr-2 text-right text-muted-foreground">{row.size}</td>
              {row.retention.map((cell) => {
                const bg =
                  cell.rate >= 50 ? "bg-green-600 text-white" :
                  cell.rate >= 30 ? "bg-green-400 text-white" :
                  cell.rate >= 15 ? "bg-yellow-400 text-black" :
                  cell.rate > 0 ? "bg-orange-300 text-black" :
                  "bg-muted text-muted-foreground";
                return (
                  <td key={cell.period} className="py-1.5 px-1 text-center">
                    <span className={`inline-block min-w-[3rem] rounded px-1 py-0.5 ${bg}`}>
                      {cell.rate}%
                    </span>
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function FeatureAdoption({ data }: { data: FeatureAdoptionData }) {
  const labels: Record<string, string> = {
    listening: "听力", reading: "阅读", writing: "写作",
    speaking: "口语", conversation: "AI对话", vocabulary: "词汇",
  };

  const totalWithActivity = data.users_with_activity || 1;

  return (
    <div className="space-y-4">
      <div className="rounded-lg border bg-card p-5">
        <h3 className="mb-3 text-sm font-semibold uppercase tracking-wider text-muted-foreground">
          首次使用功能分布
        </h3>
        <p className="mb-3 text-xs text-muted-foreground">
          {data.total_users} 注册用户中 {data.users_with_activity} 人有活动
        </p>
        <div className="space-y-2">
          {Object.entries(data.first_feature).map(([feature, count]) => {
            const pct = Math.round((count / totalWithActivity) * 100);
            return (
              <div key={feature} className="flex items-center gap-3">
                <span className="w-16 text-sm font-medium">{labels[feature] || feature}</span>
                <div className="flex-1 h-6 bg-muted rounded">
                  <div
                    className="h-full bg-primary/70 rounded flex items-center px-2 text-xs text-primary-foreground"
                    style={{ width: `${Math.max(pct, 3)}%` }}
                  >
                    {pct > 8 ? `${count} (${pct}%)` : ""}
                  </div>
                </div>
                <span className="w-16 text-right text-sm text-muted-foreground">{count}</span>
              </div>
            );
          })}
        </div>
      </div>

      <div className="rounded-lg border bg-card p-5">
        <h3 className="mb-3 text-sm font-semibold uppercase tracking-wider text-muted-foreground">
          常见功能使用顺序 (Top 15)
        </h3>
        <div className="space-y-1">
          {data.top_sequences.map((seq, i) => (
            <div key={i} className="flex items-center justify-between py-1 text-sm">
              <div className="flex items-center gap-1">
                {seq.sequence.map((f, j) => (
                  <span key={j}>
                    {j > 0 && <span className="mx-1 text-muted-foreground">→</span>}
                    <span className="rounded bg-muted px-1.5 py-0.5 text-xs">{labels[f] || f}</span>
                  </span>
                ))}
              </div>
              <span className="text-muted-foreground">{seq.count}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function LTVPanel({ data }: { data: LTVData }) {
  return (
    <div className="rounded-lg border bg-card p-5">
      <h3 className="mb-4 text-sm font-semibold uppercase tracking-wider text-muted-foreground">LTV 估算</h3>
      <div className="grid gap-4 md:grid-cols-4 mb-6">
        <div className="text-center">
          <p className="text-xs text-muted-foreground">总订阅用户</p>
          <p className="text-2xl font-bold">{data.total_subscribers_ever}</p>
        </div>
        <div className="text-center">
          <p className="text-xs text-muted-foreground">当前活跃</p>
          <p className="text-2xl font-bold text-green-600">{data.active_subscribers}</p>
        </div>
        <div className="text-center">
          <p className="text-xs text-muted-foreground">月均 ARPU</p>
          <p className="text-2xl font-bold">${data.estimated_monthly_arpu}</p>
        </div>
        <div className="text-center">
          <p className="text-xs text-muted-foreground">预估 LTV</p>
          <p className="text-2xl font-bold text-primary">${data.estimated_ltv}</p>
        </div>
      </div>

      <p className="mb-3 text-xs text-muted-foreground">平均留存 {data.avg_tenure_days} 天</p>

      <table className="w-full text-sm">
        <thead>
          <tr className="border-b text-left text-muted-foreground">
            <th className="pb-2">套餐</th>
            <th className="pb-2 text-right">活跃</th>
            <th className="pb-2 text-right">流失</th>
            <th className="pb-2 text-right">流失率</th>
            <th className="pb-2 text-right">平均留存</th>
            <th className="pb-2 text-right">月价</th>
          </tr>
        </thead>
        <tbody>
          {Object.entries(data.by_plan).map(([plan, stats]) => (
            <tr key={plan} className="border-b last:border-0">
              <td className="py-2 font-medium">{plan}</td>
              <td className="py-2 text-right">{stats.active}</td>
              <td className="py-2 text-right">{stats.churned}</td>
              <td className="py-2 text-right">
                <span className={stats.churn_rate > 30 ? "text-red-500" : "text-muted-foreground"}>
                  {stats.churn_rate}%
                </span>
              </td>
              <td className="py-2 text-right">{stats.avg_tenure_days}天</td>
              <td className="py-2 text-right">${stats.monthly_price.toFixed(2)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function CohortPanel() {
  const [retention, setRetention] = useState<CohortRetentionData | null>(null);
  const [adoption, setAdoption] = useState<FeatureAdoptionData | null>(null);
  const [ltv, setLtv] = useState<LTVData | null>(null);
  const [loading, setLoading] = useState(true);
  const [granularity, setGranularity] = useState<"weekly" | "monthly">("weekly");

  useEffect(() => {
    setLoading(true);
    Promise.all([
      fetchCohortRetention(granularity),
      fetchFeatureAdoption(90),
      fetchLTV(),
    ])
      .then(([r, a, l]) => {
        setRetention(r);
        setAdoption(a);
        setLtv(l);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [granularity]);

  if (loading) return <div className="py-8 text-center text-muted-foreground">加载中...</div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <span className="text-sm text-muted-foreground">留存粒度:</span>
        {(["weekly", "monthly"] as const).map((g) => (
          <button
            key={g}
            onClick={() => setGranularity(g)}
            className={`rounded-md px-3 py-1 text-sm ${
              granularity === g ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground hover:bg-accent"
            }`}
          >
            {g === "weekly" ? "按周" : "按月"}
          </button>
        ))}
      </div>

      {retention && <RetentionMatrix data={retention} />}
      {adoption && <FeatureAdoption data={adoption} />}
      {ltv && <LTVPanel data={ltv} />}
    </div>
  );
}
