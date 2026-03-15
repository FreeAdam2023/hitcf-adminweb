"use client";

import { PageHeader } from "@/components/shared/page-header";
import { AuditList } from "./audit-list";

export default function AuditPage() {
  return (
    <div className="space-y-6">
      <PageHeader title="审计日志" description="追踪所有管理员操作" />
      <AuditList />
    </div>
  );
}
