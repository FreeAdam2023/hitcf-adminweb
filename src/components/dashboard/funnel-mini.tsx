"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { fetchFunnel } from "@/lib/api/admin";
import type { FunnelData } from "@/lib/api/types";
import { ArrowRight, Funnel } from "lucide-react";

export function FunnelMini() {
  const [data, setData] = useState<FunnelData | null>(null);

  useEffect(() => {
    fetchFunnel(30).then(setData).catch(() => {});
  }, []);

  if (!data || data.steps.length < 2) return null;

  const registered = data.steps.find(s => s.name === "registered");
  const paid = data.steps.find(s => s.name === "paid");
  if (!registered || !paid) return null;

  const conversionRate = registered.count > 0
    ? ((paid.count / registered.count) * 100).toFixed(1)
    : "0";

  return (
    <Card>
      <CardContent className="flex items-center gap-4 py-3">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-indigo-100 dark:bg-indigo-900">
          <Funnel className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
        </div>
        <div className="flex-1">
          <div className="text-sm font-medium">
            30 天转化率：
            <span className="ml-1 text-lg font-bold text-indigo-600 dark:text-indigo-400">
              {conversionRate}%
            </span>
          </div>
          <div className="text-xs text-muted-foreground">
            注册 {registered.count} → 付费 {paid.count}
          </div>
        </div>
        <Link
          href="/analytics"
          className="flex items-center gap-1 text-xs font-medium text-muted-foreground hover:text-foreground"
        >
          完整漏斗 <ArrowRight className="h-3.5 w-3.5" />
        </Link>
      </CardContent>
    </Card>
  );
}
