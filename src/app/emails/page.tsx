"use client";

import { PageHeader } from "@/components/shared/page-header";
import { EmailList } from "./email-list";

export default function EmailsPage() {
  return (
    <div className="space-y-6">
      <PageHeader title="邮件日志" description="查看所有已发送和失败的邮件记录" />
      <EmailList />
    </div>
  );
}
