import { PageHeader } from "@/components/shared/page-header";
import { UserList } from "./user-list";

export default function UsersPage() {
  return (
    <div className="space-y-6">
      <PageHeader title="Users" description="Manage platform users" />
      <UserList />
    </div>
  );
}
