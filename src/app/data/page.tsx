"use client";

import { PageHeader } from "@/components/shared/page-header";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ImportPanel } from "./import-panel";
import { ExportPanel } from "./export-panel";
import { AudioPanel } from "./audio-panel";

export default function DataOpsPage() {
  return (
    <div className="space-y-6">
      <PageHeader title="Data Operations" description="Import, export, and manage audio files" />
      <Tabs defaultValue="import">
        <TabsList>
          <TabsTrigger value="import">Import</TabsTrigger>
          <TabsTrigger value="export">Export</TabsTrigger>
          <TabsTrigger value="audio">Audio</TabsTrigger>
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
