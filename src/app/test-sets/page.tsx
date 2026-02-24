import Link from "next/link";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/shared/page-header";
import { TestSetList } from "./test-set-list";
import { Plus } from "lucide-react";

export default function TestSetsPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Test Sets"
        description="Manage test sets"
        actions={
          <Button asChild>
            <Link href="/test-sets/new">
              <Plus className="mr-2 h-4 w-4" />
              New Test Set
            </Link>
          </Button>
        }
      />
      <TestSetList />
    </div>
  );
}
