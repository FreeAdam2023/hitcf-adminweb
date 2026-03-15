import { Badge } from "@/components/ui/badge";

const TYPE_MAP: Record<string, { label: string; className: string }> = {
  listening: {
    label: "听力",
    className: "bg-blue-100 text-blue-700 hover:bg-blue-100 dark:bg-blue-900 dark:text-blue-300",
  },
  reading: {
    label: "阅读",
    className: "bg-emerald-100 text-emerald-700 hover:bg-emerald-100 dark:bg-emerald-900 dark:text-emerald-300",
  },
  speaking: {
    label: "口语",
    className: "bg-amber-100 text-amber-700 hover:bg-amber-100 dark:bg-amber-900 dark:text-amber-300",
  },
  writing: {
    label: "写作",
    className: "bg-rose-100 text-rose-700 hover:bg-rose-100 dark:bg-rose-900 dark:text-rose-300",
  },
};

export function TypeBadge({ type }: { type: string }) {
  const config = TYPE_MAP[type];
  if (!config) return <Badge variant="secondary">{type}</Badge>;
  return (
    <Badge variant="secondary" className={config.className}>
      {config.label}
    </Badge>
  );
}
