"use client";

import { PageHeader } from "@/components/shared/page-header";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { SeoDashboard } from "./seo-dashboard";
import {
  Activity,
  FileSearch,
  Code2,
  Languages,
  ListChecks,
  Target,
} from "lucide-react";

export default function SeoPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="SEO 优化"
        description="搜索引擎优化状态 · Meta 审计 · 结构化数据 · 关键词追踪"
      />
      <Tabs defaultValue="health">
        <TabsList className="flex-wrap h-auto gap-1">
          <TabsTrigger value="health" className="gap-1.5">
            <Activity className="h-3.5 w-3.5" />
            健康评分
          </TabsTrigger>
          <TabsTrigger value="meta" className="gap-1.5">
            <FileSearch className="h-3.5 w-3.5" />
            Meta 审计
          </TabsTrigger>
          <TabsTrigger value="schema" className="gap-1.5">
            <Code2 className="h-3.5 w-3.5" />
            结构化数据
          </TabsTrigger>
          <TabsTrigger value="hreflang" className="gap-1.5">
            <Languages className="h-3.5 w-3.5" />
            Hreflang
          </TabsTrigger>
          <TabsTrigger value="checklist" className="gap-1.5">
            <ListChecks className="h-3.5 w-3.5" />
            SEO 清单
          </TabsTrigger>
          <TabsTrigger value="keywords" className="gap-1.5">
            <Target className="h-3.5 w-3.5" />
            关键词追踪
          </TabsTrigger>
        </TabsList>
        <TabsContent value="health" className="mt-4">
          <SeoDashboard tab="health" />
        </TabsContent>
        <TabsContent value="meta" className="mt-4">
          <SeoDashboard tab="meta" />
        </TabsContent>
        <TabsContent value="schema" className="mt-4">
          <SeoDashboard tab="schema" />
        </TabsContent>
        <TabsContent value="hreflang" className="mt-4">
          <SeoDashboard tab="hreflang" />
        </TabsContent>
        <TabsContent value="checklist" className="mt-4">
          <SeoDashboard tab="checklist" />
        </TabsContent>
        <TabsContent value="keywords" className="mt-4">
          <SeoDashboard tab="keywords" />
        </TabsContent>
      </Tabs>
    </div>
  );
}
