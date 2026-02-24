"use client";

import { useSearchParams } from "next/navigation";
import { Suspense } from "react";
import { PageHeader } from "@/components/shared/page-header";
import { QuestionForm } from "../[id]/question-form";

function NewQuestionInner() {
  const searchParams = useSearchParams();
  const testSetId = searchParams.get("test_set_id") || undefined;

  return <QuestionForm defaultTestSetId={testSetId} />;
}

export default function NewQuestionPage() {
  return (
    <div className="space-y-6">
      <PageHeader title="New Question" description="Create a new question" />
      <Suspense>
        <NewQuestionInner />
      </Suspense>
    </div>
  );
}
