"use client";

import { PageHeader } from "@/components/shared/page-header";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { OverviewCharts } from "./overview-charts";
import { TestPopularityTable } from "./test-popularity-table";
import { DifficultyTable } from "./difficulty-table";
import { InsightsPanel } from "./insights-panel";

export default function AnalyticsPage() {
  return (
    <div className="space-y-6">
      <PageHeader title="Analytics" description="Platform usage analytics" />
      <Tabs defaultValue="overview">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="popularity">Test Popularity</TabsTrigger>
          <TabsTrigger value="difficulty">Difficulty</TabsTrigger>
          <TabsTrigger value="insights">Insights</TabsTrigger>
        </TabsList>
        <TabsContent value="overview" className="mt-4">
          <OverviewCharts />
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
