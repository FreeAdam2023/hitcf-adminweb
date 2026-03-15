"use client";

import { PageHeader } from "@/components/shared/page-header";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ReferralList } from "./referral-list";
import { ReferralStatsPanel } from "./referral-stats";

export default function ReferralsPage() {
  return (
    <div className="space-y-6">
      <PageHeader title="推荐奖励" description="管理推荐奖励与追踪邀请活动" />
      <Tabs defaultValue="list">
        <TabsList>
          <TabsTrigger value="list">全部推荐</TabsTrigger>
          <TabsTrigger value="stats">统计</TabsTrigger>
        </TabsList>
        <TabsContent value="list">
          <ReferralList />
        </TabsContent>
        <TabsContent value="stats">
          <ReferralStatsPanel />
        </TabsContent>
      </Tabs>
    </div>
  );
}
