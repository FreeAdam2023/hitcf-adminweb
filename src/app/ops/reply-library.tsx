"use client";

import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Copy, Check, Sparkles, Plus, Trash2 } from "lucide-react";
import {
  fetchOpsReplies,
  createOpsReply,
  deleteOpsReply,
  generateReplyVariations,
  markReplyUsed,
} from "@/lib/api/admin";
import type { OpsReplyScenario, PaginatedResponse } from "@/lib/api/types";

export function ReplyLibrary() {
  const [data, setData] = useState<PaginatedResponse<OpsReplyScenario> | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshKey, setRefreshKey] = useState(0);
  const refresh = () => setRefreshKey((k) => k + 1);

  useEffect(() => {
    setLoading(true);
    fetchOpsReplies()
      .then(setData)
      .catch(() => setData(null))
      .finally(() => setLoading(false));
  }, [refreshKey]);

  const [createOpen, setCreateOpen] = useState(false);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [initialReplies, setInitialReplies] = useState("");

  const handleCreate = useCallback(async () => {
    if (!name.trim()) return;
    const replies = initialReplies
      .split("\n")
      .map((t) => t.trim())
      .filter(Boolean)
      .map((text) => ({ text }));
    await createOpsReply({ name: name.trim(), description: description.trim(), replies });
    setCreateOpen(false);
    setName("");
    setDescription("");
    setInitialReplies("");
    refresh();
  }, [name, description, initialReplies]);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          预设不同场景的回复话术，每条措辞不同，避免被平台检测
        </p>
        <Dialog open={createOpen} onOpenChange={setCreateOpen}>
          <DialogTrigger asChild>
            <Button className="gap-1.5"><Plus className="h-4 w-4" /> 新建场景</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>新建回复场景</DialogTitle></DialogHeader>
            <div className="space-y-3 pt-2">
              <div>
                <label className="text-sm font-medium">场景名称 *</label>
                <Input placeholder="例：用户想要词卡" value={name} onChange={(e) => setName(e.target.value)} />
              </div>
              <div>
                <label className="text-sm font-medium">场景描述</label>
                <Input placeholder="用户在评论区说想要 Anki 词卡时的回复" value={description} onChange={(e) => setDescription(e.target.value)} />
              </div>
              <div>
                <label className="text-sm font-medium">初始回复（每行一条，可选）</label>
                <Textarea
                  placeholder={"好的 看一下后台消息\n主页有写 同名搜就能找到\n后台回你啦 记得看"}
                  value={initialReplies}
                  onChange={(e) => setInitialReplies(e.target.value)}
                  rows={4}
                />
              </div>
              <Button onClick={handleCreate} disabled={!name.trim()} className="w-full">创建</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {loading ? (
        <p className="text-sm text-muted-foreground">加载中...</p>
      ) : !data?.items?.length ? (
        <p className="text-sm text-muted-foreground py-8 text-center">暂无回复场景</p>
      ) : (
        <div className="space-y-3">
          {data.items.map((scenario: OpsReplyScenario) => (
            <ScenarioCard key={scenario.id} scenario={scenario} onRefresh={refresh} />
          ))}
        </div>
      )}
    </div>
  );
}

function ScenarioCard({ scenario, onRefresh }: { scenario: OpsReplyScenario; onRefresh: () => void }) {
  const [generating, setGenerating] = useState(false);

  const handleGenerate = useCallback(async () => {
    setGenerating(true);
    try {
      await generateReplyVariations(scenario.id, 5);
      onRefresh();
    } catch {
      alert("生成失败");
    } finally {
      setGenerating(false);
    }
  }, [scenario.id, onRefresh]);

  const handleDelete = useCallback(async () => {
    if (!confirm(`确定删除「${scenario.name}」？`)) return;
    await deleteOpsReply(scenario.id);
    onRefresh();
  }, [scenario.id, scenario.name, onRefresh]);

  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between">
          <div>
            <CardTitle className="text-base">{scenario.name}</CardTitle>
            {scenario.description && (
              <p className="text-xs text-muted-foreground mt-0.5">{scenario.description}</p>
            )}
          </div>
          <div className="flex items-center gap-1.5">
            <Badge variant="outline">已用 {scenario.use_count} 次</Badge>
            <Button size="sm" variant="outline" className="gap-1" onClick={handleGenerate} disabled={generating}>
              <Sparkles className="h-3 w-3" /> {generating ? "生成中..." : "AI 补充"}
            </Button>
            <Button size="sm" variant="ghost" className="text-destructive" onClick={handleDelete}>
              <Trash2 className="h-3 w-3" />
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {scenario.replies.length === 0 ? (
          <p className="text-sm text-muted-foreground">暂无回复，点击「AI 补充」生成</p>
        ) : (
          <div className="space-y-1.5">
            {scenario.replies.map((reply, idx) => (
              <ReplyRow
                key={idx}
                scenarioId={scenario.id}
                index={idx}
                text={reply.text}
                useCount={reply.use_count}
                isAi={reply.is_ai_generated}
                onRefresh={onRefresh}
              />
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function ReplyRow({
  scenarioId,
  index,
  text,
  useCount,
  isAi,
  onRefresh,
}: {
  scenarioId: string;
  index: number;
  text: string;
  useCount: number;
  isAi: boolean;
  onRefresh: () => void;
}) {
  const [copied, setCopied] = useState(false);

  const handleCopy = useCallback(async () => {
    await navigator.clipboard.writeText(text);
    setCopied(true);
    await markReplyUsed(scenarioId, index);
    onRefresh();
    setTimeout(() => setCopied(false), 2000);
  }, [scenarioId, index, text, onRefresh]);

  return (
    <div className="flex items-center gap-2 rounded-md border px-3 py-2 text-sm">
      <span className="flex-1">{text}</span>
      <div className="flex items-center gap-1.5 shrink-0">
        {isAi && <Badge variant="secondary" className="text-[10px]">AI</Badge>}
        {useCount > 0 && (
          <span className="text-xs text-muted-foreground">用 {useCount}次</span>
        )}
        <Button size="sm" variant="ghost" className="h-7 w-7 p-0" onClick={handleCopy}>
          {copied ? <Check className="h-3.5 w-3.5 text-green-500" /> : <Copy className="h-3.5 w-3.5" />}
        </Button>
      </div>
    </div>
  );
}
