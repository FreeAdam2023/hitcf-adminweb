"use client";

import { useState, useEffect } from "react";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { LoadingSpinner } from "@/components/shared/loading-spinner";
import { fetchAnalyticsOverview } from "@/lib/api/admin";
import type { AnalyticsOverview } from "@/lib/api/types";
import { BarChart3, Target, Users, Zap } from "lucide-react";

const MODE_LABELS: Record<string, { label: string; icon: typeof BarChart3; color: string }> = {
  practice: { label: "Practice", icon: BarChart3, color: "text-blue-600" },
  exam: { label: "Exam", icon: Target, color: "text-green-600" },
  speed_drill: { label: "Speed Drill", icon: Zap, color: "text-orange-500" },
};

const TYPE_COLORS: Record<string, string> = {
  listening: "text-purple-600",
  reading: "text-blue-600",
  speaking: "text-green-600",
  writing: "text-orange-600",
};

export function OverviewCharts() {
  const [data, setData] = useState<AnalyticsOverview | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAnalyticsOverview()
      .then(setData)
      .catch((e) => toast.error(e.message || "Failed to load analytics"))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <LoadingSpinner />;
  if (!data) return null;

  const maxDailyAttempts = Math.max(...data.daily_attempts.map((d) => d.count), 1);
  const maxDau = Math.max(...data.dau.map((d) => d.dau), 1);

  return (
    <div className="space-y-6">
      {/* Mode Distribution */}
      <div>
        <h3 className="text-sm font-medium text-muted-foreground mb-3">Mode Distribution</h3>
        <div className="grid gap-4 md:grid-cols-3">
          {Object.entries(data.by_mode).map(([mode, count]) => {
            const meta = MODE_LABELS[mode] || { label: mode, icon: BarChart3, color: "text-muted-foreground" };
            const Icon = meta.icon;
            return (
              <Card key={mode}>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">{meta.label}</CardTitle>
                  <Icon className={`h-4 w-4 ${meta.color}`} />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{count.toLocaleString()}</div>
                  <p className="text-xs text-muted-foreground">total attempts</p>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>

      {/* Average Score by Type */}
      <div>
        <h3 className="text-sm font-medium text-muted-foreground mb-3">Average Score by Type</h3>
        <div className="grid gap-4 md:grid-cols-4">
          {Object.entries(data.avg_score_by_type).map(([type, info]) => (
            <Card key={type}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium capitalize">{type}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className={`text-2xl font-bold ${TYPE_COLORS[type] || ""}`}>
                  {info.avg_score.toFixed(1)}%
                </div>
                <p className="text-xs text-muted-foreground">
                  from {info.count.toLocaleString()} attempts
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Daily Attempts Chart */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Daily Attempts (Last 30 Days)</CardTitle>
        </CardHeader>
        <CardContent>
          {data.daily_attempts.length === 0 ? (
            <p className="text-sm text-muted-foreground">No attempt data available.</p>
          ) : (
            <div className="space-y-1.5">
              {data.daily_attempts.map((day) => {
                const pct = Math.round((day.count / maxDailyAttempts) * 100);
                return (
                  <div key={day.date} className="flex items-center gap-3 text-sm">
                    <span className="w-20 shrink-0 text-muted-foreground text-xs">
                      {day.date.slice(5)}
                    </span>
                    <div className="flex-1 h-5 rounded bg-muted overflow-hidden">
                      <div
                        className="h-full rounded bg-primary transition-all"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                    <span className="w-10 shrink-0 text-right text-xs font-medium">
                      {day.count}
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* DAU Chart */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0">
          <CardTitle className="text-base">Daily Active Users (Last 30 Days)</CardTitle>
          <Users className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          {data.dau.length === 0 ? (
            <p className="text-sm text-muted-foreground">No DAU data available.</p>
          ) : (
            <div className="space-y-1.5">
              {data.dau.map((day) => {
                const pct = Math.round((day.dau / maxDau) * 100);
                return (
                  <div key={day.date} className="flex items-center gap-3 text-sm">
                    <span className="w-20 shrink-0 text-muted-foreground text-xs">
                      {day.date.slice(5)}
                    </span>
                    <div className="flex-1 h-5 rounded bg-muted overflow-hidden">
                      <div
                        className="h-full rounded bg-green-500 transition-all"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                    <span className="w-10 shrink-0 text-right text-xs font-medium">
                      {day.dau}
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
