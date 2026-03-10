"use client";

import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Sparkles, Copy, Check, AlertTriangle, Trash2, Eye, Pencil } from "lucide-react";
import {
  fetchOpsDrafts,
  generateOpsDrafts,
  updateOpsDraft,
  deleteOpsDraft,
  checkDraftBannedWords,
  updateDraftPerformance,
} from "@/lib/api/admin";
import type { OpsContentDraft, PaginatedResponse } from "@/lib/api/types";

const STATUS_MAP: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
  draft: { label: "草稿", variant: "secondary" },
  scheduled: { label: "已排期", variant: "outline" },
  published: { label: "已发布", variant: "default" },
  archived: { label: "已归档", variant: "destructive" },
};

const TONE_OPTIONS = [
  { value: "casual", label: "轻松真实" },
  { value: "professional", label: "专业" },
  { value: "funny", label: "幽默" },
  { value: "informative", label: "干货" },
];

export function ContentStudio() {
  const [data, setData] = useState<PaginatedResponse<OpsContentDraft> | null>(null);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState("");
  const [search, setSearch] = useState("");
  const [refreshKey, setRefreshKey] = useState(0);

  const refresh = () => setRefreshKey((k) => k + 1);

  useEffect(() => {
    setLoading(true);
    fetchOpsDrafts({ page, status: statusFilter || undefined, search: search || undefined })
      .then(setData)
      .catch(() => setData(null))
      .finally(() => setLoading(false));
  }, [page, statusFilter, search, refreshKey]);

  // Generate dialog state
  const [genOpen, setGenOpen] = useState(false);
  const [topic, setTopic] = useState("");
  const [angle, setAngle] = useState("");
  const [tone, setTone] = useState("casual");
  const [genCount, setGenCount] = useState(3);
  const [generating, setGenerating] = useState(false);

  const handleGenerate = useCallback(async () => {
    if (!topic.trim()) return;
    setGenerating(true);
    try {
      await generateOpsDrafts({
        topic: topic.trim(),
        angle: angle.trim() || undefined,
        tone,
        count: genCount,
      });
      setGenOpen(false);
      setTopic("");
      setAngle("");
      refresh();
    } catch {
      alert("生成失败，请重试");
    } finally {
      setGenerating(false);
    }
  }, [topic, angle, tone, genCount]);

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-3">
        <Input
          placeholder="搜索标题/主题..."
          value={search}
          onChange={(e) => { setSearch(e.target.value); setPage(1); }}
          className="w-60"
        />
        <Select value={statusFilter} onValueChange={(v) => { setStatusFilter(v === "all" ? "" : v); setPage(1); }}>
          <SelectTrigger className="w-32">
            <SelectValue placeholder="全部状态" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">全部状态</SelectItem>
            <SelectItem value="draft">草稿</SelectItem>
            <SelectItem value="scheduled">已排期</SelectItem>
            <SelectItem value="published">已发布</SelectItem>
          </SelectContent>
        </Select>

        <Dialog open={genOpen} onOpenChange={setGenOpen}>
          <DialogTrigger asChild>
            <Button className="ml-auto gap-1.5">
              <Sparkles className="h-4 w-4" /> AI 生成文案
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>AI 生成小红书文案</DialogTitle>
            </DialogHeader>
            <div className="space-y-3 pt-2">
              <div>
                <label className="text-sm font-medium">主题 *</label>
                <Input placeholder="例：TCF 听力备考方法" value={topic} onChange={(e) => setTopic(e.target.value)} />
              </div>
              <div>
                <label className="text-sm font-medium">角度（可选）</label>
                <Input placeholder="例：从零基础到 NCLC 7 的经验" value={angle} onChange={(e) => setAngle(e.target.value)} />
              </div>
              <div className="flex gap-3">
                <div className="flex-1">
                  <label className="text-sm font-medium">语气</label>
                  <Select value={tone} onValueChange={setTone}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {TONE_OPTIONS.map((t) => (
                        <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="w-24">
                  <label className="text-sm font-medium">数量</label>
                  <Select value={String(genCount)} onValueChange={(v) => setGenCount(Number(v))}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {[1, 2, 3, 4, 5].map((n) => (
                        <SelectItem key={n} value={String(n)}>{n}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <Button onClick={handleGenerate} disabled={generating || !topic.trim()} className="w-full">
                {generating ? "生成中..." : "开始生成"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Draft list */}
      {loading ? (
        <p className="text-muted-foreground text-sm">加载中...</p>
      ) : !data?.items?.length ? (
        <p className="text-muted-foreground text-sm py-8 text-center">暂无文案，点击「AI 生成文案」开始</p>
      ) : (
        <div className="space-y-3">
          {data.items.map((draft: OpsContentDraft) => (
            <DraftCard key={draft.id} draft={draft} onRefresh={refresh} />
          ))}
        </div>
      )}

      {/* Pagination */}
      {data && data.total_pages > 1 && (
        <div className="flex items-center justify-center gap-2 pt-2">
          <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage(page - 1)}>上一页</Button>
          <span className="text-sm text-muted-foreground">{page} / {data.total_pages}</span>
          <Button variant="outline" size="sm" disabled={page >= data.total_pages} onClick={() => setPage(page + 1)}>下一页</Button>
        </div>
      )}
    </div>
  );
}

function DraftCard({ draft, onRefresh }: { draft: OpsContentDraft; onRefresh: () => void }) {
  const [copied, setCopied] = useState(false);
  const [editing, setEditing] = useState(false);
  const [title, setTitle] = useState(draft.title);
  const [body, setBody] = useState(draft.body);
  const [perfOpen, setPerfOpen] = useState(false);
  const [perf, setPerf] = useState({
    views: draft.performance?.views ?? 0,
    likes: draft.performance?.likes ?? 0,
    comments: draft.performance?.comments ?? 0,
    saves: draft.performance?.saves ?? 0,
  });

  const copyToClipboard = useCallback(() => {
    const text = `${draft.title}\n\n${draft.body}\n\n${draft.hashtags.map((h: string) => (h.startsWith("#") ? h : `#${h}`)).join(" ")}`;
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, [draft]);

  const handleSave = useCallback(async () => {
    await updateOpsDraft(draft.id, { title, body } as Partial<OpsContentDraft>);
    setEditing(false);
    onRefresh();
  }, [draft.id, title, body, onRefresh]);

  const handleStatusChange = useCallback(async (status: string) => {
    await updateOpsDraft(draft.id, { status } as Partial<OpsContentDraft>);
    onRefresh();
  }, [draft.id, onRefresh]);

  const handleDelete = useCallback(async () => {
    if (!confirm("确定归档此文案？")) return;
    await deleteOpsDraft(draft.id);
    onRefresh();
  }, [draft.id, onRefresh]);

  const handleCheckBanned = useCallback(async () => {
    const res = await checkDraftBannedWords(draft.id);
    if (res.count === 0) {
      alert("未发现违禁词");
    } else {
      alert(`发现 ${res.count} 个违禁词: ${res.banned_words_found.join(", ")}`);
    }
    onRefresh();
  }, [draft.id, onRefresh]);

  const handlePerfSave = useCallback(async () => {
    await updateDraftPerformance(draft.id, perf);
    setPerfOpen(false);
    onRefresh();
  }, [draft.id, perf, onRefresh]);

  const status = STATUS_MAP[draft.status] || STATUS_MAP.draft;

  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            {editing ? (
              <Input value={title} onChange={(e) => setTitle(e.target.value)} className="font-semibold" />
            ) : (
              <CardTitle className="text-base truncate">{draft.title || "（无标题）"}</CardTitle>
            )}
            <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
              <span>{draft.topic}</span>
              {draft.angle && <span>· {draft.angle}</span>}
              <span>· {new Date(draft.created_at).toLocaleDateString("zh-CN")}</span>
            </div>
          </div>
          <div className="flex items-center gap-1.5 shrink-0">
            <Badge variant={status.variant}>{status.label}</Badge>
            {draft.banned_words_found.length > 0 && (
              <Badge variant="destructive" className="gap-1">
                <AlertTriangle className="h-3 w-3" /> {draft.banned_words_found.length}
              </Badge>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-2">
        {editing ? (
          <Textarea value={body} onChange={(e) => setBody(e.target.value)} rows={6} />
        ) : (
          <p className="text-sm text-muted-foreground whitespace-pre-line line-clamp-4">{draft.body}</p>
        )}
        {draft.hashtags.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {draft.hashtags.map((h: string, i: number) => (
              <Badge key={i} variant="outline" className="text-xs">#{h.replace(/^#/, "")}</Badge>
            ))}
          </div>
        )}

        {/* Performance row */}
        {draft.performance && (
          <div className="flex gap-4 text-xs text-muted-foreground pt-1 border-t">
            <span>浏览 {draft.performance.views}</span>
            <span>点赞 {draft.performance.likes}</span>
            <span>评论 {draft.performance.comments}</span>
            <span>收藏 {draft.performance.saves}</span>
          </div>
        )}

        {/* Action buttons */}
        <div className="flex flex-wrap gap-1.5 pt-1">
          {editing ? (
            <>
              <Button size="sm" onClick={handleSave}>保存</Button>
              <Button size="sm" variant="ghost" onClick={() => { setEditing(false); setTitle(draft.title); setBody(draft.body); }}>取消</Button>
            </>
          ) : (
            <>
              <Button size="sm" variant="outline" className="gap-1" onClick={() => setEditing(true)}>
                <Pencil className="h-3 w-3" /> 编辑
              </Button>
              <Button size="sm" variant="outline" className="gap-1" onClick={copyToClipboard}>
                {copied ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
                {copied ? "已复制" : "复制全文"}
              </Button>
              <Button size="sm" variant="outline" className="gap-1" onClick={handleCheckBanned}>
                <AlertTriangle className="h-3 w-3" /> 检查违禁词
              </Button>
              {draft.status === "draft" && (
                <Button size="sm" variant="outline" onClick={() => handleStatusChange("published")}>标记已发布</Button>
              )}
              {draft.status === "published" && (
                <Dialog open={perfOpen} onOpenChange={setPerfOpen}>
                  <DialogTrigger asChild>
                    <Button size="sm" variant="outline" className="gap-1">
                      <Eye className="h-3 w-3" /> 更新数据
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader><DialogTitle>更新发布数据</DialogTitle></DialogHeader>
                    <div className="grid grid-cols-2 gap-3 pt-2">
                      {(["views", "likes", "comments", "saves"] as const).map((k) => (
                        <div key={k}>
                          <label className="text-sm font-medium">{{ views: "浏览", likes: "点赞", comments: "评论", saves: "收藏" }[k]}</label>
                          <Input type="number" value={perf[k]} onChange={(e) => setPerf({ ...perf, [k]: Number(e.target.value) })} />
                        </div>
                      ))}
                    </div>
                    <Button onClick={handlePerfSave} className="w-full mt-2">保存</Button>
                  </DialogContent>
                </Dialog>
              )}
              <Button size="sm" variant="ghost" className="gap-1 text-destructive" onClick={handleDelete}>
                <Trash2 className="h-3 w-3" />
              </Button>
            </>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
