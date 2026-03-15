"use client";

import { PageHeader } from "@/components/shared/page-header";
import { ExplanationDashboard } from "./explanation-dashboard";

export default function ExplanationsPage() {
  return (
    <div className="space-y-6">
      <PageHeader title="题目解析" description="生成与管理题目解析" />
      <ExplanationDashboard />
    </div>
  );
}
