import { PageHeader } from "@/components/shared/page-header";
import { AttemptList } from "./attempt-list";

export default function AttemptsPage() {
  return (
    <div className="space-y-6">
      <PageHeader title="Attempts" description="View user attempt records" />
      <AttemptList />
    </div>
  );
}
