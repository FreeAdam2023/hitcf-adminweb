"use client";

import { PageHeader } from "@/components/shared/page-header";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { SubscriptionList } from "./subscription-list";
import { RevenueSummary } from "./revenue-summary";
import { EventList } from "./event-list";

export default function SubscriptionsPage() {
  return (
    <div className="space-y-6">
      <PageHeader title="订阅管理" description="管理订阅与收入" />
      <Tabs defaultValue="list">
        <TabsList>
          <TabsTrigger value="list">订阅用户</TabsTrigger>
          <TabsTrigger value="revenue">收入统计</TabsTrigger>
          <TabsTrigger value="events">Stripe 事件</TabsTrigger>
        </TabsList>
        <TabsContent value="list" className="mt-4">
          <SubscriptionList />
        </TabsContent>
        <TabsContent value="revenue" className="mt-4">
          <RevenueSummary />
        </TabsContent>
        <TabsContent value="events" className="mt-4">
          <EventList />
        </TabsContent>
      </Tabs>
    </div>
  );
}
