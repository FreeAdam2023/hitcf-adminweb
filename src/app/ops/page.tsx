"use client";

import { PageHeader } from "@/components/shared/page-header";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ContentStudio } from "./content-studio";
import { ReplyLibrary } from "./reply-library";
import { ContentCalendar } from "./content-calendar";
import { PerformanceTracker } from "./performance-tracker";
import { AssetLibrary } from "./asset-library";
import {
  Sparkles,
  MessageSquare,
  CalendarDays,
  BarChart3,
  ImageIcon,
} from "lucide-react";

export default function OpsPage() {
  return (
    <div className="space-y-6">
      <PageHeader title="运营工作台" description="内容创作 · 话术管理 · 发布排期 · 数据追踪" />
      <Tabs defaultValue="studio">
        <TabsList className="flex-wrap h-auto gap-1">
          <TabsTrigger value="studio" className="gap-1.5">
            <Sparkles className="h-3.5 w-3.5" />
            内容工作室
          </TabsTrigger>
          <TabsTrigger value="replies" className="gap-1.5">
            <MessageSquare className="h-3.5 w-3.5" />
            回复话术
          </TabsTrigger>
          <TabsTrigger value="calendar" className="gap-1.5">
            <CalendarDays className="h-3.5 w-3.5" />
            发帖日历
          </TabsTrigger>
          <TabsTrigger value="performance" className="gap-1.5">
            <BarChart3 className="h-3.5 w-3.5" />
            数据追踪
          </TabsTrigger>
          <TabsTrigger value="assets" className="gap-1.5">
            <ImageIcon className="h-3.5 w-3.5" />
            素材库
          </TabsTrigger>
        </TabsList>
        <TabsContent value="studio" className="mt-4">
          <ContentStudio />
        </TabsContent>
        <TabsContent value="replies" className="mt-4">
          <ReplyLibrary />
        </TabsContent>
        <TabsContent value="calendar" className="mt-4">
          <ContentCalendar />
        </TabsContent>
        <TabsContent value="performance" className="mt-4">
          <PerformanceTracker />
        </TabsContent>
        <TabsContent value="assets" className="mt-4">
          <AssetLibrary />
        </TabsContent>
      </Tabs>
    </div>
  );
}
