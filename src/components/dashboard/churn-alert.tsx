"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { fetchChurnRisk } from "@/lib/api/admin";
import type { ChurnRiskData } from "@/lib/api/types";
import { AlertTriangle, ArrowRight } from "lucide-react";

export function ChurnAlert() {
  const [data, setData] = useState<ChurnRiskData | null>(null);

  useEffect(() => {
    fetchChurnRisk(14).then(setData).catch(() => {});
  }, []);

  if (!data || data.at_risk_count === 0) return null;

  return (
    <Card className="border-amber-300 bg-amber-50 dark:border-amber-700 dark:bg-amber-950">
      <CardContent className="flex items-center gap-4 py-3">
        <AlertTriangle className="h-5 w-5 shrink-0 text-amber-600" />
        <div className="flex-1">
          <span className="text-sm font-medium text-amber-900 dark:text-amber-100">
            {data.at_risk_count} 位付费用户超过 {data.inactive_days} 天未活跃
          </span>
          <span className="ml-2 text-xs text-amber-700 dark:text-amber-300">
            {data.at_risk.slice(0, 3).map(u => u.email.split("@")[0]).join(", ")}
            {data.at_risk_count > 3 && " ..."}
          </span>
        </div>
        <Link
          href="/analytics"
          className="flex items-center gap-1 text-xs font-medium text-amber-700 hover:text-amber-900 dark:text-amber-300"
        >
          查看详情 <ArrowRight className="h-3.5 w-3.5" />
        </Link>
      </CardContent>
    </Card>
  );
}
