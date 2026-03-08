"use client";

import { PageHeader } from "@/components/shared/page-header";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ReferralList } from "./referral-list";
import { ReferralStatsPanel } from "./referral-stats";

export default function ReferralsPage() {
  return (
    <div className="space-y-6">
      <PageHeader title="Referrals" description="Manage referral rewards and track referral activity" />
      <Tabs defaultValue="list">
        <TabsList>
          <TabsTrigger value="list">All Referrals</TabsTrigger>
          <TabsTrigger value="stats">Stats</TabsTrigger>
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
