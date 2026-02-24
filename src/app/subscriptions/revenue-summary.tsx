"use client";

import { useState, useEffect } from "react";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { LoadingSpinner } from "@/components/shared/loading-spinner";
import { fetchSubscriptionRevenue } from "@/lib/api/admin";
import type { SubscriptionRevenue } from "@/lib/api/types";
import { DollarSign, Users, UserCheck, UserX, AlertTriangle } from "lucide-react";

export function RevenueSummary() {
  const [data, setData] = useState<SubscriptionRevenue | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchSubscriptionRevenue()
      .then(setData)
      .catch((e) => toast.error(e.message || "Failed to load revenue"))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <LoadingSpinner />;
  if (!data) return null;

  const cards = [
    { label: "Active", value: data.total_active, icon: UserCheck, color: "text-green-600" },
    { label: "Trialing", value: data.total_trialing, icon: Users, color: "text-blue-600" },
    { label: "Cancelled", value: data.total_cancelled, icon: UserX, color: "text-muted-foreground" },
    { label: "Past Due", value: data.total_past_due, icon: AlertTriangle, color: "text-red-600" },
    { label: "Est. MRR", value: `$${data.estimated_mrr.toLocaleString()}`, icon: DollarSign, color: "text-green-600" },
  ];

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-3 lg:grid-cols-5">
        {cards.map((c) => (
          <Card key={c.label}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{c.label}</CardTitle>
              <c.icon className={`h-4 w-4 ${c.color}`} />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{typeof c.value === "number" ? c.value.toLocaleString() : c.value}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Plan Distribution */}
      {Object.keys(data.by_plan).length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Active by Plan</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {Object.entries(data.by_plan).map(([plan, count]) => {
                const total = data.total_active + data.total_trialing;
                const pct = total > 0 ? Math.round((count / total) * 100) : 0;
                return (
                  <div key={plan}>
                    <div className="flex items-center justify-between text-sm mb-1">
                      <span className="font-medium">{plan}</span>
                      <span className="text-muted-foreground">{count} ({pct}%)</span>
                    </div>
                    <div className="h-2 rounded-full bg-muted">
                      <div
                        className="h-2 rounded-full bg-primary"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
