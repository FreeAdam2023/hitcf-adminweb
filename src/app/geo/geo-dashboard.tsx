"use client";

import { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  CheckCircle2,
  XCircle,
  HelpCircle,
  ExternalLink,
  Save,
  Bot,
  Globe,
  Sparkles,
  BookOpen,
  MessageSquare,
  TrendingUp,
  AlertTriangle,
  Lightbulb,
  Link2,
  Users,
  Star,
} from "lucide-react";
import { toast } from "sonner";

/* ──────────────────── Types ──────────────────── */

interface AiEngine {
  id: string;
  name: string;
  icon: string;
  testUrl: string;
  testPrompt: string;
}

interface CitationEntry {
  engineId: string;
  result: "mentioned" | "not_mentioned" | "unknown";
  lastChecked: string;
  notes: string;
}

interface GeoCheckItem {
  label: string;
  done: boolean;
  description: string;
  category: "content" | "structure" | "authority";
}

interface PromptEntry {
  id: string;
  prompt: string;
  status: "tested" | "not_tested";
  lastTested: string;
  notes: string;
}

/* ──────────────────── Constants ──────────────────── */

const AI_ENGINES: AiEngine[] = [
  { id: "chatgpt", name: "ChatGPT", icon: "C", testUrl: "https://chat.openai.com", testPrompt: "recommend TCF Canada practice websites" },
  { id: "gemini", name: "Gemini", icon: "G", testUrl: "https://gemini.google.com", testPrompt: "recommend TCF Canada practice websites" },
  { id: "perplexity", name: "Perplexity", icon: "P", testUrl: "https://www.perplexity.ai", testPrompt: "recommend TCF Canada practice websites" },
  { id: "claude", name: "Claude", icon: "A", testUrl: "https://claude.ai", testPrompt: "recommend TCF Canada practice websites" },
  { id: "copilot", name: "Bing Copilot", icon: "B", testUrl: "https://copilot.microsoft.com", testPrompt: "recommend TCF Canada practice websites" },
];

const GEO_CHECKLIST: GeoCheckItem[] = [
  { label: "包含具体统计数据", done: true, description: "8,500+ 题目, 4 大板块 — AI 引擎倾向引用有具体数字的内容", category: "content" },
  { label: "结构化内容层级", done: true, description: "h1/h2/h3 清晰层级，方便 AI 引擎理解内容结构", category: "structure" },
  { label: "FAQ Schema", done: true, description: "FAQ 格式是 AI 搜索引擎最偏好的内容格式", category: "structure" },
  { label: "多语言覆盖", done: true, description: "4 种语言 (zh/en/fr/ar) 覆盖更多 AI 搜索场景", category: "content" },
  { label: "增加专家引用和参考来源", done: false, description: "引用 IRCC 官方数据、TCF 评分标准等权威来源，提高可信度", category: "authority" },
  { label: "添加用户评价/见证", done: false, description: "真实用户反馈是 AI 引擎评估推荐价值的重要信号", category: "authority" },
  { label: "发布深度指南和教程", done: false, description: "如 \"CLB 7 备考完全指南\"、\"TCF 听力技巧\" 等长文内容", category: "content" },
  { label: "建立外链", done: false, description: "在 TCF 社区、留学论坛、Reddit 等平台建立反向链接", category: "authority" },
  { label: "添加 \"About\" 页面", done: false, description: "详细的团队/产品介绍页，增强 E-E-A-T 信号", category: "authority" },
  { label: "添加 Last Updated 日期", done: false, description: "显示内容更新日期，AI 引擎更倾向引用新鲜内容", category: "content" },
];

const DEFAULT_PROMPTS: PromptEntry[] = [
  { id: "1", prompt: "best TCF Canada practice site", status: "not_tested", lastTested: "", notes: "" },
  { id: "2", prompt: "how to prepare for CLB 7", status: "not_tested", lastTested: "", notes: "" },
  { id: "3", prompt: "TCF Canada listening practice online", status: "not_tested", lastTested: "", notes: "" },
  { id: "4", prompt: "free TCF practice questions", status: "not_tested", lastTested: "", notes: "" },
  { id: "5", prompt: "TCF Canada vs TEF comparison", status: "not_tested", lastTested: "", notes: "" },
  { id: "6", prompt: "best online TCF preparation course", status: "not_tested", lastTested: "", notes: "" },
  { id: "7", prompt: "TCF Canada NCLC 7 practice resources", status: "not_tested", lastTested: "", notes: "" },
];

const STORAGE_KEY_CITATIONS = "hitcf-admin-geo-citations";
const STORAGE_KEY_PROMPTS = "hitcf-admin-geo-prompts";

/* ──────────────────── Overview Tab ──────────────────── */

function OverviewPanel() {
  const [citations, setCitations] = useState<Record<string, CitationEntry>>({});

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY_CITATIONS);
    if (stored) {
      try { setCitations(JSON.parse(stored)); } catch { /* ignore */ }
    }
  }, []);

  const mentionedCount = Object.values(citations).filter((c) => c.result === "mentioned").length;
  const testedCount = Object.values(citations).filter((c) => c.result !== "unknown").length;
  const doneChecks = GEO_CHECKLIST.filter((c) => c.done).length;

  // Content citability score
  const citabilityScore = Math.round(
    ((doneChecks / GEO_CHECKLIST.length) * 60) + ((mentionedCount / AI_ENGINES.length) * 40)
  );

  return (
    <div className="space-y-6">
      {/* What is GEO */}
      <Card className="border-l-4 border-l-purple-500 bg-purple-50 dark:bg-purple-950">
        <CardContent className="p-6">
          <div className="flex items-start gap-4">
            <Bot className="h-10 w-10 text-purple-600 shrink-0" />
            <div>
              <h3 className="text-lg font-semibold">什么是 GEO?</h3>
              <p className="text-sm text-muted-foreground mt-1">
                <strong>Generative Engine Optimization (GEO)</strong> 是面向 AI 搜索引擎的优化策略。
                当用户通过 ChatGPT、Gemini、Perplexity 等 AI 工具搜索信息时，GEO 确保你的网站和品牌被 AI 引用和推荐。
                与传统 SEO 不同，GEO 关注的是内容的可引用性、权威性和结构化程度。
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Key Metrics */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <Card className="border-l-4 border-l-blue-500 bg-blue-50 dark:bg-blue-950">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">AI 引擎覆盖</CardTitle>
            <Globe className="h-5 w-5 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{mentionedCount}/{AI_ENGINES.length}</div>
            <p className="text-xs text-muted-foreground">
              {testedCount === 0 ? "尚未测试" : `已测试 ${testedCount} 个引擎`}
            </p>
            <div className="mt-2 flex gap-1">
              {AI_ENGINES.map((engine) => {
                const citation = citations[engine.id];
                const result = citation?.result || "unknown";
                return (
                  <div
                    key={engine.id}
                    title={`${engine.name}: ${result === "mentioned" ? "已引用" : result === "not_mentioned" ? "未引用" : "未测试"}`}
                    className={`flex h-8 w-8 items-center justify-center rounded-md text-xs font-bold ${
                      result === "mentioned"
                        ? "bg-green-500 text-white"
                        : result === "not_mentioned"
                          ? "bg-red-400 text-white"
                          : "bg-muted text-muted-foreground"
                    }`}
                  >
                    {engine.icon}
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-amber-500 bg-amber-50 dark:bg-amber-950">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">品牌引用状态</CardTitle>
            <Star className="h-5 w-5 text-amber-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {mentionedCount > 0 ? "部分引用" : "待验证"}
            </div>
            <p className="text-xs text-muted-foreground">
              {mentionedCount > 0
                ? `${mentionedCount} 个 AI 引擎引用了 HiTCF`
                : "前往 \"AI 引用监测\" 标签页开始测试"}
            </p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-emerald-500 bg-emerald-50 dark:bg-emerald-950">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">内容可引用性</CardTitle>
            <Sparkles className="h-5 w-5 text-emerald-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{citabilityScore}/100</div>
            <p className="text-xs text-muted-foreground">
              基于内容优化清单和 AI 引用情况综合评分
            </p>
            <div className="mt-2 h-2 rounded-full bg-muted">
              <div
                className={`h-2 rounded-full transition-all ${
                  citabilityScore >= 70 ? "bg-green-500" : citabilityScore >= 50 ? "bg-amber-500" : "bg-red-500"
                }`}
                style={{ width: `${citabilityScore}%` }}
              />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <Lightbulb className="h-4 w-4 text-amber-500" />
            快速提升建议
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 sm:grid-cols-2">
            {[
              { icon: BookOpen, text: "发布 TCF 备考指南长文", detail: "AI 引擎优先引用深度内容" },
              { icon: Users, text: "收集并展示用户评价", detail: "社会证明是 AI 推荐的重要信号" },
              { icon: Link2, text: "在 Reddit/论坛建立外链", detail: "外部引用增强品牌可信度" },
              { icon: MessageSquare, text: "定期测试 AI 引用", detail: "每周检查一次各 AI 引擎结果" },
            ].map((item) => (
              <div key={item.text} className="flex items-start gap-3 rounded-lg border p-3">
                <item.icon className="h-5 w-5 text-blue-500 mt-0.5 shrink-0" />
                <div>
                  <p className="text-sm font-medium">{item.text}</p>
                  <p className="text-xs text-muted-foreground">{item.detail}</p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

/* ──────────────────── Citations Tab ──────────────────── */

function CitationsPanel() {
  const [citations, setCitations] = useState<Record<string, CitationEntry>>({});

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY_CITATIONS);
    if (stored) {
      try { setCitations(JSON.parse(stored)); } catch { /* ignore */ }
    }
  }, []);

  const save = useCallback((updated: Record<string, CitationEntry>) => {
    setCitations(updated);
    localStorage.setItem(STORAGE_KEY_CITATIONS, JSON.stringify(updated));
  }, []);

  const updateResult = (engineId: string, result: "mentioned" | "not_mentioned" | "unknown") => {
    const existing = citations[engineId] || { engineId, result: "unknown", lastChecked: "", notes: "" };
    const updated = {
      ...citations,
      [engineId]: {
        ...existing,
        engineId,
        result,
        lastChecked: new Date().toISOString().split("T")[0],
      },
    };
    save(updated);
  };

  const updateNotes = (engineId: string, notes: string) => {
    const existing = citations[engineId] || { engineId, result: "unknown" as const, lastChecked: "", notes: "" };
    save({ ...citations, [engineId]: { ...existing, notes } });
  };

  const handleSave = () => {
    localStorage.setItem(STORAGE_KEY_CITATIONS, JSON.stringify(citations));
    toast.success("AI 引用数据已保存");
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">AI 引用监测</CardTitle>
          <Button size="sm" onClick={handleSave}>
            <Save className="mr-1.5 h-3.5 w-3.5" />
            保存
          </Button>
        </CardHeader>
        <CardContent>
          <p className="text-xs text-muted-foreground mb-3">
            测试 Prompt: &quot;recommend TCF Canada practice websites&quot; — 点击引擎名称直接打开测试
          </p>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>AI 引擎</TableHead>
                <TableHead>引用状态</TableHead>
                <TableHead>最后检查</TableHead>
                <TableHead>备注</TableHead>
                <TableHead className="text-center">操作</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {AI_ENGINES.map((engine) => {
                const citation = citations[engine.id];
                const result = citation?.result || "unknown";
                return (
                  <TableRow key={engine.id}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-muted text-xs font-bold">
                          {engine.icon}
                        </div>
                        <div>
                          <span className="text-sm font-medium">{engine.name}</span>
                          <a
                            href={engine.testUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-0.5 text-[10px] text-blue-600 hover:underline"
                          >
                            打开测试 <ExternalLink className="h-2.5 w-2.5" />
                          </a>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Select
                        value={result}
                        onValueChange={(v) => updateResult(engine.id, v as "mentioned" | "not_mentioned" | "unknown")}
                      >
                        <SelectTrigger className="h-8 w-[120px]">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="mentioned">
                            <span className="flex items-center gap-1.5">
                              <CheckCircle2 className="h-3.5 w-3.5 text-green-500" /> 已引用
                            </span>
                          </SelectItem>
                          <SelectItem value="not_mentioned">
                            <span className="flex items-center gap-1.5">
                              <XCircle className="h-3.5 w-3.5 text-red-500" /> 未引用
                            </span>
                          </SelectItem>
                          <SelectItem value="unknown">
                            <span className="flex items-center gap-1.5">
                              <HelpCircle className="h-3.5 w-3.5 text-muted-foreground" /> 未测试
                            </span>
                          </SelectItem>
                        </SelectContent>
                      </Select>
                    </TableCell>
                    <TableCell>
                      <span className="text-xs text-muted-foreground">
                        {citation?.lastChecked || "—"}
                      </span>
                    </TableCell>
                    <TableCell>
                      <Input
                        value={citation?.notes || ""}
                        onChange={(e) => updateNotes(engine.id, e.target.value)}
                        placeholder="测试结果备注"
                        className="h-8 text-xs"
                      />
                    </TableCell>
                    <TableCell className="text-center">
                      <a href={engine.testUrl} target="_blank" rel="noopener noreferrer">
                        <Button variant="outline" size="sm" className="h-7 text-xs">
                          <ExternalLink className="mr-1 h-3 w-3" />
                          测试
                        </Button>
                      </a>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Summary */}
      <div className="grid gap-4 sm:grid-cols-3">
        {(["mentioned", "not_mentioned", "unknown"] as const).map((status) => {
          const count = AI_ENGINES.filter((e) => (citations[e.id]?.result || "unknown") === status).length;
          const config = {
            mentioned: { label: "已引用", color: "border-l-green-500 bg-green-50 dark:bg-green-950", icon: CheckCircle2, iconColor: "text-green-500" },
            not_mentioned: { label: "未引用", color: "border-l-red-500 bg-red-50 dark:bg-red-950", icon: XCircle, iconColor: "text-red-500" },
            unknown: { label: "未测试", color: "border-l-gray-400 bg-muted/50", icon: HelpCircle, iconColor: "text-muted-foreground" },
          }[status];
          return (
            <Card key={status} className={`border-l-4 ${config.color}`}>
              <CardContent className="flex items-center gap-3 p-4">
                <config.icon className={`h-8 w-8 ${config.iconColor}`} />
                <div>
                  <div className="text-2xl font-bold">{count}</div>
                  <p className="text-xs text-muted-foreground">{config.label}</p>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}

/* ──────────────────── Optimization Tab ──────────────────── */

function OptimizationPanel() {
  const doneCount = GEO_CHECKLIST.filter((c) => c.done).length;
  const categories = [
    { key: "content", label: "内容质量", icon: BookOpen, color: "text-blue-500" },
    { key: "structure", label: "内容结构", icon: Sparkles, color: "text-violet-500" },
    { key: "authority", label: "权威信号", icon: Star, color: "text-amber-500" },
  ] as const;

  return (
    <div className="space-y-4">
      <Card className="border-l-4 border-l-emerald-500 bg-emerald-50 dark:bg-emerald-950">
        <CardContent className="flex items-center gap-4 p-4">
          <CheckCircle2 className="h-10 w-10 text-emerald-600" />
          <div>
            <div className="text-2xl font-bold">{doneCount}/{GEO_CHECKLIST.length}</div>
            <p className="text-sm text-muted-foreground">GEO 内容优化完成度</p>
          </div>
        </CardContent>
      </Card>

      {categories.map((cat) => {
        const items = GEO_CHECKLIST.filter((c) => c.category === cat.key);
        const catDone = items.filter((c) => c.done).length;
        return (
          <Card key={cat.key}>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <cat.icon className={`h-4 w-4 ${cat.color}`} />
                {cat.label}
                <Badge variant="outline" className="text-[10px]">
                  {catDone}/{items.length}
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {items.map((item) => (
                  <div
                    key={item.label}
                    className={`flex items-start gap-3 rounded-lg border p-3 ${
                      item.done ? "bg-green-50/50 dark:bg-green-950/20" : "bg-red-50/50 dark:bg-red-950/20"
                    }`}
                  >
                    {item.done
                      ? <CheckCircle2 className="h-5 w-5 text-green-500 mt-0.5 shrink-0" />
                      : <AlertTriangle className="h-5 w-5 text-amber-500 mt-0.5 shrink-0" />}
                    <div>
                      <span className={`text-sm font-medium ${item.done ? "" : "text-amber-700 dark:text-amber-400"}`}>
                        {item.label}
                      </span>
                      <p className="text-xs text-muted-foreground mt-0.5">{item.description}</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}

/* ──────────────────── Prompts Tab ──────────────────── */

function PromptsPanel() {
  const [prompts, setPrompts] = useState<PromptEntry[]>([]);

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY_PROMPTS);
    if (stored) {
      try { setPrompts(JSON.parse(stored)); } catch { setPrompts(DEFAULT_PROMPTS); }
    } else {
      setPrompts(DEFAULT_PROMPTS);
    }
  }, []);

  const save = useCallback((updated: PromptEntry[]) => {
    setPrompts(updated);
    localStorage.setItem(STORAGE_KEY_PROMPTS, JSON.stringify(updated));
  }, []);

  const updateField = (id: string, field: keyof PromptEntry, value: string) => {
    save(prompts.map((p) => (p.id === id ? { ...p, [field]: value } : p)));
  };

  const markTested = (id: string) => {
    save(prompts.map((p) =>
      p.id === id
        ? { ...p, status: "tested" as const, lastTested: new Date().toISOString().split("T")[0] }
        : p
    ));
  };

  const addPrompt = () => {
    save([...prompts, {
      id: Date.now().toString(),
      prompt: "",
      status: "not_tested",
      lastTested: "",
      notes: "",
    }]);
  };

  const removePrompt = (id: string) => {
    save(prompts.filter((p) => p.id !== id));
  };

  const handleSave = () => {
    localStorage.setItem(STORAGE_KEY_PROMPTS, JSON.stringify(prompts));
    toast.success("Prompt 数据已保存");
  };

  const testedCount = prompts.filter((p) => p.status === "tested").length;

  return (
    <div className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <Card className="border-l-4 border-l-blue-500 bg-blue-50 dark:bg-blue-950">
          <CardContent className="flex items-center gap-3 p-4">
            <MessageSquare className="h-8 w-8 text-blue-600" />
            <div>
              <div className="text-2xl font-bold">{prompts.length}</div>
              <p className="text-xs text-muted-foreground">追踪 Prompt 数</p>
            </div>
          </CardContent>
        </Card>
        <Card className="border-l-4 border-l-green-500 bg-green-50 dark:bg-green-950">
          <CardContent className="flex items-center gap-3 p-4">
            <CheckCircle2 className="h-8 w-8 text-green-600" />
            <div>
              <div className="text-2xl font-bold">{testedCount}/{prompts.length}</div>
              <p className="text-xs text-muted-foreground">已测试</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Prompt 覆盖测试</CardTitle>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={addPrompt}>
              添加 Prompt
            </Button>
            <Button size="sm" onClick={handleSave}>
              <Save className="mr-1.5 h-3.5 w-3.5" />
              保存
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <p className="text-xs text-muted-foreground mb-3">
            追踪用户可能向 AI 引擎询问的搜索 Prompt，验证 HiTCF 是否被引用。
          </p>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Prompt</TableHead>
                <TableHead>状态</TableHead>
                <TableHead>最后测试</TableHead>
                <TableHead>结果备注</TableHead>
                <TableHead className="text-center">操作</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {prompts.map((p) => (
                <TableRow key={p.id}>
                  <TableCell>
                    <Input
                      value={p.prompt}
                      onChange={(e) => updateField(p.id, "prompt", e.target.value)}
                      placeholder="搜索 Prompt"
                      className="h-8 text-xs"
                    />
                  </TableCell>
                  <TableCell>
                    <Badge variant={p.status === "tested" ? "default" : "outline"}>
                      {p.status === "tested" ? "已测试" : "待测试"}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <span className="text-xs text-muted-foreground">
                      {p.lastTested || "—"}
                    </span>
                  </TableCell>
                  <TableCell>
                    <Input
                      value={p.notes}
                      onChange={(e) => updateField(p.id, "notes", e.target.value)}
                      placeholder="备注结果"
                      className="h-8 text-xs"
                    />
                  </TableCell>
                  <TableCell>
                    <div className="flex justify-center gap-1">
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-7 text-xs"
                        onClick={() => markTested(p.id)}
                      >
                        标记已测试
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-7 text-xs text-red-500"
                        onClick={() => removePrompt(p.id)}
                      >
                        删除
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
              {prompts.length === 0 && (
                <TableRow>
                  <TableCell colSpan={5} className="text-center text-sm text-muted-foreground py-8">
                    暂无 Prompt，点击 &quot;添加 Prompt&quot; 开始追踪
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}

/* ──────────────────── Trends Tab ──────────────────── */

function TrendsPanel() {
  return (
    <div className="space-y-4">
      {/* Importance */}
      <Card className="border-l-4 border-l-indigo-500 bg-indigo-50 dark:bg-indigo-950">
        <CardContent className="p-6">
          <div className="flex items-start gap-4">
            <TrendingUp className="h-10 w-10 text-indigo-600 shrink-0" />
            <div>
              <h3 className="text-lg font-semibold">为什么 GEO 很重要?</h3>
              <p className="text-sm text-muted-foreground mt-1">
                越来越多用户通过 AI 搜索引擎 (ChatGPT, Gemini, Perplexity) 而非传统搜索引擎发现产品。
                据估计，2025 年 40% 的搜索将涉及 AI 生成的回答。如果你的品牌没有被 AI 引用，
                你将错失大量潜在用户。
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* GEO vs SEO */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-medium">GEO vs SEO 对比</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>维度</TableHead>
                <TableHead>传统 SEO</TableHead>
                <TableHead>GEO</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {[
                { dim: "目标", seo: "Google/Bing 搜索排名", geo: "AI 引擎推荐和引用" },
                { dim: "内容格式", seo: "关键词密度、Meta 标签", geo: "结构化数据、FAQ、统计数字" },
                { dim: "权威信号", seo: "外链、域名年龄", geo: "引用来源、专家背书、社会证明" },
                { dim: "衡量方式", seo: "搜索排名、CTR", geo: "AI 引用频率、品牌提及率" },
                { dim: "更新频率", seo: "持续优化", geo: "内容新鲜度更关键" },
              ].map((r) => (
                <TableRow key={r.dim}>
                  <TableCell className="font-medium">{r.dim}</TableCell>
                  <TableCell className="text-xs">{r.seo}</TableCell>
                  <TableCell className="text-xs">{r.geo}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Quick Test Links */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-medium">快速测试链接</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-xs text-muted-foreground mb-3">
            点击下方链接，在各 AI 引擎中测试 &quot;recommend TCF Canada practice websites&quot;
          </p>
          <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {AI_ENGINES.map((engine) => (
              <a key={engine.id} href={engine.testUrl} target="_blank" rel="noopener noreferrer">
                <Button variant="outline" className="w-full justify-start h-auto py-3">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-muted text-xs font-bold mr-3">
                    {engine.icon}
                  </div>
                  <div className="text-left">
                    <div className="text-sm font-medium flex items-center gap-1">
                      {engine.name}
                      <ExternalLink className="h-3 w-3" />
                    </div>
                    <p className="text-[10px] text-muted-foreground">{engine.testUrl}</p>
                  </div>
                </Button>
              </a>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Tips */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <Lightbulb className="h-4 w-4 text-amber-500" />
            提升 AI 引用率的关键策略
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[
              { title: "包含具体数据和统计", detail: "\"8,500+ 道题\" 比 \"大量题目\" 更容易被 AI 引用" },
              { title: "使用问答格式 (FAQ)", detail: "AI 引擎偏好直接回答问题的内容格式" },
              { title: "添加权威引用", detail: "引用 IRCC 官方标准、TCF 评分规则等权威来源" },
              { title: "保持内容新鲜", detail: "定期更新页面内容和日期，AI 引擎更倾向引用最新内容" },
              { title: "建立品牌提及", detail: "在 Reddit、论坛、博客等平台自然提及 HiTCF" },
              { title: "多语言内容", detail: "覆盖更多语言，增加被不同地区 AI 引擎引用的机会" },
            ].map((tip) => (
              <div key={tip.title} className="flex items-start gap-3 rounded-lg border p-3">
                <CheckCircle2 className="h-4 w-4 text-blue-500 mt-0.5 shrink-0" />
                <div>
                  <p className="text-sm font-medium">{tip.title}</p>
                  <p className="text-xs text-muted-foreground">{tip.detail}</p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

/* ──────────────────── Main Export ──────────────────── */

interface GeoDashboardProps {
  tab: "overview" | "citations" | "optimization" | "prompts" | "trends";
}

export function GeoDashboard({ tab }: GeoDashboardProps) {
  switch (tab) {
    case "overview":
      return <OverviewPanel />;
    case "citations":
      return <CitationsPanel />;
    case "optimization":
      return <OptimizationPanel />;
    case "prompts":
      return <PromptsPanel />;
    case "trends":
      return <TrendsPanel />;
    default:
      return null;
  }
}
