"use client";

import { PageHeader } from "@/components/shared/page-header";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ImportPanel } from "./import-panel";
import { ExportPanel } from "./export-panel";
import { AudioPanel } from "./audio-panel";

export default function DataOpsPage() {
  return (
    <div className="space-y-6">
      <PageHeader title="数据操作" description="导入、导出及音频管理" />
      <Tabs defaultValue="import">
        <TabsList>
          <TabsTrigger value="import">导入</TabsTrigger>
          <TabsTrigger value="export">导出</TabsTrigger>
          <TabsTrigger value="audio">音频</TabsTrigger>
        </TabsList>
        <TabsContent value="import" className="mt-4">
          <ImportPanel />
        </TabsContent>
        <TabsContent value="export" className="mt-4">
          <ExportPanel />
        </TabsContent>
        <TabsContent value="audio" className="mt-4">
          <AudioPanel />
        </TabsContent>
      </Tabs>
    </div>
  );
}
