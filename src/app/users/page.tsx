"use client";

import { PageHeader } from "@/components/shared/page-header";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Users, Search } from "lucide-react";
import { UserList } from "./user-list";
import { WatermarkLookup } from "./watermark-lookup";

export default function UsersPage() {
  return (
    <div className="space-y-6">
      <PageHeader title="用户管理" description="管理平台用户" />
      <Tabs defaultValue="users">
        <TabsList>
          <TabsTrigger value="users" className="gap-1.5">
            <Users className="h-4 w-4" />
            用户列表
          </TabsTrigger>
          <TabsTrigger value="watermark" className="gap-1.5">
            <Search className="h-4 w-4" />
            水印查找
          </TabsTrigger>
        </TabsList>
        <TabsContent value="users">
          <UserList />
        </TabsContent>
        <TabsContent value="watermark">
          <WatermarkLookup />
        </TabsContent>
      </Tabs>
    </div>
  );
}
