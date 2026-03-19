import { PageHeader } from "@/components/shared/page-header";
import { AudioReviewList } from "./audio-review-list";

export default function AudioReviewPage() {
  return (
    <div className="space-y-6">
      <PageHeader title="音频审核" description="听力题目转录编辑、音色标记和质量审核" />
      <AudioReviewList />
    </div>
  );
}
