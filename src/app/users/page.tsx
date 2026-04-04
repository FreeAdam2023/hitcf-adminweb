"use client";

import { PageHeader } from "@/components/shared/page-header";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Users, Search, TrendingUp, AlertTriangle, BarChart3 } from "lucide-react";
import { UserList } from "./user-list";
import { WatermarkLookup } from "./watermark-lookup";
import { PaidUsersOverview } from "../paid-users/paid-users-overview";
import { PaidChurnRisk } from "../paid-users/paid-churn-risk";
import { PaidFeatureUsage } from "../paid-users/paid-feature-usage";

export default function UsersPage() {
  return (
    <div className="space-y-6">
      <PageHeader title="用户管理" description="用户列表、付费画像、流失预警" />
      <Tabs defaultValue="users">
        <TabsList className="flex-wrap">
          <TabsTrigger value="users" className="gap-1.5">
            <Users className="h-4 w-4" />
            用户列表
          </TabsTrigger>
          <TabsTrigger value="overview" className="gap-1.5">
            <TrendingUp className="h-4 w-4" />
            付费画像
          </TabsTrigger>
          <TabsTrigger value="churn" className="gap-1.5">
            <AlertTriangle className="h-4 w-4" />
            流失预警
          </TabsTrigger>
          <TabsTrigger value="features" className="gap-1.5">
            <BarChart3 className="h-4 w-4" />
            功能使用
          </TabsTrigger>
          <TabsTrigger value="watermark" className="gap-1.5">
            <Search className="h-4 w-4" />
            水印查找
          </TabsTrigger>
        </TabsList>
        <TabsContent value="users">
          <UserList />
        </TabsContent>
        <TabsContent value="overview" className="mt-4">
          <PaidUsersOverview />
        </TabsContent>
        <TabsContent value="churn" className="mt-4">
          <PaidChurnRisk />
        </TabsContent>
        <TabsContent value="features" className="mt-4">
          <PaidFeatureUsage />
        </TabsContent>
        <TabsContent value="watermark">
          <WatermarkLookup />
        </TabsContent>
      </Tabs>
    </div>
  );
}
