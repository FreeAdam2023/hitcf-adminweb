"use client";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CompetitorList } from "./competitor-list";
import { ComparisonMatrix } from "./comparison-matrix";
import { MonitorPanel } from "./monitor-panel";

export default function CompetitorsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">竞品分析</h1>
        <p className="text-muted-foreground">
          追踪竞品、对比功能、监控网站变化
        </p>
      </div>

      <Tabs defaultValue="list" className="space-y-4">
        <TabsList>
          <TabsTrigger value="list">竞品列表</TabsTrigger>
          <TabsTrigger value="comparison">功能对比</TabsTrigger>
          <TabsTrigger value="monitor">监控</TabsTrigger>
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
