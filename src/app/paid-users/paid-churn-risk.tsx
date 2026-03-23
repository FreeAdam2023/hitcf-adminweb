"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { LoadingSpinner } from "@/components/shared/loading-spinner";
import { fetchChurnRisk } from "@/lib/api/admin";
import type { ChurnRiskData, ChurnRiskUser } from "@/lib/api/types";
import { ExternalLink, ShieldAlert, CheckCircle2 } from "lucide-react";

function urgencyLevel(days: number): { color: string; label: string } {
  if (days >= 30) return { color: "bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300", label: "高风险" };
  if (days >= 14) return { color: "bg-amber-100 text-amber-700 dark:bg-amber-900 dark:text-amber-300", label: "中风险" };
  return { color: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300", label: "低风险" };
}

export function PaidChurnRisk() {
  const [data, setData] = useState<ChurnRiskData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchChurnRisk(7)
      .then(setData)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="flex h-40 items-center justify-center"><LoadingSpinner /></div>;

  if (!data || data.at_risk_count === 0) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center gap-3 py-12">
          <CheckCircle2 className="h-12 w-12 text-emerald-500" />
          <p className="text-lg font-medium">所有付费用户都很活跃</p>
          <p className="text-sm text-muted-foreground">没有发现流失风险用户</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* Summary */}
      <Card className="border-amber-300 bg-amber-50 dark:border-amber-700 dark:bg-amber-950">
        <CardContent className="flex items-center gap-4 py-4">
          <ShieldAlert className="h-6 w-6 text-amber-600" />
          <div>
            <div className="font-semibold text-amber-900 dark:text-amber-100">
              {data.at_risk_count} / {data.total_subscribers} 位付费用户有流失风险
            </div>
            <div className="text-sm text-amber-700 dark:text-amber-300">
              超过 {data.inactive_days} 天未活跃
            </div>
          </div>
        </CardContent>
      </Card>

      {/* User list */}
      <div className="space-y-3">
        {data.at_risk.map((user: ChurnRiskUser) => {
          const urgency = urgencyLevel(user.days_inactive);
          return (
            <Card key={user.user_id}>
              <CardContent className="flex items-center gap-4 py-4">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-muted text-sm font-bold">
                  {(user.name || user.email)[0].toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-medium truncate">{user.name || "—"}</span>
                    <Badge variant="outline" className="text-[10px]">{user.plan || "—"}</Badge>
                    <Badge className={`text-[10px] ${urgency.color}`}>{urgency.label}</Badge>
                  </div>
                  <div className="text-xs text-muted-foreground">{user.email}</div>
                </div>
                <div className="text-right text-sm">
                  <div className="font-semibold text-red-600">{user.days_inactive} 天</div>
                  <div className="text-xs text-muted-foreground">未活跃</div>
                </div>
                {user.current_period_end && (
                  <div className="text-right text-sm">
                    <div className="font-medium">{new Date(user.current_period_end).toLocaleDateString("zh-CN")}</div>
                    <div className="text-xs text-muted-foreground">到期日</div>
                  </div>
                )}
                <Link
                  href={`/users/${user.user_id}`}
                  className="text-muted-foreground hover:text-foreground"
                >
                  <ExternalLink className="h-4 w-4" />
                </Link>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
