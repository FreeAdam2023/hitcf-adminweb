"use client";

import { PageHeader } from "@/components/shared/page-header";
import { FeedbackList } from "./feedback-list";

export default function FeedbackPage() {
  return (
    <div className="space-y-6">
      <PageHeader title="User Feedback" description="View and manage user feedback" />
      <FeedbackList />
    </div>
  );
}
