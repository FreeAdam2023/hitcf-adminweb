"use client";

import { useEffect, useState } from "react";
import { fetchReferralStats } from "@/lib/api/admin";
import type { ReferralStats } from "@/lib/api/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { LoadingSpinner } from "@/components/shared/loading-spinner";
import { toast } from "sonner";

export function ReferralStatsPanel() {
  const [stats, setStats] = useState<ReferralStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchReferralStats()
      .then(setStats)
      .catch(() => toast.error("加载推荐统计失败"))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <LoadingSpinner />;
  if (!stats) return null;

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              总推荐数
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              待完成
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-amber-600">{stats.pending}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              已完成
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{stats.completed}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              欺诈
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{stats.fraud}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              已发放奖励天数
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {stats.total_referrer_reward_days + stats.total_referee_reward_days}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              推荐人: {stats.total_referrer_reward_days}天 / 被推荐人: {stats.total_referee_reward_days}天
            </p>
          </CardContent>
        </Card>
      </div>

      {stats.top_referrers.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>推荐排行榜</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>#</TableHead>
                  <TableHead>邮箱</TableHead>
                  <TableHead>姓名</TableHead>
                  <TableHead className="text-right">推荐数</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {stats.top_referrers.map((r, i) => (
                  <TableRow key={r.email}>
                    <TableCell className="font-medium">{i + 1}</TableCell>
                    <TableCell>{r.email}</TableCell>
                    <TableCell className="text-muted-foreground">
                      {r.name || "—"}
                    </TableCell>
                    <TableCell className="text-right font-medium">{r.count}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
