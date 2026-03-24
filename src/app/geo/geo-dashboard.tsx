"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

import {
  CheckCircle2,
  XCircle,
  Loader2,
  ExternalLink,
  Play,
  Bot,
  TrendingUp,
  AlertTriangle,
} from "lucide-react";
import { toast } from "sonner";
import {
  fetchGeoCheck,
  fetchGeoHistory,
  fetchGeoContent,
  addGeoContent,
  seedGeoContent,
  deleteGeoContent,
} from "@/lib/api/admin";
import type {
  GeoCheckResult,
  GeoEngineResult,
  GeoSummary,
  GeoContentItem,
} from "@/lib/api/types";

/* ──────────────────── Engine metadata ──────────────────── */

const ENGINE_META: Record<string, { label: string; icon: string; color: string }> = {
  chatgpt: { label: "ChatGPT", icon: "🤖", color: "bg-green-500" },
  grok: { label: "Grok", icon: "𝕏", color: "bg-gray-800" },
  gemini: { label: "Gemini", icon: "💎", color: "bg-blue-500" },
  deepseek: { label: "DeepSeek", icon: "🔍", color: "bg-indigo-500" },
  doubao: { label: "豆包", icon: "🫘", color: "bg-orange-500" },
};

const LANG_LABELS: Record<string, string> = {
  en: "English",
  fr: "Français",
  zh: "中文",
};

/* ──────────────────── Main Dashboard ──────────────────── */

interface Props {
  tab: string;
}

export function GeoDashboard({ tab }: Props) {
  const [loading, setLoading] = useState(false);
  const [checking, setChecking] = useState(false);
  const [summary, setSummary] = useState<GeoSummary | null>(null);
  const [results, setResults] = useState<GeoCheckResult[]>([]);
  const [expandedPrompt, setExpandedPrompt] = useState<string | null>(null);

  // Load history on mount
  useEffect(() => {
    loadHistory();
  }, []);

  async function loadHistory() {
    setLoading(true);
    try {
      const data = await fetchGeoHistory(30);
      setSummary(data.summary);
      setResults(data.latest);
    } catch {
      // No history yet
    } finally {
      setLoading(false);
    }
  }

  async function runCheck() {
    setChecking(true);
    try {
      const data = await fetchGeoCheck();
      toast.success(`检测完成: ${data.total_prompts} 个 prompt`);
      await loadHistory();
    } catch (e) {
      toast.error("检测失败: " + (e as Error).message);
    } finally {
      setChecking(false);
    }
  }

  if (tab === "overview") {
    return (
      <div className="space-y-6">
        {/* Summary cards */}
        <div className="grid gap-4 sm:grid-cols-3">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className={`flex h-12 w-12 items-center justify-center rounded-xl ${
                  summary && summary.mention_rate >= 50
                    ? "bg-green-100 text-green-600 dark:bg-green-950 dark:text-green-400"
                    : "bg-red-100 text-red-600 dark:bg-red-950 dark:text-red-400"
                }`}>
                  {summary && summary.mention_rate >= 50 ? (
                    <CheckCircle2 className="h-6 w-6" />
                  ) : (
                    <AlertTriangle className="h-6 w-6" />
                  )}
                </div>
                <div>
                  <div className="text-3xl font-bold">
                    {summary ? `${summary.mention_rate}%` : "—"}
                  </div>
                  <div className="text-sm text-muted-foreground">AI 引用率</div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-100 text-blue-600 dark:bg-blue-950 dark:text-blue-400">
                  <Bot className="h-6 w-6" />
                </div>
                <div>
                  <div className="text-3xl font-bold">
                    {summary ? `${summary.mentioned_count}/${summary.total_prompts}` : "—"}
                  </div>
                  <div className="text-sm text-muted-foreground">推荐 / 总查询</div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-purple-100 text-purple-600 dark:bg-purple-950 dark:text-purple-400">
                  <TrendingUp className="h-6 w-6" />
                </div>
                <div>
                  <div className="text-3xl font-bold">
                    {summary?.top_competitors.length ?? 0}
                  </div>
                  <div className="text-sm text-muted-foreground">检测到的竞品</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Run check button */}
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold">AI 推荐检测结果</h3>
          <Button onClick={runCheck} disabled={checking}>
            {checking ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Play className="mr-2 h-4 w-4" />
            )}
            {checking ? "检测中..." : "立即检测"}
          </Button>
        </div>

        {/* Results table */}
        {loading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : results.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center text-muted-foreground">
              暂无检测数据，点击「立即检测」开始
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {results.map((result) => (
              <PromptResultCard
                key={result.prompt_id}
                result={result}
                expanded={expandedPrompt === result.prompt_id}
                onToggle={() =>
                  setExpandedPrompt(
                    expandedPrompt === result.prompt_id ? null : result.prompt_id
                  )
                }
              />
            ))}
          </div>
        )}

        {/* Competitors */}
        {summary && summary.top_competitors.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="text-base">竞品出现频率</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                {summary.top_competitors.map(([name, count]) => (
                  <Badge key={name} variant="secondary" className="text-sm">
                    {name} <span className="ml-1 opacity-60">×{count}</span>
                  </Badge>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    );
  }

  if (tab === "content") {
    return <ContentTracker />;
  }

  if (tab === "manual") {
    return <ManualTestPrompts />;
  }

  return null;
}

/* ──────────────────── Prompt Result Card ──────────────────── */

function PromptResultCard({
  result,
  expanded,
  onToggle,
}: {
  result: GeoCheckResult;
  expanded: boolean;
  onToggle: () => void;
}) {
  const anyMentioned = result.engines.some((e) => e.mentioned && !e.error);
  const checkedAt = new Date(result.checked_at).toLocaleString("zh-CN");

  return (
    <Card className="overflow-hidden">
      {/* Header — clickable */}
      <div
        className="flex cursor-pointer items-center gap-3 px-4 py-3 hover:bg-muted/30 transition-colors"
        onClick={onToggle}
      >
        {/* Status icon */}
        {anyMentioned ? (
          <CheckCircle2 className="h-5 w-5 shrink-0 text-green-500" />
        ) : (
          <XCircle className="h-5 w-5 shrink-0 text-red-500" />
        )}

        {/* Prompt text */}
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="text-[10px] shrink-0">
              {LANG_LABELS[result.prompt_lang] || result.prompt_lang}
            </Badge>
            <p className="truncate text-sm font-medium">{result.prompt_text}</p>
          </div>
        </div>

        {/* Engine status badges */}
        <div className="flex shrink-0 items-center gap-1.5">
          {result.engines.map((eng) => {
            const meta = ENGINE_META[eng.engine] || { label: eng.engine, icon: "?", color: "bg-gray-400" };
            return (
              <span
                key={eng.engine}
                title={`${meta.label}: ${eng.error ? "错误" : eng.mentioned ? "已推荐" : "未推荐"}`}
                className={`inline-flex h-6 w-6 items-center justify-center rounded-full text-xs ${
                  eng.error
                    ? "bg-gray-200 text-gray-500 dark:bg-gray-800"
                    : eng.mentioned
                    ? "bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300"
                    : "bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300"
                }`}
              >
                {meta.icon}
              </span>
            );
          })}
        </div>

        {/* Time */}
        <span className="shrink-0 text-xs text-muted-foreground">{checkedAt}</span>
      </div>

      {/* Expanded detail */}
      {expanded && (
        <div className="border-t px-4 py-3 space-y-4">
          {result.engines.map((eng) => (
            <EngineDetail key={eng.engine} engine={eng} />
          ))}
        </div>
      )}
    </Card>
  );
}

/* ──────────────────── Engine Detail ──────────────────── */

function EngineDetail({ engine }: { engine: GeoEngineResult }) {
  const meta = ENGINE_META[engine.engine] || { label: engine.engine, icon: "?", color: "bg-gray-400" };

  if (engine.error) {
    return (
      <div className="rounded-lg bg-muted/30 p-3">
        <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
          <span>{meta.icon}</span>
          <span>{meta.label}</span>
          <Badge variant="outline" className="text-[10px] text-amber-600">未配置</Badge>
        </div>
        <p className="mt-1 text-xs text-muted-foreground">{engine.error}</p>
      </div>
    );
  }

  return (
    <div className="rounded-lg border p-3 space-y-2">
      {/* Engine header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-sm font-medium">
          <span>{meta.icon}</span>
          <span>{meta.label}</span>
          {engine.mentioned ? (
            <Badge className="bg-green-500 text-white text-[10px]">已推荐</Badge>
          ) : (
            <Badge variant="destructive" className="text-[10px]">未推荐</Badge>
          )}
          {engine.cited && (
            <Badge className="bg-blue-500 text-white text-[10px]">有引用链接</Badge>
          )}
        </div>
        {engine.competitors.length > 0 && (
          <div className="flex items-center gap-1">
            <span className="text-[10px] text-muted-foreground">竞品:</span>
            {engine.competitors.map((c) => (
              <Badge key={c} variant="secondary" className="text-[10px]">
                {c}
              </Badge>
            ))}
          </div>
        )}
      </div>

      {/* Response preview */}
      <div className="rounded bg-muted/40 p-2 text-xs text-muted-foreground max-h-40 overflow-y-auto whitespace-pre-wrap">
        {engine.response_preview || "（无回复）"}
      </div>

      {/* Citations */}
      {engine.citations.length > 0 && (
        <div className="space-y-1">
          <div className="text-xs font-medium">引用源 ({engine.citations.length})</div>
          <div className="space-y-0.5">
            {engine.citations.map((url, i) => {
              const isHitcf = url.toLowerCase().includes("hitcf");
              return (
                <a
                  key={i}
                  href={url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`flex items-center gap-1 text-xs hover:underline ${
                    isHitcf
                      ? "text-green-600 font-medium"
                      : "text-blue-600"
                  }`}
                >
                  <ExternalLink className="h-3 w-3 shrink-0" />
                  <span className="truncate">{url}</span>
                  {isHitcf && <span className="shrink-0">⭐</span>}
                </a>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

/* ──────────────────── Content Tracker (喂料追踪) ──────────────────── */

const PLATFORM_META: Record<string, { label: string; icon: string }> = {
  medium: { label: "Medium", icon: "📝" },
  zhihu: { label: "知乎", icon: "🔵" },
  reddit: { label: "Reddit", icon: "🟠" },
  quora: { label: "Quora", icon: "🔴" },
  xiaohongshu: { label: "小红书", icon: "📕" },
  other: { label: "其他", icon: "🔗" },
};

function ContentTracker() {
  const [items, setItems] = useState<GeoContentItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState(false);
  const [newUrl, setNewUrl] = useState("");
  const [newTitle, setNewTitle] = useState("");
  const [newPlatform, setNewPlatform] = useState("zhihu");
  const [newLang, setNewLang] = useState("zh");
  const [newNotes, setNewNotes] = useState("");

  useEffect(() => {
    loadContent();
  }, []);

  async function loadContent() {
    try {
      const data = await fetchGeoContent();
      setItems(data.items);
    } catch {
      // Try seed first
      try {
        await seedGeoContent();
        const data = await fetchGeoContent();
        setItems(data.items);
      } catch {
        // ignore
      }
    } finally {
      setLoading(false);
    }
  }

  async function handleAdd() {
    if (!newUrl || !newTitle) return;
    setAdding(true);
    try {
      await addGeoContent({
        url: newUrl,
        title: newTitle,
        platform: newPlatform,
        lang: newLang,
        notes: newNotes,
      });
      setNewUrl("");
      setNewTitle("");
      setNewNotes("");
      toast.success("已添加");
      await loadContent();
    } catch (e) {
      toast.error("添加失败: " + (e as Error).message);
    } finally {
      setAdding(false);
    }
  }

  async function handleDelete(id: string) {
    try {
      await deleteGeoContent(id);
      toast.success("已删除");
      await loadContent();
    } catch (e) {
      toast.error("删除失败: " + (e as Error).message);
    }
  }

  return (
    <div className="space-y-6">
      {/* Add new */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">添加喂料文章</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 sm:grid-cols-2">
            <input
              className="rounded-md border bg-background px-3 py-2 text-sm"
              placeholder="文章 URL"
              value={newUrl}
              onChange={(e) => setNewUrl(e.target.value)}
            />
            <input
              className="rounded-md border bg-background px-3 py-2 text-sm"
              placeholder="标题"
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
            />
            <select
              className="rounded-md border bg-background px-3 py-2 text-sm"
              value={newPlatform}
              onChange={(e) => setNewPlatform(e.target.value)}
            >
              {Object.entries(PLATFORM_META).map(([key, meta]) => (
                <option key={key} value={key}>{meta.icon} {meta.label}</option>
              ))}
            </select>
            <div className="flex gap-2">
              <select
                className="rounded-md border bg-background px-3 py-2 text-sm flex-1"
                value={newLang}
                onChange={(e) => setNewLang(e.target.value)}
              >
                <option value="zh">中文</option>
                <option value="en">English</option>
                <option value="fr">Français</option>
              </select>
              <Button onClick={handleAdd} disabled={adding || !newUrl || !newTitle}>
                {adding ? <Loader2 className="h-4 w-4 animate-spin" /> : "添加"}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* List */}
      {loading ? (
        <div className="flex justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      ) : items.length === 0 ? (
        <Card>
          <CardContent className="py-8 text-center text-muted-foreground">
            暂无喂料记录
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2">
          {items.map((item) => {
            const meta = PLATFORM_META[item.platform] || PLATFORM_META.other;
            return (
              <Card key={item._id}>
                <CardContent className="flex items-center gap-3 py-3">
                  <span className="text-lg">{meta.icon}</span>
                  <div className="min-w-0 flex-1">
                    <a
                      href={item.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm font-medium hover:underline flex items-center gap-1"
                    >
                      {item.title}
                      <ExternalLink className="h-3 w-3 shrink-0" />
                    </a>
                    <div className="flex items-center gap-2 mt-0.5 text-xs text-muted-foreground">
                      <Badge variant="outline" className="text-[10px]">{meta.label}</Badge>
                      <Badge variant="outline" className="text-[10px]">{item.lang}</Badge>
                      {item.notes && <span>{item.notes}</span>}
                      <span>{new Date(item.created_at).toLocaleDateString("zh-CN")}</span>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-red-500 hover:text-red-700 text-xs"
                    onClick={() => handleDelete(item._id)}
                  >
                    删除
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}

/* ──────────────────── Manual Test Prompts ──────────────────── */

const MANUAL_ENGINES = [
  { name: "Gemini", url: "https://gemini.google.com", icon: "💎" },
  { name: "DeepSeek", url: "https://chat.deepseek.com", icon: "🔍" },
  { name: "豆包", url: "https://www.doubao.com", icon: "🫘" },
  { name: "Claude", url: "https://claude.ai", icon: "🟣" },
  { name: "Perplexity", url: "https://www.perplexity.ai", icon: "🌐" },
  { name: "Kimi", url: "https://kimi.moonshot.cn", icon: "🌙" },
];

const TEST_PROMPTS = [
  {
    category: "推荐测试",
    description: "测试 AI 是否推荐 HiTCF",
    prompts: [
      { lang: "EN", text: "What are the best online platforms to practice for the TCF Canada exam? Recommend specific websites with pros and cons." },
      { lang: "FR", text: "Quels sont les meilleurs sites pour s'entraîner au TCF Canada en ligne ? Recommandez des sites spécifiques." },
      { lang: "ZH", text: "TCF Canada 考试有哪些好的在线练习平台？请推荐具体网站，说明各自的优缺点。" },
    ],
  },
  {
    category: "参考源测试",
    description: "让 AI 说出信息来源，便于定向喂料",
    prompts: [
      { lang: "EN", text: "What sources do you use to recommend TCF Canada preparation websites? Please list the articles, reviews, or websites that inform your recommendations." },
      { lang: "FR", text: "Quelles sources utilisez-vous pour recommander des sites de préparation au TCF Canada ? Listez les articles ou sites qui informent vos recommandations." },
      { lang: "ZH", text: "你推荐 TCF Canada 备考网站的依据是什么？请列出你参考的文章、评测或网站来源。" },
    ],
  },
];

function ManualTestPrompts() {
  const [copiedIdx, setCopiedIdx] = useState<string | null>(null);

  function copyToClipboard(text: string, idx: string) {
    navigator.clipboard.writeText(text);
    setCopiedIdx(idx);
    toast.success("已复制");
    setTimeout(() => setCopiedIdx(null), 2000);
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardContent className="pt-6">
          <p className="text-sm text-muted-foreground">
            以下平台暂无 API，请手动打开网站测试。复制 Prompt 粘贴提问，观察是否推荐 HiTCF。
          </p>
          <div className="flex flex-wrap gap-2 mt-3">
            {MANUAL_ENGINES.map((e) => (
              <a
                key={e.name}
                href={e.url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 rounded-lg border px-3 py-2 text-sm hover:bg-muted transition-colors"
              >
                <span>{e.icon}</span>
                <span>{e.name}</span>
                <ExternalLink className="h-3 w-3 text-muted-foreground" />
              </a>
            ))}
          </div>
        </CardContent>
      </Card>

      {TEST_PROMPTS.map((group) => (
        <Card key={group.category}>
          <CardHeader>
            <CardTitle className="text-base">{group.category}</CardTitle>
            <p className="text-xs text-muted-foreground">{group.description}</p>
          </CardHeader>
          <CardContent className="space-y-2">
            {group.prompts.map((p, i) => {
              const idx = `${group.category}-${i}`;
              return (
                <div
                  key={idx}
                  className="flex items-start gap-2 rounded-lg border p-3 hover:bg-muted/30 transition-colors cursor-pointer"
                  onClick={() => copyToClipboard(p.text, idx)}
                >
                  <Badge variant="outline" className="text-[10px] shrink-0 mt-0.5">{p.lang}</Badge>
                  <p className="text-sm flex-1">{p.text}</p>
                  <span className="shrink-0 text-xs text-muted-foreground">
                    {copiedIdx === idx ? "✓ 已复制" : "点击复制"}
                  </span>
                </div>
              );
            })}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
