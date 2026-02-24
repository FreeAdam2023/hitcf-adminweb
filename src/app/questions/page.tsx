import Link from "next/link";
import { Suspense } from "react";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/shared/page-header";
import { QuestionList } from "./question-list";
import { Plus } from "lucide-react";

export default function QuestionsPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Questions"
        description="Manage questions"
        actions={
          <Button asChild>
            <Link href="/questions/new">
              <Plus className="mr-2 h-4 w-4" />
              New Question
            </Link>
          </Button>
        }
      />
      <Suspense>
        <QuestionList />
      </Suspense>
    </div>
  );
}
