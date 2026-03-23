"use client";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PageHeader } from "@/components/shared/page-header";
import { PaidUsersOverview } from "./paid-users-overview";
import { PaidUserCards } from "./paid-user-cards";
import { PaidChurnRisk } from "./paid-churn-risk";
import { PaidFeatureUsage } from "./paid-feature-usage";

export default function PaidUsersPage() {
  return (
    <div className="space-y-6">
      <PageHeader title="付费用户画像" description="了解你的付费用户是谁、从哪来、用什么功能" />

      <Tabs defaultValue="overview">
        <TabsList>
          <TabsTrigger value="overview">总览</TabsTrigger>
          <TabsTrigger value="users">用户列表</TabsTrigger>
          <TabsTrigger value="churn">流失风险</TabsTrigger>
          <TabsTrigger value="features">功能使用</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="mt-4">
          <PaidUsersOverview />
        </TabsContent>
        <TabsContent value="users" className="mt-4">
          <PaidUserCards />
        </TabsContent>
        <TabsContent value="churn" className="mt-4">
          <PaidChurnRisk />
        </TabsContent>
        <TabsContent value="features" className="mt-4">
          <PaidFeatureUsage />
        </TabsContent>
      </Tabs>
    </div>
  );
}
