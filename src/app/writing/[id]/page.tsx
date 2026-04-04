"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { PageHeader } from "@/components/shared/page-header";
import { LoadingSpinner } from "@/components/shared/loading-spinner";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { fetchWritingSubmissionDetail } from "@/lib/api/admin";
import type { AdminWritingDetail, CriterionFeedback } from "@/lib/api/types";
import { ArrowLeft } from "lucide-react";

function levelBadge(level: string | null) {
  if (!level) return <span className="text-muted-foreground">-</span>;
  const upper = level.toUpperCase();
  let variant: "default" | "secondary" | "outline" = "outline";
  if (upper.startsWith("C")) variant = "default";
  else if (upper.startsWith("B")) variant = "secondary";
  return <Badge variant={variant}>{level}</Badge>;
}

function CriterionCard({ name, data }: { name: string; data: CriterionFeedback | null }) {
  if (!data) return null;
  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center justify-between text-base">
          <span className="capitalize">{name}</span>
          <span className="text-lg font-bold">{data.score}/5</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <p className="text-sm text-muted-foreground">{data.feedback}</p>
        {data.highlights && data.highlights.length > 0 && (
          <div>
            <p className="text-xs font-medium text-muted-foreground mb-1">Highlights</p>
            <ul className="list-disc list-inside space-y-1 text-sm">
              {data.highlights.map((h, i) => (
                <li key={i}>{h}</li>
              ))}
            </ul>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export default function WritingDetailPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const [data, setData] = useState<AdminWritingDetail | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchWritingSubmissionDetail(params.id)
      .then(setData)
      .finally(() => setLoading(false));
  }, [params.id]);

  if (loading) {
    return <div className="flex h-64 items-center justify-center"><LoadingSpinner /></div>;
  }
  if (!data) {
    return <p className="text-center text-muted-foreground">未找到写作提交</p>;
  }

  const fb = data.feedback;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="sm" onClick={() => router.back()}>
          <ArrowLeft className="mr-1 h-4 w-4" />
          返回
        </Button>
      </div>

      <PageHeader
        title="Writing Submission"
        description={data.user_email}
      />

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Left column: Essay */}
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between text-base">
                <span>Essay (Task {data.task_number})</span>
                <span className="text-sm font-normal text-muted-foreground">
                  {data.word_count} words
                </span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="whitespace-pre-wrap text-sm leading-relaxed">{data.essay_text}</p>
            </CardContent>
          </Card>
        </div>

        {/* Right column: Feedback */}
        <div className="space-y-4">
          {/* Score overview */}
          {fb && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center justify-between text-base">
                  <span>Score</span>
                  <span className="text-2xl font-bold">{fb.total_score}/20</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center gap-3">
                  <span className="text-sm text-muted-foreground">Estimated Level:</span>
                  {levelBadge(fb.estimated_level)}
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-sm text-muted-foreground">Estimated NCLC:</span>
                  <span className="text-sm font-medium">{fb.estimated_nclc}</span>
                </div>
                <div>
                  <p className="text-xs font-medium text-muted-foreground mb-1">Overall Comment</p>
                  <p className="text-sm">{fb.overall_comment}</p>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Criterion cards */}
          {fb && (
            <>
              <CriterionCard name="Adequation" data={fb.adequation} />
              <CriterionCard name="Coherence" data={fb.coherence} />
              <CriterionCard name="Vocabulaire" data={fb.vocabulaire} />
              <CriterionCard name="Grammaire" data={fb.grammaire} />
            </>
          )}

          {/* Corrections */}
          {fb && fb.corrections && fb.corrections.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Corrections</CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Original</TableHead>
                      <TableHead>Corrected</TableHead>
                      <TableHead>Explanation</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {fb.corrections.map((c, i) => (
                      <TableRow key={i}>
                        <TableCell>
                          <span className="text-red-500 line-through">{c.original}</span>
                        </TableCell>
                        <TableCell>
                          <span className="text-green-600 font-medium">{c.corrected}</span>
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {c.explanation}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          )}

          {/* Vocab suggestions */}
          {fb && fb.vocab_suggestions && fb.vocab_suggestions.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Vocabulary Suggestions</CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Original</TableHead>
                      <TableHead>Suggestion</TableHead>
                      <TableHead>Reason</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {fb.vocab_suggestions.map((v, i) => (
                      <TableRow key={i}>
                        <TableCell className="text-sm">{v.original}</TableCell>
                        <TableCell>
                          <span className="text-green-600 font-medium">{v.suggestion}</span>
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {v.reason}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          )}

          {/* No feedback state */}
          {!fb && (
            <Card>
              <CardContent className="py-8 text-center text-muted-foreground">
                No AI grading feedback available for this submission.
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
