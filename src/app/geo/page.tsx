"use client";

import { PageHeader } from "@/components/shared/page-header";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { GeoDashboard } from "./geo-dashboard";
import {
  BarChart3,
  FileText,
  MessageSquare,
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
            AI 引用检测
          </TabsTrigger>
          <TabsTrigger value="content" className="gap-1.5">
            <FileText className="h-3.5 w-3.5" />
            喂料追踪
          </TabsTrigger>
          <TabsTrigger value="manual" className="gap-1.5">
            <MessageSquare className="h-3.5 w-3.5" />
            手动测试
          </TabsTrigger>
        </TabsList>
        <TabsContent value="overview" className="mt-4">
          <GeoDashboard tab="overview" />
        </TabsContent>
        <TabsContent value="content" className="mt-4">
          <GeoDashboard tab="content" />
        </TabsContent>
        <TabsContent value="manual" className="mt-4">
          <GeoDashboard tab="manual" />
        </TabsContent>
      </Tabs>
    </div>
  );
}
