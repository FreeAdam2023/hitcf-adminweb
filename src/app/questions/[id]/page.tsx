"use client";

import { useEffect, useState } from "react";
import { PageHeader } from "@/components/shared/page-header";
import { LoadingSpinner } from "@/components/shared/loading-spinner";
import { fetchQuestionDetail } from "@/lib/api/admin";
import type { AdminQuestionDetail } from "@/lib/api/types";
import { QuestionForm } from "./question-form";

export default function EditQuestionPage({ params }: { params: { id: string } }) {
  const [data, setData] = useState<AdminQuestionDetail | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchQuestionDetail(params.id)
      .then(setData)
      .finally(() => setLoading(false));
  }, [params.id]);

  if (loading) {
    return <div className="flex h-64 items-center justify-center"><LoadingSpinner /></div>;
  }
  if (!data) {
    return <p className="text-center text-muted-foreground">Question not found.</p>;
  }

  return (
    <div className="space-y-6">
      <PageHeader title="Edit Question" description={`#${data.question_number} (${data.type})`} />
      <QuestionForm initial={data} />
    </div>
  );
}
