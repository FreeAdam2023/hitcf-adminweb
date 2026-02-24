import { PageHeader } from "@/components/shared/page-header";
import { TestSetForm } from "../[id]/test-set-form";

export default function NewTestSetPage() {
  return (
    <div className="space-y-6">
      <PageHeader title="New Test Set" description="Create a new test set" />
      <TestSetForm />
    </div>
  );
}
