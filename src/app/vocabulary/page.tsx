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
        title="Vocabulary Management"
        description="Manage vocabulary pools and user saved words"
      />
      <Tabs defaultValue="overview">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="saved">User Saved Words</TabsTrigger>
          <TabsTrigger value="nihao">Nihao Words</TabsTrigger>
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
