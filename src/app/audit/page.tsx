"use client";

import { PageHeader } from "@/components/shared/page-header";
import { AuditList } from "./audit-list";

export default function AuditPage() {
  return (
    <div className="space-y-6">
      <PageHeader title="Audit Log" description="Track all admin actions" />
      <AuditList />
    </div>
  );
}
