"use client";

import { PageHeader } from "@/components/shared/page-header";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { VocabDashboard } from "./vocab-dashboard";
import { NihaoWordList } from "./nihao-word-list";
import { SavedWordList } from "./saved-word-list";

export default function VocabularyPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="词汇管理"
        description="管理词库与用户收藏词汇"
      />
      <Tabs defaultValue="overview">
        <TabsList>
          <TabsTrigger value="overview">总览</TabsTrigger>
          <TabsTrigger value="saved">用户收藏</TabsTrigger>
          <TabsTrigger value="nihao">你好法语</TabsTrigger>
        </TabsList>
        <TabsContent value="overview" className="mt-4">
          <VocabDashboard />
        </TabsContent>
        <TabsContent value="saved" className="mt-4">
          <SavedWordList />
        </TabsContent>
        <TabsContent value="nihao" className="mt-4">
          <NihaoWordList />
        </TabsContent>
      </Tabs>
    </div>
  );
}
