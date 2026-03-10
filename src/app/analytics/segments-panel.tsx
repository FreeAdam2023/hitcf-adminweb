"use client";

import { useEffect, useState } from "react";
import { fetchSegments, fetchFeatureCorrelation, fetchChurnRisk } from "@/lib/api/admin";
import type { SegmentsData, FeatureCorrelationData, ChurnRiskData } from "@/lib/api/types";

function SegmentTable({ title, rows }: { title: string; rows: Array<{ segment: string; registered: number; paid: number; conversion_rate: number }> }) {
  if (!rows.length) return null;
  return (
    <div className="rounded-lg border bg-card p-5">
      <h3 className="mb-3 text-sm font-semibold uppercase tracking-wider text-muted-foreground">{title}</h3>
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b text-left text-muted-foreground">
            <th className="pb-2">分组</th>
            <th className="pb-2 text-right">注册</th>
            <th className="pb-2 text-right">付费</th>
            <th className="pb-2 text-right">转化率</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r.segment} className="border-b last:border-0">
              <td className="py-2 font-medium">{r.segment}</td>
              <td className="py-2 text-right">{r.registered}</td>
              <td className="py-2 text-right">{r.paid}</td>
              <td className="py-2 text-right">
                <span className={r.conversion_rate > 10 ? "text-green-600" : r.conversion_rate > 5 ? "text-yellow-600" : "text-muted-foreground"}>
                  {r.conversion_rate}%
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function FeatureCorrelation({ data }: { data: FeatureCorrelationData }) {
  const features = ["listening", "reading", "writing", "speaking", "conversation", "vocabulary"] as const;
  const labels: Record<string, string> = {
    listening: "听力", reading: "阅读", writing: "写作",
    speaking: "口语", conversation: "AI对话", vocabulary: "词汇",
  };

  return (
    <div className="rounded-lg border bg-card p-5">
      <h3 className="mb-3 text-sm font-semibold uppercase tracking-wider text-muted-foreground">功能使用 × 付费关联</h3>
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b text-left text-muted-foreground">
            <th className="pb-2">功能</th>
            {data.groups.map((g) => (
              <th key={g.group} className="pb-2 text-right">
                {g.group === "paid" ? `付费 (${g.users})` : `免费 (${g.users})`}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {features.map((f) => (
            <tr key={f} className="border-b last:border-0">
              <td className="py-2 font-medium">{labels[f]}</td>
              {data.groups.map((g) => {
                const count = g[f];
                const pct = g.users > 0 ? Math.round((count / g.users) * 100) : 0;
                return (
                  <td key={g.group} className="py-2 text-right">
                    {count} <span className="text-xs text-muted-foreground">({pct}%)</span>
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

function ChurnRisk({ data }: { data: ChurnRiskData }) {
  return (
    <div className="rounded-lg border bg-card p-5">
      <div className="mb-3 flex items-center justify-between">
        <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">流失风险</h3>
        <div className="flex items-center gap-2 text-sm">
          <span className="text-muted-foreground">订阅者</span>
          <span className="font-bold">{data.total_subscribers}</span>
          <span className="text-muted-foreground">|</span>
          <span className="text-muted-foreground">风险</span>
          <span className="font-bold text-red-500">{data.at_risk_count}</span>
        </div>
      </div>
      {data.at_risk.length === 0 ? (
        <p className="py-4 text-center text-sm text-muted-foreground">无流失风险用户</p>
      ) : (
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b text-left text-muted-foreground">
              <th className="pb-2">邮箱</th>
              <th className="pb-2">套餐</th>
              <th className="pb-2 text-right">不活跃天数</th>
              <th className="pb-2 text-right">到期时间</th>
            </tr>
          </thead>
          <tbody>
            {data.at_risk.slice(0, 20).map((u) => (
              <tr key={u.user_id} className="border-b last:border-0">
                <td className="py-2 font-medium">{u.email}</td>
                <td className="py-2">{u.plan || "-"}</td>
                <td className="py-2 text-right">
                  <span className={u.days_inactive > 30 ? "font-bold text-red-500" : "text-yellow-600"}>
                    {u.days_inactive}天
                  </span>
                </td>
                <td className="py-2 text-right text-xs text-muted-foreground">
                  {u.current_period_end ? new Date(u.current_period_end).toLocaleDateString() : "-"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}

export function SegmentsPanel() {
  const [segments, setSegments] = useState<SegmentsData | null>(null);
  const [correlation, setCorrelation] = useState<FeatureCorrelationData | null>(null);
  const [churn, setChurn] = useState<ChurnRiskData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    Promise.all([
      fetchSegments(90),
      fetchFeatureCorrelation(90),
      fetchChurnRisk(14),
    ])
      .then(([s, fc, cr]) => {
        setSegments(s);
        setCorrelation(fc);
        setChurn(cr);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="py-8 text-center text-muted-foreground">加载中...</div>;

  return (
    <div className="space-y-6">
      {segments && (
        <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
          <SegmentTable title="UTM 来源" rows={segments.by_utm_source} />
          <SegmentTable title="国家/地区" rows={segments.by_country} />
          <SegmentTable title="设备类型" rows={segments.by_device} />
        </div>
      )}
      {correlation && <FeatureCorrelation data={correlation} />}
      {churn && <ChurnRisk data={churn} />}
    </div>
  );
}
