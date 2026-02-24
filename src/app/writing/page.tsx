import { PageHeader } from "@/components/shared/page-header";
import { SubmissionList } from "./submission-list";

export default function WritingSubmissionsPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Writing Submissions"
        description="View writing practice submissions and AI grading"
      />
      <SubmissionList />
    </div>
  );
}
