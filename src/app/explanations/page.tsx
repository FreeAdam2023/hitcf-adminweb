"use client";

import { PageHeader } from "@/components/shared/page-header";
import { ExplanationDashboard } from "./explanation-dashboard";

export default function ExplanationsPage() {
  return (
    <div className="space-y-6">
      <PageHeader title="Explanations" description="Generate and manage question explanations" />
      <ExplanationDashboard />
    </div>
  );
}
