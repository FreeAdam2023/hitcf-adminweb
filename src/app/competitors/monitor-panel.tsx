"use client";

import { useState, useEffect, useCallback } from "react";
import { toast } from "sonner";
import { RefreshCw, Activity } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { fetchCompetitors, checkCompetitor, checkAllCompetitors } from "@/lib/api/admin";
import type { CompetitorItem } from "@/lib/api/types";

function formatDate(iso: string) {
  return new Date(iso).toLocaleString("zh-CN", {
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function MonitorPanel() {
  const [items, setItems] = useState<CompetitorItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [checking, setChecking] = useState<string | null>(null);
  const [checkingAll, setCheckingAll] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetchCompetitors({ page_size: 50 });
      setItems(res.items);
    } catch {
      toast.error("加载失败");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleCheck = async (id: string) => {
    setChecking(id);
    try {
      const snapshot = await checkCompetitor(id);
      toast.success(snapshot.is_up ? "网站在线" : "网站宕机");
      load();
    } catch {
      toast.error("检测失败");
    } finally {
      setChecking(null);
    }
  };

  const handleCheckAll = async () => {
    setCheckingAll(true);
    try {
      const result = await checkAllCompetitors();
      const downCount = result.results.filter((r: { is_up: boolean }) => !r.is_up).length;
      if (downCount > 0) {
        toast.error(`${result.checked} 个站点中有 ${downCount} 个宕机`);
      } else {
        toast.success(`全部 ${result.checked} 个监控站点均在线`);
      }
      load();
    } catch {
      toast.error("批量检测失败");
    } finally {
      setCheckingAll(false);
    }
  };

  const monitored = items.filter((i) => i.monitor_enabled);
  const upCount = monitored.filter((i) => i.last_check?.is_up).length;
  const downCount = monitored.filter((i) => i.last_check && !i.last_check.is_up).length;
  const unchecked = monitored.filter((i) => !i.last_check).length;

  if (loading) return <p className="text-sm text-muted-foreground">加载中...</p>;

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-4 gap-4">
        <div className="rounded-lg border p-4 text-center">
          <div className="text-2xl font-bold">{monitored.length}</div>
          <div className="text-sm text-muted-foreground">监控中</div>
        </div>
        <div className="rounded-lg border p-4 text-center">
          <div className="text-2xl font-bold text-green-600">{upCount}</div>
          <div className="text-sm text-muted-foreground">在线</div>
        </div>
        <div className="rounded-lg border p-4 text-center">
          <div className="text-2xl font-bold text-red-600">{downCount}</div>
          <div className="text-sm text-muted-foreground">宕机</div>
        </div>
        <div className="rounded-lg border p-4 text-center">
          <div className="text-2xl font-bold text-gray-400">{unchecked}</div>
          <div className="text-sm text-muted-foreground">未检测</div>
        </div>
      </div>

      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium">已启用监控的竞品</h3>
        <Button
          onClick={handleCheckAll}
          disabled={checkingAll || monitored.length === 0}
          size="sm"
          variant="outline"
        >
          <RefreshCw className={`mr-1 h-4 w-4 ${checkingAll ? "animate-spin" : ""}`} />
          {checkingAll ? "检测中..." : "全部检测"}
        </Button>
      </div>

      {monitored.length === 0 ? (
        <div className="rounded-lg border p-8 text-center text-muted-foreground">
          暂无启用监控的竞品，请编辑竞品并启用监控。
        </div>
      ) : (
        <div className="space-y-2">
          {monitored.map((item) => (
            <div key={item.id} className="flex items-center justify-between rounded-lg border p-4">
              <div className="flex items-center gap-3">
                <span
                  className={`inline-block h-3 w-3 rounded-full ${
                    item.last_check
                      ? item.last_check.is_up
                        ? "bg-green-500"
                        : "bg-red-500"
                      : "bg-gray-300"
                  }`}
                />
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-medium">{item.name}</span>
                    {item.last_check && (
                      <Badge variant={item.last_check.is_up ? "default" : "destructive"}>
                        {item.last_check.is_up ? `${item.last_check.status_code} OK` : item.last_check.notes || "宕机"}
                      </Badge>
                    )}
                    {item.last_check?.changes_detected && (
                      <Badge variant="secondary">
                        <Activity className="mr-1 h-3 w-3" /> 检测到变化
                      </Badge>
                    )}
                  </div>
                  <div className="text-xs text-muted-foreground mt-0.5">
                    <a href={item.url} target="_blank" rel="noopener noreferrer" className="hover:underline">
                      {item.url}
                    </a>
                    {item.last_check && (
                      <span className="ml-3">上次检测: {formatDate(item.last_check.checked_at)}</span>
                    )}
                    {item.last_check?.notes && (
                      <span className="ml-3 text-muted-foreground">标题: {item.last_check.notes}</span>
                    )}
                  </div>
                </div>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleCheck(item.id)}
                disabled={checking === item.id}
              >
                <RefreshCw className={`h-4 w-4 ${checking === item.id ? "animate-spin" : ""}`} />
              </Button>
            </div>
          ))}
        </div>
      )}

      {/* Non-monitored competitors */}
      {items.filter((i) => !i.monitor_enabled).length > 0 && (
        <>
          <h3 className="text-sm font-medium text-muted-foreground">
            未监控 ({items.filter((i) => !i.monitor_enabled).length})
          </h3>
          <div className="space-y-1">
            {items.filter((i) => !i.monitor_enabled).map((item) => (
              <div key={item.id} className="flex items-center gap-3 rounded-lg border p-3 text-sm text-muted-foreground">
                <span className="inline-block h-2 w-2 rounded-full bg-gray-300" />
                <span>{item.name}</span>
                <a href={item.url} target="_blank" rel="noopener noreferrer" className="hover:underline text-xs">
                  {item.url}
                </a>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
