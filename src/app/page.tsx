"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { PageHeader } from "@/components/shared/page-header";
import { LoadingSpinner } from "@/components/shared/loading-spinner";
import { fetchAdminStats, fetchAuditLogs, fetchBatchStatus } from "@/lib/api/admin";
import type { AdminStats, AuditLogItem, BatchStatus, PaginatedResponse } from "@/lib/api/types";
import { Users, CreditCard, BookOpen, FileText, BarChart3, AlertTriangle, ListChecks, Volume2, Lightbulb, AlertCircle, ArrowRight, Shield, Loader2, Mic, BookMarked } from "lucide-react";

export default function DashboardPage() {
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [recentActions, setRecentActions] = useState<AuditLogItem[]>([]);
  const [batchStatus, setBatchStatus] = useState<BatchStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [data, logs, batch] = await Promise.all([
        fetchAdminStats(),
        fetchAuditLogs({ page_size: 5 }).catch(() => ({ items: [] })),
        fetchBatchStatus().catch(() => null),
      ]);
      setStats(data);
      setRecentActions((logs as PaginatedResponse<AuditLogItem>).items || []);
      setBatchStatus(batch);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load stats");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <LoadingSpinner />
      </div>
    );
  }

  if (error || !stats) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <AlertCircle className="mb-4 h-12 w-12 text-destructive" />
        <h3 className="text-lg font-medium">Failed to load dashboard</h3>
        <p className="mt-1 text-sm text-muted-foreground">
          {error || "Unable to load statistics."}
        </p>
        <Button className="mt-6" onClick={load}>
          Retry
        </Button>
      </div>
    );
  }

  const overviewCards = [
    { label: "Total Users", value: stats.user_count ?? 0, icon: Users },
    { label: "Active Subscriptions", value: stats.active_subscription_count ?? 0, icon: CreditCard },
    { label: "Test Sets", value: stats.test_set_count ?? 0, icon: BookOpen },
    { label: "Questions", value: stats.question_count ?? 0, icon: FileText },
    { label: "Total Attempts", value: stats.attempt_count ?? 0, icon: BarChart3 },
    { label: "Speaking Attempts", value: stats.speaking_attempt_count ?? 0, icon: Mic },
    { label: "Saved Words", value: stats.saved_word_count ?? 0, icon: BookMarked },
    { label: "Nihao Words", value: stats.nihao_word_count ?? 0, icon: BookOpen },
  ];

  const qualityCards = [
    { label: "Missing Answer", value: stats.questions_without_answer ?? 0, icon: AlertTriangle, color: "text-amber-600", href: "/questions" },
    { label: "Missing Options", value: stats.questions_without_options ?? 0, icon: ListChecks, color: "text-amber-600", href: "/questions" },
    { label: "Missing Audio", value: stats.questions_without_audio ?? 0, icon: Volume2, color: "text-amber-600", href: "/data" },
    { label: "Has Explanation", value: stats.questions_with_explanation ?? 0, icon: Lightbulb, color: "text-green-600", href: "/explanations" },
  ];

  return (
    <div className="space-y-6">
      <PageHeader title="Dashboard" description="Overview of your platform" />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-4">
        {overviewCards.map((c) => (
          <Card key={c.label}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{c.label}</CardTitle>
              <c.icon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{c.value.toLocaleString()}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Data Quality */}
        <div>
          <h2 className="mb-3 text-lg font-semibold">Data Quality</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            {qualityCards.map((c) => (
              <Link key={c.label} href={c.href}>
                <Card className="transition-colors hover:bg-accent/50">
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">{c.label}</CardTitle>
                    <c.icon className={`h-4 w-4 ${c.color}`} />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{c.value.toLocaleString()}</div>
                    <p className="text-xs text-muted-foreground">
                      of {(stats.question_count ?? 0).toLocaleString()} questions
                    </p>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        </div>

        {/* Right column: Batch Status + Recent Actions */}
        <div className="space-y-4">
          {/* Batch Generation Status */}
          {batchStatus && batchStatus.total > 0 && (
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Batch Generation</CardTitle>
                {batchStatus.running && <Loader2 className="h-4 w-4 animate-spin text-primary" />}
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between text-sm mb-2">
                  <span>{batchStatus.running ? "Running" : "Complete"}</span>
                  <span className="text-muted-foreground">
                    {batchStatus.completed + batchStatus.failed} / {batchStatus.total}
                  </span>
                </div>
                <div className="h-2 rounded-full bg-muted">
                  <div
                    className="h-2 rounded-full bg-primary transition-all"
                    style={{ width: `${batchStatus.total > 0 ? ((batchStatus.completed + batchStatus.failed) / batchStatus.total) * 100 : 0}%` }}
                  />
                </div>
                {batchStatus.failed > 0 && (
                  <p className="text-xs text-red-600 mt-1">{batchStatus.failed} failed</p>
                )}
              </CardContent>
            </Card>
          )}

          {/* Recent Actions */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Recent Actions</CardTitle>
              <Link href="/audit">
                <Button variant="ghost" size="sm">
                  View All <ArrowRight className="ml-1 h-3 w-3" />
                </Button>
              </Link>
            </CardHeader>
            <CardContent>
              {recentActions.length === 0 ? (
                <p className="text-sm text-muted-foreground">No recent actions</p>
              ) : (
                <div className="space-y-3">
                  {recentActions.map((log) => (
                    <div key={log.id} className="flex items-center justify-between text-sm">
                      <div className="flex items-center gap-2 min-w-0">
                        <Shield className="h-3 w-3 text-muted-foreground shrink-0" />
                        <span className="font-mono text-xs truncate">{log.action}</span>
                        <Badge variant="outline" className="text-[10px] shrink-0">{log.target_type}</Badge>
                      </div>
                      <span className="text-xs text-muted-foreground shrink-0 ml-2">
                        {new Date(log.created_at).toLocaleDateString()}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Quick Links */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium">Quick Links</CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-2 gap-2">
              <Link href="/data">
                <Button variant="outline" size="sm" className="w-full justify-start">
                  <Volume2 className="mr-2 h-3 w-3" />
                  {stats.questions_without_audio ?? 0} missing audio
                </Button>
              </Link>
              <Link href="/explanations">
                <Button variant="outline" size="sm" className="w-full justify-start">
                  <Lightbulb className="mr-2 h-3 w-3" />
                  {((stats.question_count ?? 0) - (stats.questions_with_explanation ?? 0))} need explanation
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
