import { Inbox } from "lucide-react";

interface EmptyStateProps {
  title?: string;
  description?: string;
  icon?: React.ReactNode;
}

export function EmptyState({
  title = "暂无数据",
  description = "请调整筛选条件或搜索词",
  icon,
}: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-12 text-center">
      <div className="mb-3 text-muted-foreground">
        {icon || <Inbox className="h-10 w-10" />}
      </div>
      <h3 className="text-lg font-medium">{title}</h3>
      <p className="mt-1 text-sm text-muted-foreground">{description}</p>
    </div>
  );
}
