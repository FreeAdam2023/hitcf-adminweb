"use client";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CompetitorList } from "./competitor-list";
import { ComparisonMatrix } from "./comparison-matrix";
import { MonitorPanel } from "./monitor-panel";

export default function CompetitorsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Competitors</h1>
        <p className="text-muted-foreground">
          Track competitors, compare features, and monitor their websites.
        </p>
      </div>

      <Tabs defaultValue="list" className="space-y-4">
        <TabsList>
          <TabsTrigger value="list">Competitor List</TabsTrigger>
          <TabsTrigger value="comparison">Feature Comparison</TabsTrigger>
          <TabsTrigger value="monitor">Monitoring</TabsTrigger>
        </TabsList>

        <TabsContent value="list">
          <CompetitorList />
        </TabsContent>

        <TabsContent value="comparison">
          <ComparisonMatrix />
        </TabsContent>

        <TabsContent value="monitor">
          <MonitorPanel />
        </TabsContent>
      </Tabs>
    </div>
  );
}
