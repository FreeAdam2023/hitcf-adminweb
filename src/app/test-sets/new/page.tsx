import { PageHeader } from "@/components/shared/page-header";
import { TestSetForm } from "../[id]/test-set-form";

export default function NewTestSetPage() {
  return (
    <div className="space-y-6">
      <PageHeader title="新建套题" description="创建新套题" />
      <TestSetForm />
    </div>
  );
}
