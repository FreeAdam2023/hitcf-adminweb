import { PageHeader } from "@/components/shared/page-header";
import { DuplicatesView } from "./duplicates-view";

export default function DuplicatesPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="重复题管理"
        description="审核自动检测的重复题分组，处理答案冲突，手工标记/取消重复"
      />
      <DuplicatesView />
    </div>
  );
}
