"use client";

import { useEffect, useState } from "react";
import { PageHeader } from "@/components/shared/page-header";
import { LoadingSpinner } from "@/components/shared/loading-spinner";
import { fetchQuestionDetail } from "@/lib/api/admin";
import type { AdminQuestionDetail } from "@/lib/api/types";
import { QuestionForm } from "./question-form";
import { TimestampEditor } from "./timestamp-editor";

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
    return <p className="text-center text-muted-foreground">未找到题目</p>;
  }

  return (
    <div className="space-y-6">
      <PageHeader title="编辑题目" description={`#${data.question_number} (${data.type})`} />
      <QuestionForm initial={data} />
      {data.type === "listening" && (
        <TimestampEditor
          questionId={data.id}
          audioUrl={data.audio_url}
          initial={data.audio_timestamps}
        />
      )}
    </div>
  );
}
