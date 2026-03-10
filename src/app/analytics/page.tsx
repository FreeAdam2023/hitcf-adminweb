"use client";

import { PageHeader } from "@/components/shared/page-header";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { OverviewCharts } from "./overview-charts";
import { UserActivityPanel } from "./user-activity-panel";
import { TestPopularityTable } from "./test-popularity-table";
import { DifficultyTable } from "./difficulty-table";
import { InsightsPanel } from "./insights-panel";
import { FunnelPanel } from "./funnel-panel";
import { SegmentsPanel } from "./segments-panel";
import { CohortPanel } from "./cohort-panel";
import {
  BarChart3,
  Activity,
  Flame,
  AlertTriangle,
  Lightbulb,
  Filter,
  Users,
  Grid3X3,
} from "lucide-react";

export default function AnalyticsPage() {
  return (
    <div className="space-y-6">
      <PageHeader title="数据分析" description="平台运营指标 · 用户行为追踪 · 增长洞察" />
      <Tabs defaultValue="overview">
        <TabsList className="flex-wrap h-auto gap-1">
          <TabsTrigger value="overview" className="gap-1.5">
            <BarChart3 className="h-3.5 w-3.5" />
            总览
          </TabsTrigger>
          <TabsTrigger value="funnel" className="gap-1.5">
            <Filter className="h-3.5 w-3.5" />
            漏斗
          </TabsTrigger>
          <TabsTrigger value="segments" className="gap-1.5">
            <Users className="h-3.5 w-3.5" />
            分群
          </TabsTrigger>
          <TabsTrigger value="cohort" className="gap-1.5">
            <Grid3X3 className="h-3.5 w-3.5" />
            留存 & LTV
          </TabsTrigger>
          <TabsTrigger value="activity" className="gap-1.5">
            <Activity className="h-3.5 w-3.5" />
            用户行为
          </TabsTrigger>
          <TabsTrigger value="popularity" className="gap-1.5">
            <Flame className="h-3.5 w-3.5" />
            题库热度
          </TabsTrigger>
          <TabsTrigger value="difficulty" className="gap-1.5">
            <AlertTriangle className="h-3.5 w-3.5" />
            难度排行
          </TabsTrigger>
          <TabsTrigger value="insights" className="gap-1.5">
            <Lightbulb className="h-3.5 w-3.5" />
            深度洞察
          </TabsTrigger>
        </TabsList>
        <TabsContent value="overview" className="mt-4">
          <OverviewCharts />
        </TabsContent>
        <TabsContent value="funnel" className="mt-4">
          <FunnelPanel />
        </TabsContent>
        <TabsContent value="segments" className="mt-4">
          <SegmentsPanel />
        </TabsContent>
        <TabsContent value="cohort" className="mt-4">
          <CohortPanel />
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
