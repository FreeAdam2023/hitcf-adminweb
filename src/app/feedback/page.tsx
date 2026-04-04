"use client";

import { PageHeader } from "@/components/shared/page-header";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { MessageSquare, Flag } from "lucide-react";
import { FeedbackList } from "./feedback-list";
import { ReportList } from "../reports/report-list";

export default function FeedbackPage() {
  return (
    <div className="space-y-6">
      <PageHeader title="反馈 & 举报" description="用户反馈和题目举报" />
      <Tabs defaultValue="reports">
        <TabsList>
          <TabsTrigger value="reports" className="gap-1.5">
            <Flag className="h-4 w-4" />
            题目举报
          </TabsTrigger>
          <TabsTrigger value="feedback" className="gap-1.5">
            <MessageSquare className="h-4 w-4" />
            用户反馈
          </TabsTrigger>
        </TabsList>
        <TabsContent value="reports" className="mt-4">
          <ReportList />
        </TabsContent>
        <TabsContent value="feedback" className="mt-4">
          <FeedbackList />
        </TabsContent>
      </Tabs>
    </div>
  );
}
