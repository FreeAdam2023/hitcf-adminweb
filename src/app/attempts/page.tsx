import { PageHeader } from "@/components/shared/page-header";
import { AttemptList } from "./attempt-list";

export default function AttemptsPage() {
  return (
    <div className="space-y-6">
      <PageHeader title="答题记录" description="查看用户答题记录" />
      <AttemptList />
    </div>
  );
}
