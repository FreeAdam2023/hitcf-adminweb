import { PageHeader } from "@/components/shared/page-header";
import { ScrapeDataView } from "./scrape-data-view";

export default function ScrapeDataPage() {
  return (
    <div className="space-y-6">
      <PageHeader title="数据采集" description="外部数据源采集管理和导入" />
      <ScrapeDataView />
    </div>
  );
}
