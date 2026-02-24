"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { PageHeader } from "@/components/shared/page-header";
import { LoadingSpinner } from "@/components/shared/loading-spinner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card, CardContent, CardHeader, CardTitle,
} from "@/components/ui/card";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { fetchAttemptDetail } from "@/lib/api/admin";
import type { AdminAttemptDetail } from "@/lib/api/types";
import { ArrowLeft, Check, X } from "lucide-react";

export default function AttemptDetailPage({ params }: { params: { id: string } }) {
  const [data, setData] = useState<AdminAttemptDetail | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAttemptDetail(params.id)
      .then(setData)
      .finally(() => setLoading(false));
  }, [params.id]);

  const formatDateTime = (d: string | null) => {
    if (!d) return "-";
    return new Date(d).toLocaleString("zh-CN", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    });
  };

  const statusBadgeVariant = (s: string) => {
    switch (s) {
      case "completed": return "default" as const;
      case "in_progress": return "secondary" as const;
      case "abandoned": return "destructive" as const;
      default: return "outline" as const;
    }
  };

  if (loading) {
    return <div className="flex h-64 items-center justify-center"><LoadingSpinner /></div>;
  }
  if (!data) {
    return <p className="text-center text-muted-foreground">Attempt not found.</p>;
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Attempt Detail"
        description={`${data.user_email} - ${data.test_set_name}`}
        actions={
          <Button variant="outline" asChild>
            <Link href="/attempts">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Attempts
            </Link>
          </Button>
        }
      />

      <Card>
        <CardHeader>
          <CardTitle>Overview</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4 text-sm md:grid-cols-3 lg:grid-cols-4">
            <div>
              <span className="text-xs text-muted-foreground">User Email</span>
              <p className="font-medium">{data.user_email}</p>
            </div>
            <div>
              <span className="text-xs text-muted-foreground">Test Set</span>
              <p className="font-medium">{data.test_set_name}</p>
            </div>
            <div>
              <span className="text-xs text-muted-foreground">Mode</span>
              <p><Badge variant="secondary">{data.mode}</Badge></p>
            </div>
            <div>
              <span className="text-xs text-muted-foreground">Status</span>
              <p><Badge variant={statusBadgeVariant(data.status)}>{data.status}</Badge></p>
            </div>
            <div>
              <span className="text-xs text-muted-foreground">Score</span>
              <p className="font-medium">
                {data.score !== null ? `${data.score} / ${data.total}` : "-"}
              </p>
            </div>
            <div>
              <span className="text-xs text-muted-foreground">Answered</span>
              <p className="font-medium">{data.answered_count} / {data.total}</p>
            </div>
            <div>
              <span className="text-xs text-muted-foreground">Started At</span>
              <p className="font-medium">{formatDateTime(data.started_at)}</p>
            </div>
            <div>
              <span className="text-xs text-muted-foreground">Completed At</span>
              <p className="font-medium">{formatDateTime(data.completed_at)}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {data.answers.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Answers</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-16">#</TableHead>
                  <TableHead>Selected</TableHead>
                  <TableHead className="text-center">Correct?</TableHead>
                  <TableHead className="text-right">Time Spent</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.answers.map((ans) => (
                  <TableRow key={ans.question_number}>
                    <TableCell className="font-medium">{ans.question_number}</TableCell>
                    <TableCell>{ans.selected ?? "-"}</TableCell>
                    <TableCell className="text-center">
                      {ans.is_correct === null ? (
                        <span className="text-muted-foreground">-</span>
                      ) : ans.is_correct ? (
                        <Check className="inline h-4 w-4 text-green-600" />
                      ) : (
                        <X className="inline h-4 w-4 text-red-500" />
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      {ans.time_spent_seconds !== null
                        ? `${ans.time_spent_seconds}s`
                        : "-"}
                    </TableCell>
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
