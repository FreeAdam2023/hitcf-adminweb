"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { RefreshCw } from "lucide-react";
import { PageHeader } from "@/components/shared/page-header";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { fetchTrialHatch } from "@/lib/api/admin";
import type {
  TrialHatchData,
  TrialHatchEgg,
  TrialHatchCohort,
  TrialHatchDayHeat,
} from "@/lib/api/types";

// ── Status config ──────────────────────────────────────────────

const STATUS_CONFIG: Record<
  string,
  { emoji: string; label: string; color: string; bg: string }
> = {
  incubating: {
    emoji: "🥚",
    label: "孵化中",
    color: "text-amber-600",
    bg: "bg-amber-50 dark:bg-amber-950/30",
  },
  cold: {
    emoji: "🥶",
    label: "蛋冷了",
    color: "text-blue-500",
    bg: "bg-blue-50 dark:bg-blue-950/30",
  },
  hatched: {
    emoji: "🐣",
    label: "孵化成功",
    color: "text-green-600",
    bg: "bg-green-50 dark:bg-green-950/30",
  },
  broken: {
    emoji: "💀",
    label: "蛋碎了",
    color: "text-red-500",
    bg: "bg-red-50 dark:bg-red-950/30",
  },
};

function StatusBadge({ status }: { status: string }) {
  const cfg = STATUS_CONFIG[status] ?? STATUS_CONFIG.broken;
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ${cfg.bg} ${cfg.color}`}
    >
      {cfg.emoji} {cfg.label}
    </span>
  );
}

// ── Summary cards ──────────────────────────────────────────────

function SummaryCards({ summary }: { summary: TrialHatchData["summary"] }) {
  const cards = [
    { label: "总蛋数", value: summary.total, emoji: "🥚", sub: null },
    { label: "孵化成功", value: summary.hatched, emoji: "🐣", sub: `${summary.hatch_rate}%` },
    { label: "蛋碎了", value: summary.broken, emoji: "💀", sub: null },
    { label: "孵化中", value: summary.incubating, emoji: "🥚", sub: null },
    { label: "蛋冷了", value: summary.cold, emoji: "🥶", sub: "预警" },
  ];

  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
      {cards.map((c) => (
        <div key={c.label} className="rounded-xl border bg-card p-4 text-center">
          <div className="text-2xl">{c.emoji}</div>
          <div className="mt-1 text-2xl font-bold tabular-nums">{c.value}</div>
          <div className="text-xs text-muted-foreground">{c.label}</div>
          {c.sub && (
            <div className="mt-0.5 text-xs font-medium text-green-600">{c.sub}</div>
          )}
        </div>
      ))}
    </div>
  );
}

// ── 7-day heatmap ──────────────────────────────────────────────

function DailyHeatmap({ data }: { data: TrialHatchDayHeat[] }) {
  const maxRate = Math.max(...data.map((d) => d.rate), 1);

  return (
    <div className="rounded-xl border bg-card p-4">
      <h3 className="mb-3 text-sm font-semibold">
        {"🌡️ 7天活跃热力图"}
        <span className="ml-2 text-xs font-normal text-muted-foreground">
          试用用户平均每天活跃率
        </span>
      </h3>
      <div className="space-y-2">
        {data.map((d) => {
          const pct = d.rate;
          const width = Math.max((pct / maxRate) * 100, 2);
          let barColor = "bg-red-400";
          if (pct >= 60) barColor = "bg-green-500";
          else if (pct >= 40) barColor = "bg-emerald-400";
          else if (pct >= 25) barColor = "bg-yellow-400";
          else if (pct >= 15) barColor = "bg-orange-400";

          return (
            <div key={d.day} className="flex items-center gap-3">
              <span className="w-8 text-right text-xs font-medium text-muted-foreground">
                {d.label}
              </span>
              <div className="relative h-6 flex-1 overflow-hidden rounded bg-muted/50">
                <div
                  className={`absolute inset-y-0 left-0 rounded ${barColor} transition-all`}
                  style={{ width: `${width}%` }}
                />
                <span className="absolute inset-0 flex items-center pl-2 text-xs font-medium">
                  {pct}%
                  <span className="ml-1 text-muted-foreground">
                    ({d.active}/{d.total})
                  </span>
                </span>
              </div>
            </div>
          );
        })}
      </div>
      {data.length >= 4 && data[3]?.rate < data[0]?.rate * 0.5 && (
        <p className="mt-2 text-xs text-orange-500">
          {"⚠️ D4 活跃率降幅超过 50% —— 考虑在第3天推送提醒邮件"}
        </p>
      )}
    </div>
  );
}

// ── Weekly cohort table ────────────────────────────────────────

function WeeklyCohorts({ data }: { data: TrialHatchCohort[] }) {
  if (!data.length) return <p className="text-sm text-muted-foreground">暂无数据</p>;

  return (
    <div className="rounded-xl border bg-card">
      <div className="p-4 pb-2">
        <h3 className="text-sm font-semibold">{"📊 每周 Cohort 孵化率"}</h3>
      </div>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-24">周</TableHead>
            <TableHead className="text-right">注册</TableHead>
            <TableHead className="text-right">{"🐣 孵化"}</TableHead>
            <TableHead className="text-right">{"💀 碎蛋"}</TableHead>
            <TableHead className="text-right">{"🥚 孕中"}</TableHead>
            <TableHead className="text-right">{"🥶 冷却"}</TableHead>
            <TableHead className="text-right">孵化率</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {data.map((row) => (
            <TableRow key={row.week}>
              <TableCell className="text-xs font-medium">{row.week}</TableCell>
              <TableCell className="text-right tabular-nums">{row.registered}</TableCell>
              <TableCell className="text-right tabular-nums text-green-600">{row.hatched}</TableCell>
              <TableCell className="text-right tabular-nums text-red-500">{row.broken}</TableCell>
              <TableCell className="text-right tabular-nums text-amber-600">{row.incubating}</TableCell>
              <TableCell className="text-right tabular-nums text-blue-500">{row.cold}</TableCell>
              <TableCell className="text-right">
                {row.hatch_rate !== null ? (
                  <HatchRateBar rate={row.hatch_rate} />
                ) : (
                  <span className="text-xs text-muted-foreground">进行中</span>
                )}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}

function HatchRateBar({ rate }: { rate: number }) {
  let color = "bg-red-400";
  if (rate >= 25) color = "bg-green-500";
  else if (rate >= 15) color = "bg-yellow-400";
  else if (rate >= 8) color = "bg-orange-400";

  return (
    <div className="flex items-center justify-end gap-2">
      <div className="h-2 w-16 overflow-hidden rounded-full bg-muted">
        <div
          className={`h-full rounded-full ${color}`}
          style={{ width: `${Math.min(rate, 100)}%` }}
        />
      </div>
      <span className="w-10 text-right text-xs font-medium tabular-nums">{rate}%</span>
    </div>
  );
}

// ── Egg list (real-time) ───────────────────────────────────────

function EggList({
  eggs,
  filter,
  onFilterChange,
}: {
  eggs: TrialHatchEgg[];
  filter: string;
  onFilterChange: (v: string) => void;
}) {
  const filtered = filter === "all" ? eggs : eggs.filter((e) => e.status === filter);

  function timeAgo(iso: string | null): string {
    if (!iso) return "-";
    const diff = Date.now() - new Date(iso).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 60) return `${mins}分钟前`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `${hours}小时前`;
    const days = Math.floor(hours / 24);
    return `${days}天前`;
  }

  return (
    <div className="rounded-xl border bg-card">
      <div className="flex items-center justify-between p-4 pb-2">
        <h3 className="text-sm font-semibold">
          {"🥚 实时蛋列表"}
          <span className="ml-2 text-xs font-normal text-muted-foreground">
            ({filtered.length})
          </span>
        </h3>
        <Select value={filter} onValueChange={onFilterChange}>
          <SelectTrigger className="w-32">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">全部 ({eggs.length})</SelectItem>
            <SelectItem value="cold">
              {"🥶 蛋冷了"} ({eggs.filter((e) => e.status === "cold").length})
            </SelectItem>
            <SelectItem value="incubating">
              {"🥚 孕中"} ({eggs.filter((e) => e.status === "incubating").length})
            </SelectItem>
            <SelectItem value="hatched">
              {"🐣 孵化"} ({eggs.filter((e) => e.status === "hatched").length})
            </SelectItem>
            <SelectItem value="broken">
              {"💀 碎蛋"} ({eggs.filter((e) => e.status === "broken").length})
            </SelectItem>
          </SelectContent>
        </Select>
      </div>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>用户</TableHead>
            <TableHead>状态</TableHead>
            <TableHead className="text-right">天数</TableHead>
            <TableHead>最后活跃</TableHead>
            <TableHead>试用截止</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {filtered.length === 0 && (
            <TableRow>
              <TableCell colSpan={5} className="py-8 text-center text-muted-foreground">
                暂无数据
              </TableCell>
            </TableRow>
          )}
          {filtered.slice(0, 100).map((egg) => (
            <TableRow key={egg.user_id}>
              <TableCell>
                <Link
                  href={`/users/${egg.user_id}`}
                  className="text-sm font-medium text-blue-600 hover:underline dark:text-blue-400"
                >
                  {egg.email}
                </Link>
                {egg.name && (
                  <span className="ml-1 text-xs text-muted-foreground">({egg.name})</span>
                )}
              </TableCell>
              <TableCell>
                <StatusBadge status={egg.status} />
              </TableCell>
              <TableCell className="text-right">
                {egg.status === "broken" ? (
                  <span className="text-xs text-muted-foreground">已过期</span>
                ) : egg.status === "hatched" ? (
                  <Badge variant="outline" className="text-green-600">
                    {egg.current_plan}
                  </Badge>
                ) : (
                  <span className="text-sm font-medium tabular-nums">
                    D{egg.day + 1}/{egg.trial_days}
                  </span>
                )}
              </TableCell>
              <TableCell className="text-xs text-muted-foreground">
                {timeAgo(egg.last_active)}
              </TableCell>
              <TableCell className="text-xs text-muted-foreground">
                {egg.trial_end ? new Date(egg.trial_end).toLocaleDateString("zh-CN") : "-"}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
      {filtered.length > 100 && (
        <div className="border-t p-3 text-center text-xs text-muted-foreground">
          显示前 100 条，共 {filtered.length} 条
        </div>
      )}
    </div>
  );
}

// ── Main page ──────────────────────────────────────────────────

export default function TrialHatchPage() {
  const [data, setData] = useState<TrialHatchData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState("all");
  const [weeks, setWeeks] = useState(12);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await fetchTrialHatch(weeks);
      setData(result);
    } catch (e) {
      setError(e instanceof Error ? e.message : "加载失败");
    } finally {
      setLoading(false);
    }
  }, [weeks]);

  useEffect(() => {
    load();
  }, [load]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <PageHeader
          title="🥚 试用孵化"
          description="7天免费试用留存看板 —— 蛋孵化成小鸡就是转付费，蛋碎了就是流失了"
        />
        <div className="flex items-center gap-2">
          <Select value={String(weeks)} onValueChange={(v) => setWeeks(Number(v))}>
            <SelectTrigger className="w-24">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="4">4 周</SelectItem>
              <SelectItem value="8">8 周</SelectItem>
              <SelectItem value="12">12 周</SelectItem>
              <SelectItem value="24">24 周</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" size="icon" onClick={load} disabled={loading}>
            <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
          </Button>
        </div>
      </div>

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-600 dark:border-red-900 dark:bg-red-950/30">
          {error}
        </div>
      )}

      {loading && !data && (
        <div className="flex items-center justify-center py-20 text-muted-foreground">
          <RefreshCw className="mr-2 h-5 w-5 animate-spin" />
          加载中...
        </div>
      )}

      {data && (
        <>
          <SummaryCards summary={data.summary} />

          <div className="grid gap-6 lg:grid-cols-2">
            <DailyHeatmap data={data.daily_heatmap} />
            <div className="space-y-3 rounded-xl border bg-card p-4">
              <h3 className="text-sm font-semibold">{"💡 快速洞察"}</h3>
              <InsightsList data={data} />
            </div>
          </div>

          <WeeklyCohorts data={data.weekly_cohorts} />

          <EggList eggs={data.eggs} filter={filter} onFilterChange={setFilter} />
        </>
      )}
    </div>
  );
}

// ── Insights (auto-generated) ──────────────────────────────────

function InsightsList({ data }: { data: TrialHatchData }) {
  const insights: string[] = [];
  const s = data.summary;

  if (s.total === 0) {
    insights.push("暂无试用用户数据");
    return (
      <ul className="space-y-1.5 text-xs text-muted-foreground">
        {insights.map((t, i) => (
          <li key={i}>{t}</li>
        ))}
      </ul>
    );
  }

  if (s.hatch_rate > 0) {
    if (s.hatch_rate >= 20) {
      insights.push(`✅ 孵化率 ${s.hatch_rate}%，表现不错！行业平均约 10-15%`);
    } else if (s.hatch_rate >= 10) {
      insights.push(`🟡 孵化率 ${s.hatch_rate}%，接近行业平均`);
    } else {
      insights.push(`🟠 孵化率 ${s.hatch_rate}%，低于行业平均 10-15%，需要优化试用体验`);
    }
  }

  if (s.cold > 0) {
    insights.push(`⚠️ ${s.cold} 个蛋变冷了（试用中但超过2天未活跃），考虑发送提醒邮件`);
  }

  const heatmap = data.daily_heatmap;
  if (heatmap.length >= 2) {
    const d1 = heatmap[0]?.rate ?? 0;
    const d2 = heatmap[1]?.rate ?? 0;
    if (d2 < d1 * 0.5 && d1 > 0) {
      insights.push(
        `📉 D1→D2 活跃率降幅 ${Math.round(((d1 - d2) / d1) * 100)}%，首日体验后流失严重`
      );
    }
  }

  const cohorts = data.weekly_cohorts;
  if (cohorts.length >= 2) {
    const recent = cohorts[0];
    const prev = cohorts[1];
    if (
      recent?.hatch_rate !== null &&
      prev?.hatch_rate !== null &&
      recent.hatch_rate !== undefined &&
      prev.hatch_rate !== undefined
    ) {
      const diff = recent.hatch_rate - prev.hatch_rate;
      if (Math.abs(diff) >= 5) {
        insights.push(
          diff > 0
            ? `📈 最近一周孵化率比上周提升 ${diff.toFixed(1)}%`
            : `📉 最近一周孵化率比上周下降 ${Math.abs(diff).toFixed(1)}%`
        );
      }
    }
  }

  if (s.incubating > 0) {
    insights.push(`🥚 ${s.incubating} 个蛋正在孵化，这些是最有可能转化的用户`);
  }

  if (insights.length === 0) {
    insights.push("数据还在积累中，稍后再查看");
  }

  return (
    <ul className="space-y-2 text-sm">
      {insights.map((t, i) => (
        <li key={i}>{t}</li>
      ))}
    </ul>
  );
}
