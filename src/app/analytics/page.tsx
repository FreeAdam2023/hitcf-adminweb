"use client";

import { PageHeader } from "@/components/shared/page-header";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { OverviewCharts } from "./overview-charts";
import { UserActivityPanel } from "./user-activity-panel";
import { TestPopularityTable } from "./test-popularity-table";
import { DifficultyTable } from "./difficulty-table";
import { InsightsPanel } from "./insights-panel";

export default function AnalyticsPage() {
  return (
    <div className="space-y-6">
      <PageHeader title="数据分析" description="平台使用统计" />
      <Tabs defaultValue="overview">
        <TabsList>
          <TabsTrigger value="overview">总览</TabsTrigger>
          <TabsTrigger value="activity">用户轨迹</TabsTrigger>
          <TabsTrigger value="popularity">题库热度</TabsTrigger>
          <TabsTrigger value="difficulty">难度排行</TabsTrigger>
          <TabsTrigger value="insights">深度洞察</TabsTrigger>
        </TabsList>
        <TabsContent value="overview" className="mt-4">
          <OverviewCharts />
        </TabsContent>
        <TabsContent value="activity" className="mt-4">
          <UserActivityPanel />
        </TabsContent>
        <TabsContent value="popularity" className="mt-4">
          <TestPopularityTable />
        </TabsContent>
        <TabsContent value="difficulty" className="mt-4">
          <DifficultyTable />
        </TabsContent>
        <TabsContent value="insights" className="mt-4">
          <InsightsPanel />
        </TabsContent>
      </Tabs>
    </div>
  );
}
