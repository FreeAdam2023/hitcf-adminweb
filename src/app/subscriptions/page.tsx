"use client";

import { PageHeader } from "@/components/shared/page-header";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { SubscriptionList } from "./subscription-list";
import { RevenueSummary } from "./revenue-summary";
import { EventList } from "./event-list";

export default function SubscriptionsPage() {
  return (
    <div className="space-y-6">
      <PageHeader title="Subscriptions" description="Manage subscriptions and revenue" />
      <Tabs defaultValue="list">
        <TabsList>
          <TabsTrigger value="list">Subscribers</TabsTrigger>
          <TabsTrigger value="revenue">Revenue</TabsTrigger>
          <TabsTrigger value="events">Stripe Events</TabsTrigger>
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
