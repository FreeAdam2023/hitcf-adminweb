"use client";

import { useEffect, useState } from "react";
import { fetchFunnel } from "@/lib/api/admin";
import type { FunnelData } from "@/lib/api/types";

export function FunnelPanel() {
  const [data, setData] = useState<FunnelData | null>(null);
  const [days, setDays] = useState(30);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    fetchFunnel(days)
      .then(setData)
      .catch(() => setData(null))
      .finally(() => setLoading(false));
  }, [days]);

  if (loading) return <div className="py-8 text-center text-muted-foreground">加载中...</div>;
  if (!data) return <div className="py-8 text-center text-muted-foreground">暂无数据</div>;

  const maxCount = Math.max(...data.steps.map((s) => s.count), 1);

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <span className="text-sm text-muted-foreground">时间范围:</span>
        {[7, 30, 90].map((d) => (
          <button
            key={d}
            onClick={() => setDays(d)}
            className={`rounded-md px-3 py-1 text-sm ${
              days === d ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground hover:bg-accent"
            }`}
          >
            {d}天
          </button>
        ))}
      </div>

      <div className="rounded-lg border bg-card p-6">
        <h3 className="mb-6 text-lg font-semibold">转化漏斗</h3>
        <div className="space-y-4">
          {data.steps.map((step, i) => {
            const width = Math.max((step.count / maxCount) * 100, 2);
            return (
              <div key={step.name} className="space-y-1">
                <div className="flex items-center justify-between text-sm">
                  <span className="font-medium">{step.label}</span>
                  <div className="flex items-center gap-3">
                    <span className="font-mono font-bold">{step.count}</span>
                    {i > 0 && (
                      <span className={`text-xs ${step.rate < 30 ? "text-red-500" : step.rate < 60 ? "text-yellow-500" : "text-green-500"}`}>
                        {step.rate}%
                      </span>
                    )}
                  </div>
                </div>
                <div className="h-8 w-full rounded bg-muted">
                  <div
                    className="flex h-full items-center rounded bg-primary/80 px-2 text-xs text-primary-foreground transition-all"
                    style={{ width: `${width}%` }}
                  >
                    {step.count > 0 && width > 10 ? step.count : ""}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Step-to-step conversion rates */}
      <div className="grid gap-3 md:grid-cols-4">
        {data.steps.slice(1).map((step, i) => {
          const prev = data.steps[i];
          const dropoff = prev.count > 0 ? prev.count - step.count : 0;
          return (
            <div key={step.name} className="rounded-lg border bg-card p-4 text-center">
              <p className="text-xs text-muted-foreground">
                {prev.label} → {step.label}
              </p>
              <p className={`text-2xl font-bold ${step.rate < 30 ? "text-red-500" : step.rate < 60 ? "text-yellow-500" : "text-green-500"}`}>
                {step.rate}%
              </p>
              <p className="text-xs text-muted-foreground">流失 {dropoff} 人</p>
            </div>
          );
        })}
      </div>
    </div>
  );
}
