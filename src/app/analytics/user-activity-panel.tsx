"use client";

import { useState, useEffect } from "react";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { LoadingSpinner } from "@/components/shared/loading-spinner";
import { Badge } from "@/components/ui/badge";
import { fetchUserActivity } from "@/lib/api/admin";
import type { UserActivityData } from "@/lib/api/types";
import { Clock, Activity, UserCheck } from "lucide-react";

const DOW_LABELS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

const ACTION_META: Record<string, { label: string; color: string; dot: string }> = {
  register: { label: "注册", color: "bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-400", dot: "bg-green-500" },
  attempt: { label: "做题", color: "bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-400", dot: "bg-blue-500" },
  writing: { label: "写作", color: "bg-orange-100 text-orange-800 dark:bg-orange-900/40 dark:text-orange-400", dot: "bg-orange-500" },
  speaking: { label: "口语", color: "bg-purple-100 text-purple-800 dark:bg-purple-900/40 dark:text-purple-400", dot: "bg-purple-500" },
  conversation: { label: "AI对话", color: "bg-teal-100 text-teal-800 dark:bg-teal-900/40 dark:text-teal-400", dot: "bg-teal-500" },
  vocab: { label: "词汇", color: "bg-pink-100 text-pink-800 dark:bg-pink-900/40 dark:text-pink-400", dot: "bg-pink-500" },
};

function getHeatColor(value: number, max: number): string {
  if (value === 0) return "bg-muted/50";
  const ratio = value / max;
  if (ratio < 0.25) return "bg-emerald-200 dark:bg-emerald-900/60";
  if (ratio < 0.5) return "bg-emerald-400 dark:bg-emerald-700";
  if (ratio < 0.75) return "bg-emerald-500 dark:bg-emerald-500";
  return "bg-emerald-700 dark:bg-emerald-400";
}

function formatRelativeTime(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "刚刚";
  if (mins < 60) return `${mins}分钟前`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}小时前`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days}天前`;
  return new Date(iso).toLocaleDateString("zh-CN");
}

export function UserActivityPanel() {
  const [data, setData] = useState<UserActivityData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchUserActivity(90)
      .then(setData)
      .catch((e) => toast.error(e.message || "加载失败"))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <LoadingSpinner />;
  if (!data) return null;

  const maxHeat = Math.max(...data.heatmap.flat(), 1);

  // Compute peak hour & peak day
  let peakHour = 0, peakDay = 0, peakVal = 0;
  data.heatmap.forEach((row, dow) => {
    row.forEach((val, hour) => {
      if (val > peakVal) { peakVal = val; peakDay = dow; peakHour = hour; }
    });
  });
  const totalActivity = data.heatmap.flat().reduce((a, b) => a + b, 0);

  return (
    <div className="space-y-4">
      {/* Row 1: Compact Heatmap + Quick Stats */}
      <div className="grid gap-4 lg:grid-cols-3">
        {/* Heatmap — 2/3 width */}
        <Card className="lg:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">活跃时段 (90天)</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <div className="inline-grid gap-[2px]" style={{ gridTemplateColumns: `28px repeat(24, 1fr)` }}>
                {/* Hour labels */}
                <div />
                {Array.from({ length: 24 }, (_, h) => (
                  <div key={h} className="text-[9px] text-muted-foreground text-center leading-none pb-0.5">
                    {h % 4 === 0 ? `${h}` : ""}
                  </div>
                ))}
                {/* Rows */}
                {data.heatmap.map((row, dow) => (
                  <>
                    <div key={`label-${dow}`} className="text-[10px] text-muted-foreground text-right pr-1 leading-none flex items-center justify-end">
                      {DOW_LABELS[dow]}
                    </div>
                    {row.map((val, hour) => (
                      <div
                        key={`${dow}-${hour}`}
                        className={`w-3.5 h-3.5 rounded-[2px] ${getHeatColor(val, maxHeat)} transition-colors`}
                        title={`${DOW_LABELS[dow]} ${hour}:00 — ${val} 次`}
                      />
                    ))}
                  </>
                ))}
              </div>
            </div>
            <div className="flex items-center gap-1.5 mt-2 text-[9px] text-muted-foreground">
              <span>少</span>
              <div className="w-2.5 h-2.5 rounded-[2px] bg-muted/50" />
              <div className="w-2.5 h-2.5 rounded-[2px] bg-emerald-200 dark:bg-emerald-900/60" />
              <div className="w-2.5 h-2.5 rounded-[2px] bg-emerald-400 dark:bg-emerald-700" />
              <div className="w-2.5 h-2.5 rounded-[2px] bg-emerald-500 dark:bg-emerald-500" />
              <div className="w-2.5 h-2.5 rounded-[2px] bg-emerald-700 dark:bg-emerald-400" />
              <span>多</span>
            </div>
          </CardContent>
        </Card>

        {/* Quick Stats — 1/3 width */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">行为概览</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-lg border p-3 text-center">
                <p className="text-2xl font-bold text-emerald-600">{totalActivity.toLocaleString()}</p>
                <p className="text-[10px] text-muted-foreground">90天总操作</p>
              </div>
              <div className="rounded-lg border p-3 text-center">
                <p className="text-2xl font-bold text-blue-600">{data.users.length}</p>
                <p className="text-[10px] text-muted-foreground">活跃用户数</p>
              </div>
            </div>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">高峰时段</span>
                <span className="font-medium">{DOW_LABELS[peakDay]} {peakHour}:00</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">高峰操作数</span>
                <span className="font-medium">{peakVal}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">日均操作</span>
                <span className="font-medium">{Math.round(totalActivity / 90)}</span>
              </div>
            </div>
            {/* Action type breakdown */}
            <div className="pt-2 border-t">
              <p className="text-[10px] text-muted-foreground mb-2">行为类型分布</p>
              <div className="flex flex-wrap gap-1.5">
                {Object.entries(ACTION_META).map(([key, meta]) => {
                  const count = data.feed.filter((e) => e.action === key).length;
                  if (count === 0) return null;
                  return (
                    <Badge key={key} variant="secondary" className={`text-[10px] ${meta.color}`}>
                      {meta.label} {count}
                    </Badge>
                  );
                })}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Row 2: Activity Timeline + Top Users side by side */}
      <div className="grid gap-4 lg:grid-cols-5">
        {/* Activity Timeline — 2/5 */}
        <Card className="lg:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">实时动态</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {data.feed.length === 0 ? (
              <p className="text-sm text-muted-foreground">暂无活动记录</p>
            ) : (
              <div className="relative max-h-[480px] overflow-y-auto pr-1">
                {/* Timeline line */}
                <div className="absolute left-[5px] top-0 bottom-0 w-px bg-border" />
                <div className="space-y-0">
                  {data.feed.map((event, i) => {
                    const meta = ACTION_META[event.action] || { label: event.action, color: "bg-gray-100 text-gray-800", dot: "bg-gray-400" };
                    return (
                      <div key={i} className="relative flex gap-3 py-2 pl-5">
                        {/* Dot on timeline */}
                        <div className={`absolute left-[2px] top-[14px] h-[7px] w-[7px] rounded-full ${meta.dot} ring-2 ring-background`} />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <Badge variant="secondary" className={`text-[9px] px-1.5 py-0 h-4 ${meta.color}`}>
                              {meta.label}
                            </Badge>
                            <span className="text-[10px] text-muted-foreground shrink-0">
                              {formatRelativeTime(event.time)}
                            </span>
                          </div>
                          <p className="text-xs text-muted-foreground mt-0.5 truncate">{event.desc}</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Per-User Summary — 3/5 */}
        <Card className="lg:col-span-3">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">用户活动排行 (90天)</CardTitle>
            <UserCheck className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {data.users.length === 0 ? (
              <p className="text-sm text-muted-foreground">暂无用户</p>
            ) : (
              <div className="overflow-x-auto max-h-[480px] overflow-y-auto">
                <table className="w-full text-xs">
                  <thead className="sticky top-0 bg-card z-10">
                    <tr className="border-b text-muted-foreground">
                      <th className="text-left py-2 font-medium">用户</th>
                      <th className="text-center py-2 font-medium w-12">做题</th>
                      <th className="text-center py-2 font-medium w-12">写作</th>
                      <th className="text-center py-2 font-medium w-12">口语</th>
                      <th className="text-center py-2 font-medium w-12">AI</th>
                      <th className="text-center py-2 font-medium w-12">词汇</th>
                      <th className="text-center py-2 font-medium w-14">合计</th>
                      <th className="text-right py-2 font-medium w-20">最后活跃</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.users.map((u, idx) => {
                      const maxActions = data.users[0]?.total_actions || 1;
                      const barWidth = Math.round((u.total_actions / maxActions) * 100);
                      return (
                        <tr key={u.user_id} className="border-b last:border-0 hover:bg-accent/50 group">
                          <td className="py-1.5">
                            <div className="flex items-center gap-2">
                              <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-muted text-[10px] font-medium">
                                {idx + 1}
                              </span>
                              <div className="min-w-0">
                                <span className="font-medium text-xs block truncate max-w-[120px]">{u.name || "—"}</span>
                                <span className="text-[10px] text-muted-foreground block truncate max-w-[140px]">{u.email}</span>
                              </div>
                            </div>
                          </td>
                          <td className="text-center py-1.5">{u.attempts || <span className="text-muted-foreground">—</span>}</td>
                          <td className="text-center py-1.5">{u.writing || <span className="text-muted-foreground">—</span>}</td>
                          <td className="text-center py-1.5">{u.speaking || <span className="text-muted-foreground">—</span>}</td>
                          <td className="text-center py-1.5">{u.conversations || <span className="text-muted-foreground">—</span>}</td>
                          <td className="text-center py-1.5">{u.vocab || <span className="text-muted-foreground">—</span>}</td>
                          <td className="text-center py-1.5">
                            <div className="relative">
                              <div className="h-4 rounded bg-muted overflow-hidden">
                                <div className="h-full bg-primary/20 rounded" style={{ width: `${barWidth}%` }} />
                              </div>
                              <span className="absolute inset-0 flex items-center justify-center text-[10px] font-bold">
                                {u.total_actions}
                              </span>
                            </div>
                          </td>
                          <td className="text-right py-1.5 text-[10px] text-muted-foreground">
                            {u.last_active ? formatRelativeTime(u.last_active) : "—"}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
