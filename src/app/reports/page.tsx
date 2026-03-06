"use client";

import { PageHeader } from "@/components/shared/page-header";
import { ReportList } from "./report-list";

export default function ReportsPage() {
  return (
    <div className="space-y-6">
      <PageHeader title="题目举报" description="用户反馈的题目问题" />
      <ReportList />
    </div>
  );
}
