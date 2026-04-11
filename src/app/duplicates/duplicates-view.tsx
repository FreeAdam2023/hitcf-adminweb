"use client";

import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { toast } from "sonner";
import {
  fetchDuplicateGroups,
  fetchAnswerConflicts,
  fixGroupAnswer,
  dissolveDuplicateGroup,
  type DuplicateGroupSummary,
  type AnswerConflictItem,
} from "@/lib/api/admin";

export function DuplicatesView() {
  const [tab, setTab] = useState<"groups" | "conflicts">("conflicts");
  const [type, setType] = useState<"reading" | "listening">("reading");

  return (
    <div className="space-y-4">
      <Tabs value={tab} onValueChange={(v) => setTab(v as typeof tab)}>
        <div className="flex items-center justify-between">
          <TabsList>
            <TabsTrigger value="conflicts">答案冲突</TabsTrigger>
            <TabsTrigger value="groups">所有重复组</TabsTrigger>
          </TabsList>
          <div className="flex gap-2">
            <Button
              variant={type === "reading" ? "default" : "outline"}
              size="sm"
              onClick={() => setType("reading")}
            >
              阅读
            </Button>
            <Button
              variant={type === "listening" ? "default" : "outline"}
              size="sm"
              onClick={() => setType("listening")}
            >
              听力
            </Button>
          </div>
        </div>

        <TabsContent value="conflicts" className="mt-4">
          <ConflictsList type={type} />
        </TabsContent>

        <TabsContent value="groups" className="mt-4">
          <GroupsList type={type} />
        </TabsContent>
      </Tabs>
    </div>
  );
}

function ConflictsList({ type }: { type: "reading" | "listening" }) {
  const [items, setItems] = useState<AnswerConflictItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);

  useEffect(() => {
    setLoading(true);
    fetchAnswerConflicts({ type, page, page_size: 20 })
      .then((r) => {
        setItems(r.items);
        setTotal(r.total);
      })
      .catch(() => toast.error("加载失败"))
      .finally(() => setLoading(false));
  }, [type, page]);

  const handleFix = async (groupId: string, answer: string) => {
    try {
      const r = await fixGroupAnswer(groupId, answer);
      toast.success(`已更新 ${r.updated} 道题为答案 ${answer}`);
      setItems((prev) => prev.filter((g) => g.group_id !== groupId));
    } catch {
      toast.error("更新失败");
    }
  };

  if (loading) return <div className="text-sm text-muted-foreground">加载中...</div>;
  if (items.length === 0)
    return (
      <Card className="p-8 text-center text-muted-foreground">
        没有答案冲突的重复组 🎉
      </Card>
    );

  return (
    <div className="space-y-3">
      <div className="text-sm text-muted-foreground">
        共 {total} 个组有答案冲突 · 第 {page} 页
      </div>
      {items.map((g) => (
        <Card key={g.group_id} className="p-4 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="font-mono text-xs text-muted-foreground">
                {g.group_id.slice(0, 8)}
              </span>
              <Badge variant="outline">{g.question_count} 道题</Badge>
              <Badge variant="destructive">
                答案不一致：{g.distinct_answers.join(" / ")}
              </Badge>
              {g.primary_answer && (
                <Badge variant="default">primary: {g.primary_answer}</Badge>
              )}
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                if (confirm("解散这个重复组（清除所有重复标记）？")) {
                  dissolveDuplicateGroup(g.group_id).then(() => {
                    toast.success("已解散");
                    setItems((prev) => prev.filter((x) => x.group_id !== g.group_id));
                  });
                }
              }}
            >
              解散
            </Button>
          </div>

          <div className="grid grid-cols-1 gap-2 text-xs">
            {g.questions.map((q) => (
              <div
                key={q.id}
                className="flex items-center justify-between rounded border bg-muted/30 px-3 py-2"
              >
                <div className="flex items-center gap-3 flex-1">
                  <span className="font-mono font-semibold">
                    {q.question_code || `?-${q.question_number}`}
                  </span>
                  <Badge variant="outline" className="text-[10px]">
                    {q.test_set_code}
                  </Badge>
                  <Badge variant="outline" className="text-[10px]">
                    Q{q.question_number}
                  </Badge>
                  <Badge variant="outline" className="text-[10px]">
                    {q.level}
                  </Badge>
                  <Badge
                    variant="outline"
                    className={
                      q.source_origin === "opal"
                        ? "text-[10px] bg-amber-50 text-amber-700"
                        : "text-[10px] bg-blue-50 text-blue-700"
                    }
                  >
                    {q.source_origin}
                  </Badge>
                  {q.duplicate_status === "primary" && (
                    <Badge className="text-[10px]">primary</Badge>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-muted-foreground">答案:</span>
                  <Badge variant="secondary" className="font-mono">
                    {q.correct_answer || "?"}
                  </Badge>
                </div>
              </div>
            ))}
          </div>

          <div className="flex items-center gap-2 pt-2 border-t">
            <span className="text-sm text-muted-foreground">统一答案为:</span>
            {["A", "B", "C", "D"].map((a) => (
              <Button
                key={a}
                size="sm"
                variant={g.primary_answer === a ? "default" : "outline"}
                onClick={() => handleFix(g.group_id, a)}
              >
                {a}
              </Button>
            ))}
          </div>
        </Card>
      ))}

      <div className="flex items-center justify-between pt-2">
        <Button
          variant="outline"
          size="sm"
          disabled={page === 1}
          onClick={() => setPage((p) => p - 1)}
        >
          上一页
        </Button>
        <span className="text-sm text-muted-foreground">第 {page} 页</span>
        <Button
          variant="outline"
          size="sm"
          disabled={items.length < 20}
          onClick={() => setPage((p) => p + 1)}
        >
          下一页
        </Button>
      </div>
    </div>
  );
}

function GroupsList({ type }: { type: "reading" | "listening" }) {
  const [items, setItems] = useState<DuplicateGroupSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [stats, setStats] = useState<{
    total_groups: number;
    total_questions: number;
    marked_count: number;
  } | null>(null);

  useEffect(() => {
    setLoading(true);
    fetchDuplicateGroups({ type, status: "all", page, page_size: 20 })
      .then((r) => {
        setItems(r.items);
        setStats(r.stats);
      })
      .catch(() => toast.error("加载失败"))
      .finally(() => setLoading(false));
  }, [type, page]);

  if (loading) return <div className="text-sm text-muted-foreground">加载中...</div>;

  return (
    <div className="space-y-3">
      {stats && (
        <div className="text-sm text-muted-foreground">
          全站重复组：{stats.total_groups} · 涉及题目：{stats.total_questions} · 已标记：
          {stats.marked_count}
        </div>
      )}
      {items.map((g) => (
        <Card key={g.group_id} className="p-4 space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="font-mono text-xs text-muted-foreground">
                {g.group_id.slice(0, 8)}
              </span>
              <Badge variant="outline">{g.question_count} 道题</Badge>
              {g.has_primary && <Badge>有 primary</Badge>}
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                if (confirm("解散这个重复组？")) {
                  dissolveDuplicateGroup(g.group_id).then(() => {
                    toast.success("已解散");
                    setItems((prev) => prev.filter((x) => x.group_id !== g.group_id));
                  });
                }
              }}
            >
              解散
            </Button>
          </div>
          <div className="grid grid-cols-2 gap-1 text-xs">
            {g.questions.map((q) => (
              <div
                key={q.id}
                className="flex items-center gap-2 rounded border bg-muted/30 px-2 py-1"
              >
                <Badge variant="outline" className="text-[10px]">
                  {q.test_set_code}
                </Badge>
                <span>Q{q.question_number}</span>
                <Badge variant="outline" className="text-[10px]">
                  {q.level}
                </Badge>
                {q.duplicate_status === "primary" && (
                  <Badge className="text-[10px]">primary</Badge>
                )}
                {q.duplicate_status === "duplicate" && (
                  <Badge variant="secondary" className="text-[10px]">
                    duplicate
                  </Badge>
                )}
              </div>
            ))}
          </div>
        </Card>
      ))}
      <div className="flex items-center justify-between pt-2">
        <Button
          variant="outline"
          size="sm"
          disabled={page === 1}
          onClick={() => setPage((p) => p - 1)}
        >
          上一页
        </Button>
        <span className="text-sm text-muted-foreground">第 {page} 页</span>
        <Button
          variant="outline"
          size="sm"
          disabled={items.length < 20}
          onClick={() => setPage((p) => p + 1)}
        >
          下一页
        </Button>
      </div>
    </div>
  );
}
