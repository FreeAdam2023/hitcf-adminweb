"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { LoadingSpinner } from "@/components/shared/loading-spinner";
import { fetchFeatureCorrelation } from "@/lib/api/admin";
import type { FeatureCorrelationData, FeatureCorrelationGroup } from "@/lib/api/types";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";

const FEATURE_LABELS: Record<string, string> = {
  listening: "听力",
  reading: "阅读",
  writing: "写作",
  speaking: "口语",
  conversation: "AI 对话",
  vocabulary: "词汇",
};

export function PaidFeatureUsage() {
  const [data, setData] = useState<FeatureCorrelationData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchFeatureCorrelation(90)
      .then(setData)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="flex h-40 items-center justify-center"><LoadingSpinner /></div>;

  if (!data || data.groups.length === 0) {
    return <p className="py-8 text-center text-muted-foreground">暂无功能使用数据</p>;
  }

  const paidGroup = data.groups.find(g => g.group === "paid");
  const freeGroup = data.groups.find(g => g.group === "free");

  // Build chart data
  const features = ["listening", "reading", "writing", "speaking", "conversation", "vocabulary"] as const;
  type FeatureKey = typeof features[number];
  const getFeatureCount = (group: FeatureCorrelationGroup | undefined, key: FeatureKey): number =>
    group ? group[key] : 0;
  const chartData = features.map(f => ({
    name: FEATURE_LABELS[f] || f,
    付费用户: getFeatureCount(paidGroup, f),
    免费用户: getFeatureCount(freeGroup, f),
  }));

  // Find top feature for paid users
  const topFeature = chartData.reduce((max, cur) => cur.付费用户 > max.付费用户 ? cur : max, chartData[0]);

  return (
    <div className="space-y-6">
      {/* Insight */}
      <Card>
        <CardContent className="py-4">
          <p className="text-sm">
            过去 90 天内，付费用户最常使用的功能是
            <strong className="mx-1 text-indigo-600">{topFeature.name}</strong>
            （{topFeature.付费用户} 人使用），
            共有 <strong>{paidGroup?.users || 0}</strong> 位付费用户
            和 <strong>{freeGroup?.users || 0}</strong> 位免费用户。
          </p>
        </CardContent>
      </Card>

      {/* Horizontal bar chart */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">付费 vs 免费用户功能使用对比</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={320}>
            <BarChart data={chartData} layout="vertical" margin={{ left: 20 }}>
              <CartesianGrid strokeDasharray="3 3" horizontal={false} />
              <XAxis type="number" />
              <YAxis type="category" dataKey="name" width={70} tick={{ fontSize: 13 }} />
              <Tooltip />
              <Legend />
              <Bar dataKey="付费用户" fill="#6366f1" radius={[0, 4, 4, 0]} />
              <Bar dataKey="免费用户" fill="#d1d5db" radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Detail table */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">详细数据</CardTitle>
        </CardHeader>
        <CardContent>
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b text-left text-muted-foreground">
                <th className="pb-2">功能</th>
                <th className="pb-2 text-right">付费用户</th>
                <th className="pb-2 text-right">免费用户</th>
                <th className="pb-2 text-right">付费使用率</th>
              </tr>
            </thead>
            <tbody>
              {chartData.map(row => {
                const paidRate = (paidGroup?.users || 0) > 0
                  ? ((row.付费用户 / (paidGroup?.users || 1)) * 100).toFixed(0)
                  : "0";
                return (
                  <tr key={row.name} className="border-b last:border-0">
                    <td className="py-2 font-medium">{row.name}</td>
                    <td className="py-2 text-right font-semibold text-indigo-600">{row.付费用户}</td>
                    <td className="py-2 text-right text-muted-foreground">{row.免费用户}</td>
                    <td className="py-2 text-right">{paidRate}%</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </CardContent>
      </Card>
    </div>
  );
}
