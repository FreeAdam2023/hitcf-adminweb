"use client";

import { useState, useEffect } from "react";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { LoadingSpinner } from "@/components/shared/loading-spinner";
import { fetchAnalyticsInsights, fetchSubscriptionRevenue } from "@/lib/api/admin";
import type { AnalyticsInsights, SubscriptionRevenue } from "@/lib/api/types";

const FEATURE_LABELS: Record<string, string> = {
  listening: "Listening",
  reading: "Reading",
  writing: "Writing",
  speaking_practice: "Speaking Practice",
  speaking_conversation: "Speaking Conversation",
  vocabulary: "Vocabulary",
};

const FEATURE_COLORS: Record<string, string> = {
  listening: "bg-purple-500",
  reading: "bg-blue-500",
  writing: "bg-orange-500",
  speaking_practice: "bg-green-500",
  speaking_conversation: "bg-teal-500",
  vocabulary: "bg-pink-500",
};

function StatCard({ label, value, sub }: { label: string; value: string | number; sub?: string }) {
  return (
    <div className="text-center">
      <p className="text-2xl font-bold">{value}</p>
      <p className="text-xs text-muted-foreground">{label}</p>
      {sub && <p className="text-xs text-muted-foreground mt-0.5">{sub}</p>}
    </div>
  );
}

export function InsightsPanel() {
  const [data, setData] = useState<AnalyticsInsights | null>(null);
  const [revenue, setRevenue] = useState<SubscriptionRevenue | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      fetchAnalyticsInsights(),
      fetchSubscriptionRevenue(),
    ])
      .then(([insights, rev]) => {
        setData(insights);
        setRevenue(rev);
      })
      .catch((e) => toast.error(e.message || "Failed to load insights"))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <LoadingSpinner />;
  if (!data) return null;

  const maxFeatureUsage = Math.max(...Object.values(data.feature_usage), 1);
  const maxCohortRegistered = Math.max(...data.conversion.cohorts.map((c) => c.registered), 1);

  // Score distribution max for bar scaling
  const maxScoreBucket = Math.max(
    ...data.score_distribution.map((b) => b.listening + b.reading),
    1,
  );

  // MRR pie data
  const planColors: Record<string, string> = {
    monthly: "bg-blue-500",
    quarterly: "bg-green-500",
    yearly: "bg-amber-500",
  };

  // Trial pie segments
  const trialTotal = data.trial_conversion.total_trialed || 1;
  const trialSegments = [
    { label: "Converted", value: data.trial_conversion.converted, color: "bg-green-500" },
    { label: "Churned", value: data.trial_conversion.churned, color: "bg-red-500" },
    { label: "Trialing", value: data.trial_conversion.still_trialing, color: "bg-blue-500" },
  ];

  return (
    <div className="space-y-6">
      {/* 1. User Retention */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">User Retention (Registered Last 60 Days)</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground mb-4">
            {data.retention.total_registered} users registered
          </p>
          <div className="flex items-end gap-8 justify-center">
            {(["d1", "d7", "d30"] as const).map((key) => {
              const count = data.retention[key];
              const rate = data.retention[`${key}_rate` as const];
              const maxRate = Math.max(data.retention.d1_rate, data.retention.d7_rate, data.retention.d30_rate, 1);
              const height = Math.max((rate / maxRate) * 120, 8);
              return (
                <div key={key} className="flex flex-col items-center gap-1">
                  <span className="text-sm font-medium">{rate}%</span>
                  <div
                    className="w-16 bg-primary rounded-t transition-all"
                    style={{ height: `${height}px` }}
                  />
                  <span className="text-xs text-muted-foreground">
                    {key.toUpperCase()} ({count})
                  </span>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* 2. Feature Usage */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Feature Usage (Last 30 Days, Unique Users)</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {Object.entries(data.feature_usage).map(([key, count]) => {
              const pct = Math.round((count / maxFeatureUsage) * 100);
              return (
                <div key={key} className="flex items-center gap-3">
                  <span className="w-40 shrink-0 text-sm">
                    {FEATURE_LABELS[key] || key}
                  </span>
                  <div className="flex-1 h-6 rounded bg-muted overflow-hidden">
                    <div
                      className={`h-full rounded transition-all ${FEATURE_COLORS[key] || "bg-primary"}`}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                  <span className="w-10 shrink-0 text-right text-sm font-medium">
                    {count}
                  </span>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* 3. Registration → Activation */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Registration → Activation</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-8 justify-center mb-6">
            <StatCard label="Registered" value={data.conversion.total_registered.toLocaleString()} />
            <StatCard label="Activated" value={data.conversion.activated.toLocaleString()} />
            <StatCard label="Conversion Rate" value={`${data.conversion.conversion_rate}%`} />
          </div>
          {data.conversion.cohorts.length > 0 && (
            <>
              <h4 className="text-sm font-medium text-muted-foreground mb-3">Monthly Cohorts</h4>
              <div className="space-y-2">
                {data.conversion.cohorts.map((c) => (
                  <div key={c.month} className="flex items-center gap-3 text-sm">
                    <span className="w-20 shrink-0 text-muted-foreground">{c.month}</span>
                    <div className="flex-1 h-5 rounded bg-muted overflow-hidden flex">
                      <div
                        className="h-full bg-blue-400"
                        style={{ width: `${(c.registered / maxCohortRegistered) * 100}%` }}
                        title={`Registered: ${c.registered}`}
                      />
                    </div>
                    <div className="flex-1 h-5 rounded bg-muted overflow-hidden flex">
                      <div
                        className="h-full bg-green-500"
                        style={{ width: `${(c.activated / maxCohortRegistered) * 100}%` }}
                        title={`Activated: ${c.activated}`}
                      />
                    </div>
                    <span className="w-16 shrink-0 text-right text-xs">
                      {c.rate}% ({c.activated}/{c.registered})
                    </span>
                  </div>
                ))}
                <div className="flex gap-4 text-xs text-muted-foreground mt-1">
                  <span className="flex items-center gap-1">
                    <span className="w-3 h-3 rounded bg-blue-400 inline-block" /> Registered
                  </span>
                  <span className="flex items-center gap-1">
                    <span className="w-3 h-3 rounded bg-green-500 inline-block" /> Activated
                  </span>
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* 4. MRR Snapshot */}
      {revenue && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">MRR Snapshot</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex gap-8 justify-center mb-6">
              <StatCard
                label="Estimated MRR"
                value={`$${revenue.estimated_mrr.toFixed(2)}`}
              />
              <StatCard label="Active" value={revenue.total_active} />
              <StatCard label="Trialing" value={revenue.total_trialing} />
              <StatCard label="Cancelled" value={revenue.total_cancelled} />
            </div>
            {Object.keys(revenue.by_plan).length > 0 && (
              <div className="space-y-2">
                <h4 className="text-sm font-medium text-muted-foreground mb-2">By Plan</h4>
                {Object.entries(revenue.by_plan).map(([plan, count]) => {
                  const totalSubs = Object.values(revenue.by_plan).reduce((a, b) => a + b, 0) || 1;
                  const pct = Math.round((count / totalSubs) * 100);
                  return (
                    <div key={plan} className="flex items-center gap-3">
                      <span className="w-24 shrink-0 text-sm capitalize">{plan}</span>
                      <div className="flex-1 h-5 rounded bg-muted overflow-hidden">
                        <div
                          className={`h-full rounded ${planColors[plan] || "bg-primary"}`}
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                      <span className="w-16 shrink-0 text-right text-sm">
                        {count} ({pct}%)
                      </span>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* 5. Trial → Paid */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Trial → Paid Conversion</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-6 justify-center mb-6">
            <StatCard label="Total Trialed" value={data.trial_conversion.total_trialed} />
            <StatCard label="Converted" value={data.trial_conversion.converted} sub={`${data.trial_conversion.conversion_rate}%`} />
            <StatCard label="Churned" value={data.trial_conversion.churned} sub={`${data.trial_conversion.churn_rate}%`} />
            <StatCard label="Still Trialing" value={data.trial_conversion.still_trialing} />
          </div>
          {data.trial_conversion.total_trialed > 0 && (
            <div className="flex items-center gap-1 h-6 rounded overflow-hidden">
              {trialSegments.map((seg) => {
                const pct = (seg.value / trialTotal) * 100;
                if (pct === 0) return null;
                return (
                  <div
                    key={seg.label}
                    className={`h-full ${seg.color} transition-all`}
                    style={{ width: `${pct}%` }}
                    title={`${seg.label}: ${seg.value} (${pct.toFixed(1)}%)`}
                  />
                );
              })}
            </div>
          )}
          <div className="flex gap-4 text-xs text-muted-foreground mt-2">
            {trialSegments.map((seg) => (
              <span key={seg.label} className="flex items-center gap-1">
                <span className={`w-3 h-3 rounded ${seg.color} inline-block`} />
                {seg.label}
              </span>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* 6. Score Distribution */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Score Distribution (Completed Attempts)</CardTitle>
        </CardHeader>
        <CardContent>
          {data.score_distribution.length === 0 ? (
            <p className="text-sm text-muted-foreground">No score data available.</p>
          ) : (
            <>
              <div className="space-y-1.5">
                {data.score_distribution.map((bucket) => {
                  const total = bucket.listening + bucket.reading;
                  const pct = Math.round((total / maxScoreBucket) * 100);
                  const listeningPct = total > 0 ? (bucket.listening / total) * pct : 0;
                  const readingPct = total > 0 ? (bucket.reading / total) * pct : 0;
                  return (
                    <div key={bucket.range} className="flex items-center gap-3 text-sm">
                      <span className="w-14 shrink-0 text-muted-foreground text-xs">
                        {bucket.range}%
                      </span>
                      <div className="flex-1 h-5 rounded bg-muted overflow-hidden flex">
                        <div
                          className="h-full bg-purple-500"
                          style={{ width: `${listeningPct}%` }}
                        />
                        <div
                          className="h-full bg-blue-500"
                          style={{ width: `${readingPct}%` }}
                        />
                      </div>
                      <span className="w-20 shrink-0 text-right text-xs">
                        L:{bucket.listening} R:{bucket.reading}
                      </span>
                    </div>
                  );
                })}
              </div>
              <div className="flex gap-4 text-xs text-muted-foreground mt-2">
                <span className="flex items-center gap-1">
                  <span className="w-3 h-3 rounded bg-purple-500 inline-block" /> Listening
                </span>
                <span className="flex items-center gap-1">
                  <span className="w-3 h-3 rounded bg-blue-500 inline-block" /> Reading
                </span>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
