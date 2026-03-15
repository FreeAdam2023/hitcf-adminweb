"use client";

import { PageHeader } from "@/components/shared/page-header";
import { FeedbackList } from "./feedback-list";

export default function FeedbackPage() {
  return (
    <div className="space-y-6">
      <PageHeader title="用户反馈" description="查看与管理用户反馈" />
      <FeedbackList />
    </div>
  );
}
