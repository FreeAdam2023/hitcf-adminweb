"use client";

import { PageHeader } from "@/components/shared/page-header";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { EmailList } from "./email-list";
import { EmailTemplates } from "./email-templates";

export default function EmailsPage() {
  return (
    <div className="space-y-6">
      <PageHeader title="邮件管理" description="邮件模板总览与发送日志" />
      <Tabs defaultValue="templates">
        <TabsList>
          <TabsTrigger value="templates">模板总览</TabsTrigger>
          <TabsTrigger value="logs">发送日志</TabsTrigger>
        </TabsList>
        <TabsContent value="templates">
          <EmailTemplates />
        </TabsContent>
        <TabsContent value="logs">
          <EmailList />
        </TabsContent>
      </Tabs>
    </div>
  );
}
