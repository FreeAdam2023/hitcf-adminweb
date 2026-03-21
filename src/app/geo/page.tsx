"use client";

import { PageHeader } from "@/components/shared/page-header";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { GeoDashboard } from "./geo-dashboard";
import {
  BarChart3,
  Eye,
  ListChecks,
  MessageSquare,
  TrendingUp,
} from "lucide-react";

export default function GeoPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="GEO 优化"
        description="Generative Engine Optimization · AI 搜索可见性 · 品牌引用追踪"
      />
      <Tabs defaultValue="overview">
        <TabsList className="flex-wrap h-auto gap-1">
          <TabsTrigger value="overview" className="gap-1.5">
            <BarChart3 className="h-3.5 w-3.5" />
            GEO 概览
          </TabsTrigger>
          <TabsTrigger value="citations" className="gap-1.5">
            <Eye className="h-3.5 w-3.5" />
            AI 引用监测
          </TabsTrigger>
          <TabsTrigger value="optimization" className="gap-1.5">
            <ListChecks className="h-3.5 w-3.5" />
            内容优化
          </TabsTrigger>
          <TabsTrigger value="prompts" className="gap-1.5">
            <MessageSquare className="h-3.5 w-3.5" />
            Prompt 覆盖
          </TabsTrigger>
          <TabsTrigger value="trends" className="gap-1.5">
            <TrendingUp className="h-3.5 w-3.5" />
            AI 搜索趋势
          </TabsTrigger>
        </TabsList>
        <TabsContent value="overview" className="mt-4">
          <GeoDashboard tab="overview" />
        </TabsContent>
        <TabsContent value="citations" className="mt-4">
          <GeoDashboard tab="citations" />
        </TabsContent>
        <TabsContent value="optimization" className="mt-4">
          <GeoDashboard tab="optimization" />
        </TabsContent>
        <TabsContent value="prompts" className="mt-4">
          <GeoDashboard tab="prompts" />
        </TabsContent>
        <TabsContent value="trends" className="mt-4">
          <GeoDashboard tab="trends" />
        </TabsContent>
      </Tabs>
    </div>
  );
}
