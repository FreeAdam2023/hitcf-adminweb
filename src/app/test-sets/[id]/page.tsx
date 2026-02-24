"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { PageHeader } from "@/components/shared/page-header";
import { LoadingSpinner } from "@/components/shared/loading-spinner";
import { Button } from "@/components/ui/button";
import { fetchTestSetDetail } from "@/lib/api/admin";
import type { AdminTestSetDetail } from "@/lib/api/types";
import { TestSetForm } from "./test-set-form";
import { ExternalLink } from "lucide-react";

export default function EditTestSetPage({ params }: { params: { id: string } }) {
  const [data, setData] = useState<AdminTestSetDetail | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchTestSetDetail(params.id)
      .then(setData)
      .finally(() => setLoading(false));
  }, [params.id]);

  if (loading) {
    return <div className="flex h-64 items-center justify-center"><LoadingSpinner /></div>;
  }
  if (!data) {
    return <p className="text-center text-muted-foreground">Test set not found.</p>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <PageHeader title="Edit Test Set" description={data.code} />
        <Button variant="outline" size="sm" asChild>
          <Link href={`/questions?test_set_id=${data.id}`}>
            <ExternalLink className="mr-1 h-4 w-4" />
            View Questions ({data.question_count})
          </Link>
        </Button>
      </div>
      <TestSetForm initial={data} />
    </div>
  );
}
