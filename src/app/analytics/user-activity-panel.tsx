"use client";

import { useState, useEffect } from "react";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { LoadingSpinner } from "@/components/shared/loading-spinner";
import { Badge } from "@/components/ui/badge";
import { fetchUserActivity } from "@/lib/api/admin";
import type { UserActivityData } from "@/lib/api/types";
import { Clock, Activity, UserCheck } from "lucide-react";

const DOW_LABELS = ["日", "一", "二", "三", "四", "五", "六"];
const HOUR_LABELS = Array.from({ length: 24 }, (_, i) => `${i}`);

const ACTION_BADGES: Record<string, { label: string; color: string }> = {
  register: { label: "注册", color: "bg-green-100 text-green-800" },
  attempt: { label: "做题", color: "bg-blue-100 text-blue-800" },
  writing: { label: "写作", color: "bg-orange-100 text-orange-800" },
  speaking: { label: "口语", color: "bg-purple-100 text-purple-800" },
  conversation: { label: "AI对话", color: "bg-teal-100 text-teal-800" },
  vocab: { label: "词汇", color: "bg-pink-100 text-pink-800" },
};

function getHeatColor(value: number, max: number): string {
  if (value === 0) return "bg-muted";
  const ratio = value / max;
  if (ratio < 0.25) return "bg-green-200 dark:bg-green-900";
  if (ratio < 0.5) return "bg-green-400 dark:bg-green-700";
  if (ratio < 0.75) return "bg-green-600 dark:bg-green-500";
  return "bg-green-800 dark:bg-green-400";
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

  return (
    <div className="space-y-6">
      {/* Hourly Heatmap */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-base">活跃时段分布 (近90天)</CardTitle>
          <Clock className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr>
                  <th className="w-8" />
                  {HOUR_LABELS.map((h) => (
                    <th key={h} className="text-[10px] text-muted-foreground font-normal px-0.5 text-center">
                      {Number(h) % 3 === 0 ? h : ""}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {data.heatmap.map((row, dow) => (
                  <tr key={dow}>
                    <td className="text-[11px] text-muted-foreground pr-1 text-right">
                      {DOW_LABELS[dow]}
                    </td>
                    {row.map((val, hour) => (
                      <td key={hour} className="p-0.5">
                        <div
                          className={`w-full aspect-square rounded-sm ${getHeatColor(val, maxHeat)} transition-colors`}
                          title={`周${DOW_LABELS[dow]} ${hour}:00 — ${val}次`}
                        />
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="flex items-center gap-1.5 mt-3 text-[10px] text-muted-foreground">
            <span>少</span>
            <div className="w-3 h-3 rounded-sm bg-muted" />
            <div className="w-3 h-3 rounded-sm bg-green-200 dark:bg-green-900" />
            <div className="w-3 h-3 rounded-sm bg-green-400 dark:bg-green-700" />
            <div className="w-3 h-3 rounded-sm bg-green-600 dark:bg-green-500" />
            <div className="w-3 h-3 rounded-sm bg-green-800 dark:bg-green-400" />
            <span>多</span>
          </div>
        </CardContent>
      </Card>

      {/* Activity Feed */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-base">最近用户活动</CardTitle>
          <Activity className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          {data.feed.length === 0 ? (
            <p className="text-sm text-muted-foreground">暂无活动记录</p>
          ) : (
            <div className="space-y-2 max-h-[500px] overflow-y-auto">
              {data.feed.map((event, i) => {
                const badge = ACTION_BADGES[event.action] || { label: event.action, color: "bg-gray-100 text-gray-800" };
                return (
                  <div key={i} className="flex items-start gap-3 py-2 border-b last:border-0">
                    <Badge variant="secondary" className={`shrink-0 text-[10px] ${badge.color}`}>
                      {badge.label}
                    </Badge>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm truncate">{event.desc}</p>
                    </div>
                    <span className="text-xs text-muted-foreground shrink-0 whitespace-nowrap">
                      {formatRelativeTime(event.time)}
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Per-User Summary */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-base">用户活动摘要 (近90天)</CardTitle>
          <UserCheck className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          {data.users.length === 0 ? (
            <p className="text-sm text-muted-foreground">暂无用户</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b text-muted-foreground">
                    <th className="text-left py-2 font-medium">用户</th>
                    <th className="text-center py-2 font-medium">做题</th>
                    <th className="text-center py-2 font-medium">写作</th>
                    <th className="text-center py-2 font-medium">口语</th>
                    <th className="text-center py-2 font-medium">AI对话</th>
                    <th className="text-center py-2 font-medium">词汇</th>
                    <th className="text-center py-2 font-medium">合计</th>
                    <th className="text-right py-2 font-medium">最后活跃</th>
                  </tr>
                </thead>
                <tbody>
                  {data.users.map((u) => (
                    <tr key={u.user_id} className="border-b last:border-0 hover:bg-accent/50">
                      <td className="py-2">
                        <div>
                          <span className="font-medium">{u.name || "—"}</span>
                          <span className="text-xs text-muted-foreground ml-2">{u.email}</span>
                        </div>
                      </td>
                      <td className="text-center py-2">{u.attempts || "—"}</td>
                      <td className="text-center py-2">{u.writing || "—"}</td>
                      <td className="text-center py-2">{u.speaking || "—"}</td>
                      <td className="text-center py-2">{u.conversations || "—"}</td>
                      <td className="text-center py-2">{u.vocab || "—"}</td>
                      <td className="text-center py-2 font-bold">{u.total_actions}</td>
                      <td className="text-right py-2 text-xs text-muted-foreground">
                        {u.last_active ? formatRelativeTime(u.last_active) : "—"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
